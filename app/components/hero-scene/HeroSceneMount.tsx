'use client';

// Entry-chunk helper: decides whether to load the WebGL hero scene, loads it when the page is idle and
// isolates every failure so the CSS hero stays untouched. It does not import three.js itself; the scene
// lives in its own lazy chunk.
import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SCENE_ALLOW_QUERIES, SCENE_DENY_QUERY, sceneMediaAllowed, shouldUseHeroScene } from './capability';

const HeroScene = lazy(() => import('./HeroScene'));

class LoadBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroSceneMount({ onActiveChange }: { onActiveChange: (active: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);
  const failed = useRef(false);

  // Decide after mount, and only once the page is idle so the scene never competes with first paint.
  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const start = () => {
      if (!cancelled && !failed.current && shouldUseHeroScene()) setEnabled(true);
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(start, { timeout: 2500 });
      } else {
        timeoutId = window.setTimeout(start, 1200);
      }
    };
    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  // The gates are checked once at start; if any stops matching later, drop the scene for good (no re-enable).
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const lists = [...SCENE_ALLOW_QUERIES, SCENE_DENY_QUERY].map((query) => window.matchMedia(query));
    const onChange = () => {
      if (sceneMediaAllowed()) return;
      failed.current = true;
      setEnabled(false);
      onActiveChange(false);
    };
    // Safari < 14 only has the legacy addListener/removeListener on MediaQueryList.
    lists.forEach((list) => (list.addEventListener ? list.addEventListener('change', onChange) : list.addListener(onChange)));
    return () =>
      lists.forEach((list) =>
        list.removeEventListener ? list.removeEventListener('change', onChange) : list.removeListener(onChange),
      );
  }, [onActiveChange]);

  const fail = () => {
    failed.current = true;
    setEnabled(false);
    onActiveChange(false);
  };

  if (!enabled) return null;

  return (
    <div className="hero-scene-layer" aria-hidden="true">
      <LoadBoundary onError={fail}>
        <Suspense fallback={null}>
          <HeroScene onReady={() => { if (!failed.current) onActiveChange(true); }} onError={fail} />
        </Suspense>
      </LoadBoundary>
    </div>
  );
}
