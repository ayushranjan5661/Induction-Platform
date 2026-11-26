/**
 * One sign-in per browser tab.
 *
 * Tabs share cookies, so the API keeps a separate httpOnly session cookie per tab, named by the
 * id this module sends in the `x-session` header. The id lives in sessionStorage (per tab, kept
 * across reloads). A new tab gets its own id holding a copy of the most recent sign-in, so opening
 * the app in another tab keeps you signed in; signing in or out on a tab never changes another.
 */
import { PORTAL } from './portal';

const TAB_KEY = 'induction.tab-session';
const LAST_KEY = 'induction.last-tab-session';
const CHANNEL = 'induction.tab-sessions';

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string): void {
  try {
    storage().setItem(key, value);
  } catch {
    // Storage blocked (private mode etc.): the id still works for this page load.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

function newId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const existing = read(session, TAB_KEY);
let current: string = existing ?? newId();
write(session, TAB_KEY, current);

/* Open tabs answer "who has this id?", so a duplicated tab (which copies sessionStorage) can tell. */
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
channel?.addEventListener('message', (event: MessageEvent<{ ask?: string }>) => {
  if (event.data.ask && event.data.ask === current) channel.postMessage({ held: current });
});

function heldByAnotherTab(id: string): Promise<boolean> {
  if (!channel) return Promise.resolve(false);
  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent<{ held?: string }>) => {
      if (event.data.held === id) finish(true);
    };
    const finish = (held: boolean) => {
      window.clearTimeout(timer);
      channel.removeEventListener('message', onMessage);
      resolve(held);
    };
    const timer = window.setTimeout(() => finish(false), 150);
    channel.addEventListener('message', onMessage);
    channel.postMessage({ ask: id });
  });
}

function fork(from: string): Promise<void> {
  return fetch('/api/v1/auth/fork', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', 'x-portal': PORTAL, 'x-session': current },
    body: JSON.stringify({ from }),
  }).then(
    () => undefined,
    () => undefined,
  );
}

/**
 * Before this tab's first API call:
 * - a new tab copies the most recent sign-in to its own id;
 * - a duplicated tab (same id as a tab that is still open) moves to its own id, with a copy.
 * Tabs never share an id, so they are never one session.
 */
async function prepare(): Promise<void> {
  if (!existing) {
    const last = read(local, LAST_KEY);
    if (last) await fork(last);
    return;
  }
  if (await heldByAnotherTab(existing)) {
    current = newId();
    write(session, TAB_KEY, current);
    await fork(existing);
  }
}
export const tabReady: Promise<void> = prepare();

/** The id sent with every API request from this tab. */
export const tabSessionId = (): string => current;

/** During a sign-in, the id being replaced; the server clears its cookie. */
let retiring: string | null = null;
export const retiringTabSessionId = (): string | null => retiring;

/**
 * Wraps a sign-in request: the tab gets a fresh session id first, and keeps it only if the sign-in
 * succeeds (so a wrong password leaves the tab as it was). The old id's cookie is cleared.
 */
export async function withFreshTabSession<T>(signIn: () => Promise<T>): Promise<T> {
  const previous = current;
  current = newId();
  retiring = previous;
  try {
    const result = await signIn();
    write(session, TAB_KEY, current);
    write(local, LAST_KEY, current);
    return result;
  } catch (error) {
    current = previous;
    throw error;
  } finally {
    retiring = null;
  }
}
