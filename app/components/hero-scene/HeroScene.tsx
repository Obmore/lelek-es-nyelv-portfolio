import { Component, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Color, Group, ShaderMaterial } from 'three';
import { sphereFragment, sphereVertex } from './shaders';

/* ---- Tuning knobs (palette tokens match app/globals.css) ---- */
export const SCENE_CONFIG = {
  /** Sphere diameter as a share of the container's shorter side. */
  sphereSize: 0.62,
  /** Breathing period in seconds (scale 1 -> 1.04 -> 1). */
  breathSeconds: 8,
  /** Surface distortion amplitude (fraction of radius). */
  distortion: 0.026,
  /** Max pointer tilt in radians (~6 degrees). */
  maxTilt: (6 * Math.PI) / 180,
  colors: {
    light: '#c6d0ba', // lit side of the pearl
    shadow: '#72836d', // shaded side; centre lands in between so paper/ink words stay readable
    peach: '#e8b29c',
    coral: '#d77759',
    paper: '#fbf8f2',
    ink: '#203127',
  },
  dustCount: 64,
  /** Vertical centre of the sphere as a share of the container height; matches `.sun-disc` (top: 47%). */
  centerY: 0.47,
} as const;

type Pointer = { x: number; y: number };

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Scene({
  reduced,
  pointer,
  onFirstFrame,
}: {
  reduced: boolean;
  pointer: React.RefObject<Pointer>;
  onFirstFrame: () => void;
}) {
  const { viewport } = useThree();
  const root = useRef<Group>(null);
  const unit = useRef<Group>(null);
  const sphere = useRef<Group>(null);
  const ringA = useRef<Group>(null);
  const ringB = useRef<Group>(null);
  const dotA = useRef<Group>(null);
  const dotB = useRef<Group>(null);
  const dust = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);
  const time = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });
  const first = useRef(true);

  const { uniforms, dustPositions } = useMemo(() => {
    const c = SCENE_CONFIG.colors;
    const rand = seeded(20261101);
    const arr = new Float32Array(SCENE_CONFIG.dustCount * 3);
    for (let i = 0; i < SCENE_CONFIG.dustCount; i++) {
      const r = 1.6 + rand() * 1.5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.25;
      arr[i * 3 + 1] = r * Math.cos(phi) * 0.8;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return {
      dustPositions: arr,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: SCENE_CONFIG.distortion },
        uLight: { value: new Color(c.light) },
        uShadow: { value: new Color(c.shadow) },
        uPeach: { value: new Color(c.peach) },
        uCoral: { value: new Color(c.coral) },
        uPaper: { value: new Color(c.paper) },
      },
    };
  }, []);

  useFrame((_, delta) => {
    if (reduced) {
      time.current = 3;
    } else {
      time.current += Math.min(delta, 0.1);
    }
    const t = time.current;

    // size the whole scene to the container; 1 unit = sphere radius
    const r = (Math.min(viewport.width, viewport.height) * SCENE_CONFIG.sphereSize) / 2;
    unit.current?.scale.setScalar(r);

    const breath = 1 + 0.02 * (1 - Math.cos((2 * Math.PI * t) / SCENE_CONFIG.breathSeconds));
    sphere.current?.scale.setScalar(breath);
    if (material.current) material.current.uniforms.uTime.value = t;

    if (ringA.current) ringA.current.rotation.y = t * 0.07;
    if (ringB.current) {
      ringB.current.rotation.z = 0.42 + Math.sin(t * 0.11) * 0.16;
      ringB.current.rotation.x = Math.sin(t * 0.07) * 0.2;
    }
    const a = t * 0.38;
    dotA.current?.position.set(Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0);
    const b = t * 0.27 + 2.1;
    dotB.current?.position.set(Math.cos(b) * 1.4, Math.sin(b) * 1.4, 0);

    if (dust.current) {
      dust.current.rotation.y = t * 0.018;
      dust.current.position.y = Math.sin(t * 0.2) * 0.06;
    }

    if (root.current) {
      const k = 1 - Math.exp(-Math.min(delta, 0.1) * 3);
      const p = pointer.current;
      tilt.current.x += (p.x * SCENE_CONFIG.maxTilt - tilt.current.x) * k;
      tilt.current.y += (p.y * SCENE_CONFIG.maxTilt - tilt.current.y) * k;
      root.current.rotation.y = tilt.current.x;
      root.current.rotation.x = tilt.current.y;
      root.current.position.y = (0.5 - SCENE_CONFIG.centerY) * viewport.height;
    }

    if (first.current) {
      first.current = false;
      onFirstFrame();
    }
  });

  const { ink, coral, paper } = SCENE_CONFIG.colors;

  return (
    <group ref={root}>
      <group ref={unit}>
        <group ref={sphere}>
          <mesh>
            <sphereGeometry args={[1, 96, 64]} />
            <shaderMaterial
              ref={material}
              vertexShader={sphereVertex}
              fragmentShader={sphereFragment}
              uniforms={uniforms}
            />
          </mesh>
        </group>

        <group ref={ringA} rotation={[0, 0, -0.32]}>
          <group rotation={[1.2, 0, 0]}>
            <mesh>
              <torusGeometry args={[1.62, 0.0035, 6, 200]} />
              <meshBasicMaterial color={ink} transparent opacity={0.34} toneMapped={false} />
            </mesh>
            <group ref={dotA}>
              <mesh>
                <sphereGeometry args={[0.034, 20, 14]} />
                <meshBasicMaterial color={coral} toneMapped={false} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.085, 20, 14]} />
                <meshBasicMaterial color={coral} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>

        <group ref={ringB} rotation={[0, 0, 0.42]}>
          <group rotation={[0, 1.18, 0]}>
            <mesh>
              <torusGeometry args={[1.4, 0.0035, 6, 200]} />
              <meshBasicMaterial color={ink} transparent opacity={0.3} toneMapped={false} />
            </mesh>
            <group ref={dotB}>
              <mesh>
                <sphereGeometry args={[0.03, 20, 14]} />
                <meshBasicMaterial color={coral} toneMapped={false} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.078, 20, 14]} />
                <meshBasicMaterial color={coral} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>

        <group ref={dust}>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial
              color={paper}
              size={2.2}
              sizeAttenuation={false}
              transparent
              opacity={0.65}
              depthWrite={false}
              toneMapped={false}
            />
          </points>
        </group>
      </group>
    </group>
  );
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
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

