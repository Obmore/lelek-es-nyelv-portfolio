'use client';

import { FormEvent, useEffect, useState } from 'react';

const faqs = [
  {
    question: 'Honnan tudhatom, melyik folyamat való nekem?',
    answer: 'Az első, díjmentes 20 perces beszélgetésen közösen ránézünk arra, miben vagy most, és mire lenne szükséged. Ha az angol és az önismeret egyszerre fontos, a két területet finoman össze is kapcsolhatjuk.',
  },
  {
    question: 'Online vagy személyesen találkozunk?',
    answer: 'Az alkalmak online zajlanak, így bárhonnan csatlakozhatsz egy nyugodt, zavartalan helyről. A személyes találkozás lehetőségéről az első beszélgetésen egyeztetünk.',
  },
  {
    question: 'Mi történik, ha félek angolul megszólalni?',
    answer: 'Pont ebből indulunk. Nem a hibátlan mondat a cél, hanem hogy biztonságban maradj akkor is, amikor keresed a szavakat. A nyelvtanulás tempóját hozzád, nem egy tankönyvhöz igazítom.',
  },
  {
    question: 'Hány alkalommal érdemes számolnom?',
    answer: 'Nincs kötelező csomag vagy előre eldöntött hossz. Az első néhány alkalom után együtt értékeljük, mi szolgál téged a legjobban, és ehhez igazítjuk a folytatást.',
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.14 },
    );
    reveals.forEach((element) => observer.observe(element));

    const updateProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? (window.scrollY / available) * 100 : 0);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setFormStatus('sending');

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('https://formsubmit.co/ajax/benzdsiott1998@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { success?: boolean | string };

      if (!response.ok || result.success === false || result.success === 'false') {
        throw new Error('A küldés sikertelen.');
      }

      form.reset();
      setFormStatus('sent');
    } catch {
      setFormStatus('error');
    }
  };

  return (
    <main>
      <div className="progress-bar" style={{ width: `${progress}%` }} aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Lélek és nyelv – főoldal" onClick={closeMenu}>
          <span className="brand-mark">A</span>
          <span>
            <strong>ANNA</strong>
            <small>lélek &amp; nyelv</small>
          </span>
        </a>

        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Főmenü">
          <a href="#rolam" onClick={closeMenu}>Rólam</a>
          <a href="#szolgaltatasok" onClick={closeMenu}>Amiben segítek</a>
          <a href="#modszertan" onClick={closeMenu}>Hogyan dolgozom</a>
          <a href="#kapcsolat" onClick={closeMenu}>Kapcsolat</a>
        </nav>

        <a className="header-cta" href="#kapcsolat">
          Ismerkedjünk meg <span aria-hidden="true">↗</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span />
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow reveal-first"><span /> Mentálhigiéné &amp; angoltanítás</p>
          <h1 className="reveal-second">
            Biztos tér.<br />
            <em>Bátrabb hang.</em>
          </h1>
          <p className="hero-lead reveal-third">
            Segítek közelebb kerülni önmagadhoz — és magabiztosabban
            megszólalni angolul. Figyelemmel, kíváncsisággal, a saját ritmusodban.
          </p>
          <div className="hero-actions reveal-third">
            <a className="button button-primary" href="#szolgaltatasok">
              Fedezd fel, hogyan segítek <span aria-hidden="true">→</span>
            </a>
            <p><b>01</b> emberközpontú<br />szemlélet</p>
          </div>
        </div>

        <div className="hero-visual" aria-label="Nyugodt, személyes fejlődést jelképező illusztráció">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="floating-dot dot-one" />
          <span className="floating-dot dot-two" />
          <div className="sun-disc">
            <span className="sun-word">grow</span>
            <span className="sun-line" />
            <span className="sun-word sun-word-bottom">belülről</span>
          </div>
          <div className="quote-card">
            <span className="quote-mark">“</span>
            <p>A fejlődés nem verseny. Inkább egyre őszintébb beszélgetés önmagaddal.</p>
            <span className="quote-sign">A.</span>
          </div>
          <p className="visual-note">Jelenlét <span>•</span> Kapcsolódás <span>•</span> Nyelv</p>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>HELLO</span><i>✦</i><span>SZIA</span><i>✦</i><span>LET&apos;S TALK</span><i>✦</i><span>KAPCSOLÓDJUNK</span><i>✦</i>
          <span>HELLO</span><i>✦</i><span>SZIA</span><i>✦</i><span>LET&apos;S TALK</span><i>✦</i><span>KAPCSOLÓDJUNK</span><i>✦</i>
        </div>
      </div>

      <section className="about section-shell" id="rolam">
        <div className="section-number" data-reveal>
          <span>01</span>
          <p>Rólam</p>
        </div>
        <div className="about-main">
          <p className="section-kicker" data-reveal>Ember az ember mellett</p>
          <h2 data-reveal>
            Nem megjavítani szeretnélek.<br />
            <em>Hanem figyelni rád.</em>
          </h2>
          <div className="about-grid">
            <div className="about-portrait" data-reveal>
              <div className="portrait-shape">
                <span className="portrait-initial">A</span>
                <span className="portrait-caption">presence<br />before<br />performance</span>
              </div>
              <span className="stamp">12+ év<br />emberekkel</span>
            </div>
            <div className="about-copy" data-reveal>
              <p className="lead-serif">
                Anna vagyok, mentálhigiénés segítő szakember és angoltanár.
                Abban hiszek, hogy a valódi tanulás és változás ugyanonnan indul:
                abból, hogy biztonságban érezzük magunkat.
              </p>
              <p>
                Nem kész receptekkel érkezem. Kérdezek, visszatükrözök, és veled
                együtt keresem azt az utat, ami valóban a tiéd — legyen szó egy
                nehéz élethelyzetről vagy az első magabiztos angol mondatodról.
              </p>
              <a className="text-link" href="#modszertan">Ismerd meg a szemléletem <span>→</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="values" aria-label="Értékeim">
        <div data-reveal><b>01</b><span>Ítéletmentes<br />figyelem</span></div>
        <div data-reveal><b>02</b><span>Személyre szabott<br />folyamat</span></div>
        <div data-reveal><b>03</b><span>Gyakorlatias<br />eszközök</span></div>
        <div data-reveal><b>04</b><span>Humor és<br />könnyedség</span></div>
      </section>

      <section className="services section-shell" id="szolgaltatasok">
        <div className="section-number light" data-reveal>
          <span>02</span>
          <p>Amiben segítek</p>
        </div>
        <div className="services-main">
          <div className="services-heading">
            <p className="section-kicker" data-reveal>Két út, egy közös alap</p>
            <h2 data-reveal>Találd meg azt,<br /><em>amire most szükséged van.</em></h2>
          </div>

          <article className="service-card service-mind" data-reveal>
            <div className="service-topline"><span>01 / MENTÁLHIGIÉNÉ</span><span>50 PERC</span></div>
            <div className="service-content">
              <div>
                <span className="service-symbol">↺</span>
                <h3>Egyéni segítő<br />beszélgetés</h3>
              </div>
              <div className="service-details">
                <p>Ha túl sok lett. Ha változnál. Ha szeretnéd végre meghallani a saját válaszaidat.</p>
                <ul>
                  <li>élethelyzeti elakadások</li>
                  <li>önismeret és határok</li>
                  <li>stressz és egyensúly</li>
                </ul>
                <a href="#kapcsolat" className="round-link" aria-label="Érdeklődöm az egyéni beszélgetésről">↗</a>
              </div>
            </div>
          </article>

          <article className="service-card service-language" data-reveal>
            <div className="service-topline"><span>02 / ANGOL</span><span>50 PERC</span></div>
            <div className="service-content">
              <div>
                <span className="service-symbol">Aa</span>
                <h3>Angol, amiben<br />te is benne vagy</h3>
              </div>
              <div className="service-details">
                <p>Beszédközpontú órák felnőtteknek — a görcsös teljesítés helyett valódi kapcsolódással.</p>
                <ul>
                  <li>beszédbátorság</li>
                  <li>munkahelyi angol</li>
                  <li>önazonos kommunikáció</li>
                </ul>
                <a href="#kapcsolat" className="round-link" aria-label="Érdeklődöm az angolórákról">↗</a>
              </div>
            </div>
          </article>

          <p className="service-note" data-reveal>
            A mentálhigiénés segítő beszélgetés nem pszichoterápia, és nem helyettesít pszichológiai vagy egészségügyi ellátást.
          </p>
        </div>
      </section>

      <section className="method section-shell" id="modszertan">
        <div className="section-number" data-reveal>
          <span>03</span>
          <p>Hogyan dolgozom</p>
        </div>
        <div className="method-main">
          <div className="method-intro">
            <p className="section-kicker" data-reveal>A folyamat</p>
            <h2 data-reveal>Nem kell előre<br /><em>tudnod az utat.</em></h2>
            <p data-reveal>Elég, ha megérkezel. A többit lépésről lépésre közösen alakítjuk.</p>
          </div>
          <div className="steps">
            <article data-reveal>
              <span className="step-number">01</span>
              <div><h3>Kapcsolódunk</h3><p>Egy rövid, díjmentes online beszélgetésen megismerjük egymást és a kérdésedet.</p></div>
              <span className="step-word">hello</span>
            </article>
            <article data-reveal>
              <span className="step-number">02</span>
              <div><h3>Irányt találunk</h3><p>Közösen megfogalmazzuk, miben szeretnél változást, és mi segíthet ebben.</p></div>
              <span className="step-word">notice</span>
            </article>
            <article data-reveal>
              <span className="step-number">03</span>
              <div><h3>Haladunk</h3><p>A saját tempódban gyakorlunk, reflektálunk, és időről időre ránézünk a megtett útra.</p></div>
              <span className="step-word">grow</span>
            </article>
          </div>
        </div>
      </section>

      <section className="testimonial-section">
        <div className="testimonial-copy" data-reveal>
          <p className="section-kicker">Visszajelzés</p>
          <blockquote>
            “Anna óráin először mertem úgy angolul beszélni, hogy közben nem javítottam ki fejben minden szavamat. Furcsa módon ettől lettem sokkal pontosabb — és szabadabb.”
          </blockquote>
          <p className="testimonial-author"><b>Réka</b><span>üzleti angol, 8 hónap</span></p>
        </div>
        <div className="testimonial-art" aria-hidden="true">
          <span className="arch arch-one" /><span className="arch arch-two" /><span className="arch arch-three" />
          <p>space<br /><em>to be</em></p>
        </div>
      </section>

      <section className="faq section-shell" id="gyik">
        <div className="section-number" data-reveal>
          <span>04</span>
          <p>Gyakori kérdések</p>
        </div>
        <div className="faq-main">
          <p className="section-kicker" data-reveal>Mielőtt belevágunk</p>
          <h2 data-reveal>Jó kérdés.<br /><em>Beszéljünk róla.</em></h2>
          <div className="faq-list" data-reveal>
            {faqs.map((faq, index) => (
              <details key={faq.question}>
                <summary><span>{String(index + 1).padStart(2, '0')}</span>{faq.question}<i aria-hidden="true">+</i></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="kapcsolat">
        <div className="contact-intro" data-reveal>
          <p className="section-kicker">Első lépés</p>
          <h2>Van kedved<br /><em>beszélgetni?</em></h2>
          <p>Mesélj röviden arról, mivel keresel, és add meg, hogyan érhetlek el. Az üzeneted rendezett formában, közvetlenül Anna postafiókjába érkezik.</p>
          <div className="contact-promise">
            <span>01</span><p><b>Díjmentes első beszélgetés</b><br />20 perc, online</p>
          </div>
          <div className="contact-promise">
            <span>02</span><p><b>Válasz egy munkanapon belül</b><br />e-mailben vagy telefonon</p>
          </div>
        </div>

        <form
          className="contact-form"
          action="https://formsubmit.co/benzdsiott1998@gmail.com"
          method="POST"
          onSubmit={handleSubmit}
          onChange={() => formStatus !== 'idle' && setFormStatus('idle')}
          data-reveal
        >
          <input type="hidden" name="_subject" value="Új megkeresés — Lélek & Nyelv" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="text" name="_honey" className="honey-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <div className="form-heading">
            <span>ÚJ ÜZENET</span>
            <span>ANNA RÉSZÉRE</span>
          </div>

          <fieldset className="topic-fieldset">
            <legend>Mivel kapcsolatban keresel?</legend>
            <div className="topic-options">
              {['Mentálhigiénés beszélgetés', 'Angolóra', 'Mindkettő', 'Egyéb'].map((topic) => (
                <label key={topic}>
                  <input type="radio" name="Megkeresés témája" value={topic} required />
                  <span>{topic}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-grid">
            <label className="field">
              <span>Neved</span>
              <input type="text" name="Név" placeholder="Hogy szólíthatlak?" autoComplete="name" required />
            </label>
            <label className="field">
              <span>E-mail címed</span>
              <input type="email" name="E-mail" placeholder="nev@email.hu" autoComplete="email" required />
            </label>
            <label className="field">
              <span>Telefonszámod <i>opcionális</i></span>
              <input type="tel" name="Telefonszám" placeholder="+36 30 123 4567" autoComplete="tel" />
            </label>
            <label className="field">
              <span>Hogyan válaszoljak?</span>
              <select name="Preferált elérhetőség" defaultValue="E-mailben" required>
                <option>E-mailben</option>
                <option>Telefonon</option>
                <option>Mindegy</option>
              </select>
            </label>
            <label className="field message-field">
              <span>Üzeneted</span>
              <textarea name="Üzenet" placeholder="Néhány mondat arról, miben vagy most, és miben lenne jó támogatást kapnod…" rows={6} required />
            </label>
          </div>

          <label className="consent-field">
            <input type="checkbox" name="Adatkezelési hozzájárulás" value="Elfogadva" required />
            <span>Hozzájárulok, hogy a megadott adataimat Anna a kapcsolatfelvétel és válaszadás céljából kezelje.</span>
          </label>

          <div className="form-submit-row">
            <button className="button button-light" type="submit" disabled={formStatus === 'sending'}>
              {formStatus === 'sending' ? 'Küldés folyamatban…' : 'Üzenet elküldése'} <span aria-hidden="true">↗</span>
            </button>
            <p className={`form-status ${formStatus}`} role="status" aria-live="polite">
              {formStatus === 'sent' && 'Köszönöm! Az üzeneted úton van Annához.'}
              {formStatus === 'error' && 'Most nem sikerült elküldeni. Kérlek, próbáld újra.'}
            </p>
          </div>
        </form>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top" aria-label="Vissza az oldal tetejére">
          <span className="brand-mark">A</span>
          <span><strong>ANNA</strong><small>lélek &amp; nyelv</small></span>
        </a>
        <div className="footer-contact">
          <a href="mailto:benzdsiott1998@gmail.com">benzdsiott1998@gmail.com</a>
          <a href="#top">Instagram ↗</a>
        </div>
        <div className="footer-small">
          <span>© {new Date().getFullYear()} Anna</span>
          <a href="#top">Adatkezelés</a>
        </div>
      </footer>
    </main>
  );
}
