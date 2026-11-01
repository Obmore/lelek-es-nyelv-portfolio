// Tiny capability gate. Deliberately has no three.js import so it stays in the entry chunk.

export function canUseWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    // Software renderers (SwiftShader, llvmpipe) are rejected: the scene would be slower than the CSS hero.
    const attributes = { failIfMajorPerformanceCaveat: true };
    const gl = (canvas.getContext('webgl2', attributes) ?? canvas.getContext('webgl', attributes)) as
      | WebGLRenderingContext
      | WebGL2RenderingContext
      | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.width = 0;
    canvas.height = 0;
    return true;
  } catch {
    return false;
  }
}

/** Media queries the scene depends on: every `ALLOW` query must match and the `DENY` query must not. */
export const SCENE_ALLOW_QUERIES = ['(min-width: 851px)', '(pointer: fine)', '(hover: hover)'] as const;
export const SCENE_DENY_QUERY = '(prefers-reduced-motion: reduce)';

export function sceneMediaAllowed(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  const mq = (query: string) => window.matchMedia(query).matches;
  return SCENE_ALLOW_QUERIES.every(mq) && !mq(SCENE_DENY_QUERY);
}

export function shouldUseHeroScene(): boolean {
  return sceneMediaAllowed() && canUseWebGL();
}
