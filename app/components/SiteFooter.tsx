'use client';

import { useSyncExternalStore } from 'react';
import { CONTACT_EMAIL, FACEBOOK_URL, INSTAGRAM_URL, OWNER_NAME, PRIVACY_URL } from '../content';

const subscribeNever = () => () => {};

/** Shared footer. `home` links the brand to the top of the page; otherwise to the home page and without the self-link to the notice. */
export default function SiteFooter({ home = false }: { home?: boolean }) {
  // The year is computed at render time: remount it after hydration so a New Year mismatch never sticks.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  return (
    <footer>
      <a
        className="brand footer-brand"
        href={home ? '#top' : '../'}
        aria-label={home ? 'Vissza az oldal tetejére' : 'Vissza a főoldalra'}
      >
        <span className="brand-mark">A</span>
        <span><strong>ANNA</strong><small>lélek &amp; nyelv</small></span>
      </a>
      <div className="footer-contact">
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        {INSTAGRAM_URL && <a href={INSTAGRAM_URL} rel="noopener noreferrer" target="_blank">Instagram ↗<span className="sr-only">{' (új lapon nyílik)'}</span></a>}
        {FACEBOOK_URL && <a href={FACEBOOK_URL} rel="noopener noreferrer" target="_blank">Facebook ↗<span className="sr-only">{' (új lapon nyílik)'}</span></a>}
      </div>
      <div className="footer-small">
        <span>© <span key={hydrated ? 'client' : 'server'} suppressHydrationWarning>{new Date().getFullYear()}</span> {OWNER_NAME}</span>
        {home && PRIVACY_URL && <a href={PRIVACY_URL}>Adatkezelés</a>}
      </div>
    </footer>
  );
}