export default function HeroScene({
  className,
  onReady,
  onError,
}: {
  className?: string;
  onReady?: () => void;
  onError?: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const cleanupGl = useRef<(() => void) | null>(null);
  const readyFrame = useRef(0);
  const dead = useRef(false);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

  // pause when off-screen or tab hidden
  useEffect(() => {
    const el = container.current;
    let observer: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entries) => {
        const last = entries[entries.length - 1];
        if (last) setInView(last.isIntersecting);
      });
      observer.observe(el);
    }
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // gentle parallax, fine pointers only
  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  useEffect(() => {
    dead.current = false;
    return () => {
      dead.current = true;
      if (readyFrame.current) cancelAnimationFrame(readyFrame.current);
      readyFrame.current = 0;
      cleanupGl.current?.();
    };
  }, []);

  const frameloop = reduced ? 'demand' : inView && tabVisible ? 'always' : 'never';

  return (
    <div
      ref={container}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <SceneBoundary onError={() => onErrorRef.current?.()}>
        <Canvas
          aria-hidden="true"
          frameloop={frameloop}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 50 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'default' }}
          style={{ position: 'absolute', inset: 0 }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            const fail = () => {
              dead.current = true;
              if (readyFrame.current) cancelAnimationFrame(readyFrame.current);
              readyFrame.current = 0;
              onErrorRef.current?.();
            };
            // three.js only logs shader compile/link errors; treat them as a scene failure so the CSS hero stays.
            gl.debug.onShaderError = () => {
              // three r186 no longer logs shader errors itself, so report once before failing.
              if (!dead.current) console.error('HeroScene: shader compile/link failed; falling back to the CSS hero.');
              fail();
            };
            const canvas = gl.domElement;
            const lost = (event: Event) => {
              event.preventDefault();
              fail();
            };
            canvas.addEventListener('webglcontextlost', lost);
            cleanupGl.current = () => {
              canvas.removeEventListener('webglcontextlost', lost);
              gl.debug.onShaderError = null;
            };
          }}
        >
          <Scene
            reduced={reduced}
            pointer={pointer}
            onFirstFrame={() => {
              // The first render (which compiles the shaders) finishes in this tick; report ready one frame later.
              readyFrame.current = requestAnimationFrame(() => {
                readyFrame.current = 0;
                if (!dead.current) onReadyRef.current?.();
              });
            }}
          />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
