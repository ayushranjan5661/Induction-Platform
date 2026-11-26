/**
 * Which web app this build is. The same code runs as two apps on separate ports:
 * the staff app (Admin, HR, Legal) and the candidate app (sign-in, invite links, induction).
 * `vite --mode candidate` builds the candidate app; anything else is the staff app.
 */
import { useEffect } from 'react';

export type Portal = 'staff' | 'candidate';

export const PORTAL: Portal = import.meta.env.MODE === 'candidate' ? 'candidate' : 'staff';
export const IS_CANDIDATE_APP = PORTAL === 'candidate';

const trim = (url: string): string => url.replace(/\/$/, '');

/** Where each app lives, for links between them. Override with VITE_STAFF_APP_URL / VITE_CANDIDATE_APP_URL. */
export const STAFF_APP_URL = trim(
  (import.meta.env.VITE_STAFF_APP_URL as string | undefined) ?? 'http://localhost:5173',
);
export const CANDIDATE_APP_URL = trim(
  (import.meta.env.VITE_CANDIDATE_APP_URL as string | undefined) ?? 'http://localhost:5174',
);

/** This app's sign-in page. */
export const LOGIN_PATH = IS_CANDIDATE_APP ? '/candidate' : '/login';

/** Full URL of the other app's sign-in page, optionally with the email filled in. */
export function otherSignInUrl(email?: string): string {
  const url = IS_CANDIDATE_APP ? `${STAFF_APP_URL}/login` : `${CANDIDATE_APP_URL}/candidate`;
  return email ? `${url}?email=${encodeURIComponent(email)}` : url;
}

/** Sends the browser to the same path on the other app (e.g. an old invite link opened on the staff app). */
export function GoToApp({ app }: { app: Portal }): null {
  useEffect(() => {
    const base = app === 'candidate' ? CANDIDATE_APP_URL : STAFF_APP_URL;
    window.location.replace(`${base}${window.location.pathname}${window.location.search}`);
  }, [app]);
  return null;
}
