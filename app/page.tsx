'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import HeroSceneMount from './components/hero-scene/HeroSceneMount';
import {
  CONTACT_EMAIL,
  FORM_AJAX_ENDPOINT,
  FORM_ENDPOINT,
  INSTAGRAM_URL,
  PRIVACY_URL,
  contactPromises,
  faqs,
  methodSteps,
  services,
  testimonials,
  topics,
  values,
} from './content';

const MAX_TILT = 6; // degrees

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sceneActive, setSceneActive] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const mainRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  // Scroll reveal. Content stays visible unless IntersectionObserver is available.
  useEffect(() => {
    const main = mainRef.current;
    if (!main || typeof IntersectionObserver === 'undefined') return;
    const reveals = main.querySelectorAll<HTMLElement>('[data-reveal]');
    main.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0, rootMargin: '0px 0px -6% 0px' },
    );
    reveals.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      main.classList.remove('reveal-ready');
    };
  }, []);

  // Scroll progress: one rAF-throttled transform on a ref, no React state per scroll event.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = progressRef.current;
      if (!bar) return;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Pointer tilt for .tilt elements: fine pointers only, never with reduced motion. Follows media changes.
  useEffect(() => {
    const main = mainRef.current;
    if (!main || typeof window.matchMedia !== 'function') return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let active: HTMLElement | null = null;
    let frame = 0;
    let lastEvent: PointerEvent | null = null;
    let attached = false;

    const reset = (element: HTMLElement | null) => {
      if (!element) return;
      element.style.setProperty('--rx', '0deg');
      element.style.setProperty('--ry', '0deg');
      element.style.setProperty('--gx', '50%');
      element.style.setProperty('--gy', '50%');
    };
    const clear = () => {
      lastEvent = null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      reset(active);
      active = null;
    };
    const apply = () => {
      frame = 0;
      const event = lastEvent;
      if (!event) return;
      const target = (event.target as Element | null)?.closest<HTMLElement>('.tilt') ?? null;
      if (target !== active) {
        reset(active);
        active = target;
      }
      if (!target) return;
      // Measure the untransformed wrapper so the tilt/lift of the card itself never feeds back into the maths.
      const rect = (target.parentElement ?? target).getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      target.style.setProperty('--rx', `${((0.5 - y) * 2 * MAX_TILT).toFixed(2)}deg`);
      target.style.setProperty('--ry', `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
      target.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      target.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      lastEvent = event;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const attach = () => {
      if (attached) return;
      attached = true;
      main.addEventListener('pointermove', onMove, { passive: true });
      main.addEventListener('pointerleave', clear);
      window.addEventListener('scroll', clear, { passive: true });
    };
    const detach = () => {
      if (!attached) return;
      attached = false;
      main.removeEventListener('pointermove', onMove);
      main.removeEventListener('pointerleave', clear);
      window.removeEventListener('scroll', clear);
      clear();
    };
    const sync = () => (fine.matches && !reduced.matches ? attach() : detach());
    sync();
    // Safari < 14 only has the legacy addListener/removeListener on MediaQueryList.
    const listen = (list: MediaQueryList) =>
      list.addEventListener ? list.addEventListener('change', sync) : list.addListener(sync);
    const unlisten = (list: MediaQueryList) =>
      list.removeEventListener ? list.removeEventListener('change', sync) : list.removeListener(sync);
    listen(fine);
    listen(reduced);
    return () => {
      unlisten(fine);
      unlisten(reduced);
      detach();
    };
  }, []);

  // Mobile menu: Escape closes and returns focus to the toggle; an outside click closes.
  useEffect(() => {
    if (!menuOpen) return;
    document.querySelector<HTMLElement>('#main-nav a')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    const form = event.currentTarget;
    setFormStatus('sending');

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(FORM_AJAX_ENDPOINT, {
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
    } finally {
      sendingRef.current = false;
    }
  };

  return (
    <main ref={mainRef}>
      <div className="progress-bar" ref={progressRef} aria-hidden="true" />

      <header className="site-header" ref={headerRef}>
        <a className="brand" href="#top" aria-label="Lélek és nyelv – főoldal" onClick={closeMenu}>
          <span className="brand-mark">A</span>
          <span>
            <strong>ANNA</strong>
            <small>lélek &amp; nyelv</small>
          </span>
        </a>

        <nav id="main-nav" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Főmenü">
          <a href="#rolam" onClick={closeMenu}>Rólam</a>
          <a href="#szolgaltatasok" onClick={closeMenu}>Amiben segítek</a>
          <a href="#modszertan" onClick={closeMenu}>Hogyan dolgozom</a>
          <a href="#kapcsolat" onClick={closeMenu}>Kapcsolat</a>
        </nav>

        <a className="header-cta" href="#kapcsolat">
          Ismerkedjünk meg <span aria-hidden="true">↗</span>
        </a>
        <button
          ref={toggleRef}
          className="menu-button"
          type="button"
          aria-label={menuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
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
            <p className="hero-fact"><b>60</b><span>perces alkalmak,<br />online is</span></p>
          </div>
        </div>

        <div className={`hero-visual${sceneActive ? ' has-scene' : ''}`}>
          <HeroSceneMount onActiveChange={setSceneActive} />
          <div className="orbit orbit-one" aria-hidden="true" />
          <div className="orbit orbit-two" aria-hidden="true" />
          <span className="floating-dot dot-one" aria-hidden="true" />
          <span className="floating-dot dot-two" aria-hidden="true" />
          <div className="sun-disc" aria-hidden="true">
            <span className="sun-word">grow</span>
            <span className="sun-line" />
            <span className="sun-word sun-word-bottom">belülről</span>
          </div>
          <div className="quote-card">
            <span className="quote-mark" aria-hidden="true">„</span>
            <p>A fejlődés nem verseny. Inkább egyre őszintébb beszélgetés önmagaddal.</p>
            <span className="quote-sign">A.</span>
          </div>
          <p className="visual-note" aria-hidden="true">Jelenlét <span>•</span> Kapcsolódás <span>•</span> Nyelv</p>
        </div>
      </section>

      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker">
          <div className="ticker-track">
            <span>HELLO</span><i>✦</i><span>SZIA</span><i>✦</i><span>LET&apos;S TALK</span><i>✦</i><span>KAPCSOLÓDJUNK</span><i>✦</i>
            <span>HELLO</span><i>✦</i><span>SZIA</span><i>✦</i><span>LET&apos;S TALK</span><i>✦</i><span>KAPCSOLÓDJUNK</span><i>✦</i>
          </div>
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
              <span className="stamp">lélek<br />&amp; nyelv</span>
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
              <a className="text-link" href="#modszertan">Ismerd meg a szemléletem <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="values" aria-label="Értékeim">
        {values.map((value) => (
          <div key={value.number} data-reveal>
            <b>{value.number}</b>
            <span>{value.label[0]}<br />{value.label[1]}</span>
          </div>
        ))}
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

          <div className="service-stage">
            {services.map((service) => (
              <div className="service-slot" data-reveal key={service.id}>
                <article className={`service-card tilt service-${service.slug}`}>
                  <div className="service-topline">
                    <span>{service.index} / {service.area}</span>
                    <span>{service.duration}</span>
                  </div>
                  <div className="service-content">
                    <div className="service-head">
                      <span className="service-symbol" aria-hidden="true">{service.symbol}</span>
                      <h3>{service.name}</h3>
                      {service.scope && <p className="service-scope">{service.scope}</p>}
                      {service.audience && <p className="service-audience">{service.audience}</p>}
                    </div>
                    <div className="service-details">
                      <p>{service.description}</p>
                      <ul>
                        {service.chips.map((chip) => <li key={chip}>{chip}</li>)}
                      </ul>
                      <p className="service-price">{service.price}</p>
                      <a href="#kapcsolat" className="round-link" aria-label={service.ariaLabel}>↗</a>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>

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
            {methodSteps.map((step) => (
              <article data-reveal key={step.number}>
                <span className="step-number">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
                <span className="step-word" aria-hidden="true">{step.word}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="voices" id="visszajelzesek" aria-labelledby="voices-title">
        <div className="voices-heading">
          <p className="section-kicker" data-reveal>Visszajelzések</p>
          <h2 id="voices-title" data-reveal>Mások <em>szavaival.</em></h2>
        </div>
        <ul className="voices-stage" role="list">
          {testimonials.map((item) => (
            <li className="voice" key={item.id}>
              <figure className="voice-card tilt">
                <span className="voice-chip">{item.category}</span>
                <blockquote className="voice-pull" aria-hidden="true">„{item.pull}”</blockquote>
                <p className="voice-text">{item.text}</p>
                <figcaption className="voice-author">
                  <b>{item.author}</b>
                  <span>{item.label}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
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
          {contactPromises.map((promise) => (
            <div className="contact-promise" key={promise.number}>
              <span>{promise.number}</span><p><b>{promise.title}</b><br />{promise.subline}</p>
            </div>
          ))}
        </div>

        <form
          className="contact-form"
          action={FORM_ENDPOINT}
          method="POST"
          onSubmit={handleSubmit}
          onChange={() => setFormStatus((status) => (status === 'sent' || status === 'error' ? 'idle' : status))}
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
              {topics.map((topic) => (
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
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          {INSTAGRAM_URL && <a href={INSTAGRAM_URL} rel="noopener noreferrer" target="_blank">Instagram ↗</a>}
        </div>
        <div className="footer-small">
          <span>© {new Date().getFullYear()} Anna</span>
          {PRIVACY_URL && <a href={PRIVACY_URL}>Adatkezelés</a>}
        </div>
      </footer>
    </main>
  );
}
