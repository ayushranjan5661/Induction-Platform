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

/**
 * A new tab never shares another tab's id (sharing would make them one session again). Instead
 * the server copies the most recent tab's session to this tab's own id. API calls wait for this.
 */
const last = existing ? null : read(local, LAST_KEY);
export const tabReady: Promise<void> = last
  ? fetch('/api/v1/auth/fork', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', 'x-portal': PORTAL, 'x-session': current },
      body: JSON.stringify({ from: last }),
    }).then(
      () => undefined,
      () => undefined,
    )
  : Promise.resolve();

/** The id sent with every API request from this tab. */
export const tabSessionId = (): string => current;

/**
 * Wraps a sign-in request: the tab gets a fresh session id first, and keeps it only if the sign-in
 * succeeds (so a wrong password leaves the tab as it was).
 */
export async function withFreshTabSession<T>(signIn: () => Promise<T>): Promise<T> {
  const previous = current;
  current = newId();
  try {
    const result = await signIn();
    write(session, TAB_KEY, current);
    write(local, LAST_KEY, current);
    return result;
  } catch (error) {
    current = previous;
    throw error;
  }
}
