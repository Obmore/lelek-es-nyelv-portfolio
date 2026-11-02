'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { FormStatus, FormStatusText } from './components/FormStatus';
import SiteFooter from './components/SiteFooter';
import HeroSceneMount from './components/hero-scene/HeroSceneMount';
import { subscribeMedia } from './lib/media';
import {
  ABOUT_STAMP,
  CONSENT_AFTER,
  CONSENT_BEFORE,
  CONSENT_LINK,
  FORM_AJAX_ENDPOINT,
  FORM_ENDPOINT,
  PRIVACY_URL,
  aboutParagraphs,
  contactPromises,
  faqs,
  methodSteps,
  services,
  testimonials,
  topics,
  values,
} from './content';

const MAX_TILT = 6; // degrees
const FORM_TIMEOUT_MS = 25000;
const DEFAULT_REPLY = 'E-mailben';
const PHONE_REPLY = 'Telefonon';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sceneActive, setSceneActive] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const mainRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const [replyPref, setReplyPref] = useState(DEFAULT_REPLY);
  const phoneRequired = replyPref === PHONE_REPLY;

  // The notice moved to its own page: forward old #adatkezeles links.
  useEffect(() => {
    const target = PRIVACY_URL;
    if (!target) return;
    const forward = () => {
      if (window.location.hash === '#adatkezeles') window.location.replace(target);
    };
    forward();
    window.addEventListener('hashchange', forward);
    return () => window.removeEventListener('hashchange', forward);
  }, []);

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
    // The page height changes without scroll/resize (FAQ details, font swap, long sections): recompute then too.
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onScroll);
      resizeObserver.observe(document.documentElement);
    }
    return () => {
      resizeObserver?.disconnect();
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
    const unsubscribes = [subscribeMedia(fine, sync), subscribeMedia(reduced, sync)];
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
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

  // The native anchor jump still scrolls; when the mobile menu was open its focused link is about to be hidden,
  // so keep keyboard and screen-reader users in place by moving focus to the target section.
  const goTo = (id: string) => () => {
    const wasOpen = menuOpen;
    setMenuOpen(false);
    if (wasOpen) document.getElementById(id)?.focus({ preventScroll: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    const form = event.currentTarget;
    setFormStatus('sending');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), FORM_TIMEOUT_MS);

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(FORM_AJAX_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json() as { success?: boolean | string };

      if (!response.ok || result.success === false || result.success === 'false') {
        throw new Error('A küldés sikertelen.');
      }

      form.reset();
      setReplyPref(DEFAULT_REPLY);
      setFormStatus('sent');
    } catch {
      // A timed-out request may still have been delivered: tell the visitor so, and keep the form content.
      setFormStatus(controller.signal.aborted ? 'uncertain' : 'error');
    } finally {
      window.clearTimeout(timeout);
      sendingRef.current = false;
    }
  };

  return (
    <>
      <div className="progress-bar" ref={progressRef} aria-hidden="true" />

      <header className="site-header" ref={headerRef}>
        <a className="brand" href="#top" aria-label="Lélek és nyelv – főoldal" onClick={goTo('top')}>
          <span className="brand-mark">A</span>
          <span>
            <strong>ANNA</strong>
            <small>lélek &amp; nyelv</small>
          </span>
        </a>

        <nav id="main-nav" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Főmenü">
          <a href="#rolam" onClick={goTo('rolam')}>Rólam</a>
          <a href="#szolgaltatasok" onClick={goTo('szolgaltatasok')}>Amiben segítek</a>
          <a href="#modszertan" onClick={goTo('modszertan')}>Hogyan dolgozom</a>
          <a href="#kapcsolat" onClick={goTo('kapcsolat')}>Kapcsolat</a>
        </nav>

        <a className="header-cta" href="#kapcsolat" onClick={goTo('kapcsolat')}>
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

      <main ref={mainRef}>
        <section className="hero" id="top" tabIndex={-1} aria-labelledby="top-title">
          <div className="hero-copy">
            <p className="eyebrow reveal-first"><span /> Mentálhigiéné &amp; angoltanítás</p>
            <h1 id="top-title" className="reveal-second">
              Biztos tér.<br />
              <em>Bátrabb hang.</em>
            </h1>
            <p className="hero-lead reveal-third">
              Segítek közelebb kerülni önmagadhoz, és magabiztosabban
              megszólalni angolul. Figyelemmel, kíváncsisággal, a saját ritmusodban.
            </p>
            <div className="hero-actions reveal-third">
              <a className="button button-primary" href="#szolgaltatasok">
                Fedezd fel, hogyan segítek <span aria-hidden="true">→</span>
              </a>
              <p className="hero-fact"><b>60</b><span>perces alkalmak, személyesen és online</span></p>
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

        <section className="about section-shell" id="rolam" tabIndex={-1} aria-labelledby="rolam-title">
          <div className="section-number" data-reveal>
            <span>01</span>
            <p>Rólam</p>
          </div>
          <div className="about-main">
            <p className="section-kicker" data-reveal>Ember az ember mellett</p>
            <h2 id="rolam-title" data-reveal>
              Nem megjavítani szeretnélek.{' '}
              <em className="line-block">Hanem figyelni rád.</em>
            </h2>
            <div className="about-grid">
              <div className="about-portrait" data-reveal>
                <div className="portrait-shape">
                  <span className="portrait-initial">A</span>
                  <span className="portrait-caption">presence<br />before<br />performance</span>
                </div>
                <span className="stamp">{ABOUT_STAMP}</span>
              </div>
              <div className="about-copy" data-reveal>
                <p className="lead-serif">{aboutParagraphs[0]}</p>
                {aboutParagraphs.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
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

        <section className="services section-shell" id="szolgaltatasok" tabIndex={-1} aria-labelledby="szolgaltatasok-title">
          <div className="section-number light" data-reveal>
            <span>02</span>
            <p>Amiben segítek</p>
          </div>
          <div className="services-main">
            <div className="services-heading">
              <p className="section-kicker" data-reveal>Két út, egy közös alap</p>
              <h2 id="szolgaltatasok-title" data-reveal>Találd meg azt,<br /><em>amire most szükséged van.</em></h2>
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
                        {service.level && <p className="service-scope service-level">{service.level}</p>}
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

        <section className="method section-shell" id="modszertan" tabIndex={-1} aria-labelledby="modszertan-title">
          <div className="section-number" data-reveal>
            <span>03</span>
            <p>Hogyan dolgozom</p>
          </div>
          <div className="method-main">
            <div className="method-intro">
              <p className="section-kicker" data-reveal>A folyamat</p>
              <h2 id="modszertan-title" data-reveal>Nem kell előre<br /><em>tudnod az utat.</em></h2>
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

        <section className="contact" id="kapcsolat" tabIndex={-1} aria-labelledby="kapcsolat-title">
          <div className="contact-intro" data-reveal>
            <p className="section-kicker">Első lépés</p>
            <h2 id="kapcsolat-title">Van kedved <em className="line-block">beszélgetni?</em></h2>
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
            <input type="hidden" name="_subject" value="Új megkeresés a Lélek & Nyelv oldalról" />
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
                <span>E-mail-címed</span>
                <input type="email" name="E-mail" placeholder="nev@email.hu" autoComplete="email" required />
              </label>
              <label className="field">
                <span>Hogyan válaszoljak?</span>
                <select name="Preferált elérhetőség" value={replyPref} onChange={(event) => setReplyPref(event.target.value)} required>
                  <option>{DEFAULT_REPLY}</option>
                  <option>{PHONE_REPLY}</option>
                  <option>Mindegy</option>
                </select>
              </label>
              <label className="field">
                <span>Telefonszámod <i>{phoneRequired ? '(kötelező)' : '(opcionális)'}</i></span>
                <input type="tel" name="Telefonszám" placeholder="+36 30 123 4567" autoComplete="tel" required={phoneRequired} />
              </label>
              <label className="field message-field">
                <span>Üzeneted</span>
                <textarea name="Üzenet" placeholder="Néhány mondat arról, miben vagy most, és miben lenne jó támogatást kapnod…" rows={6} required />
              </label>
            </div>

            <label className="consent-field">
              <input type="checkbox" name="Adatkezelési hozzájárulás" value="Elfogadva" required />
              <span>
                {CONSENT_BEFORE}{' '}
                {PRIVACY_URL ? (
                  <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                    {CONSENT_LINK}
                    <span className="sr-only">{' (új lapon nyílik)'}</span>
                  </a>
                ) : (
                  CONSENT_LINK
                )}
                {CONSENT_AFTER}
              </span>
            </label>

            <div className="form-submit-row">
              <button className="button button-light" type="submit" disabled={formStatus === 'sending'}>
                {formStatus === 'sending' ? 'Küldés folyamatban…' : 'Üzenet elküldése'} <span aria-hidden="true">↗</span>
              </button>
              <p className={`form-status ${formStatus}`} role="status" aria-live="polite">
                <FormStatusText status={formStatus} />
              </p>
            </div>
          </form>
        </section>
      </main>

      <SiteFooter home />
    </>
  );
}
