import { IMPRINT_TITLE, PRIVACY_TITLE, imprint, privacySections } from '../content';
import SiteFooter from './SiteFooter';
import { renderInline } from '../lib/inline';

/** Standalone privacy notice page. No hooks, no 3D: it renders the same on the server and in the Pages build. */
export default function PrivacyPage() {
  return (
    <>
      <a className="skip-link" href="#main">Ugrás a tartalomra</a>
      <header className="site-header privacy-header">
        <a className="brand" href="../" aria-label="Anna, Lélek & Nyelv, vissza a főoldalra">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>
            <strong>ANNA</strong>
            <small>lélek &amp; nyelv</small>
          </span>
        </a>
        <a className="header-cta privacy-back" href="../">
          <span aria-hidden="true">←</span> Vissza a főoldalra
        </a>
      </header>

      <main id="main" tabIndex={-1} className="privacy" aria-labelledby="privacy-title">
        <div className="privacy-inner">
          <p className="section-kicker">Jogi tájékoztató</p>
          <h1 id="privacy-title">{PRIVACY_TITLE}</h1>
          {privacySections.map((section) => (
            <section className="privacy-block" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((text) => <p key={text}>{renderInline(text)}</p>)}
              {section.items && (
                <ul>
                  {section.items.map((item) => <li key={item}>{renderInline(item)}</li>)}
                </ul>
              )}
              {section.after?.map((text) => <p key={text}>{renderInline(text)}</p>)}
            </section>
          ))}
          <section className="privacy-block privacy-imprint">
            <h2>{IMPRINT_TITLE}</h2>
            <dl>
              {imprint.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{renderInline(row.value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
