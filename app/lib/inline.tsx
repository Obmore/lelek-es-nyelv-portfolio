import type { ReactNode } from 'react';

const EXTERNAL_HREF = /^(?:https?:)?\/\//i;

/** Renders text with inline [label|href] links (privacy notice and imprint strings from content.ts). */
export function renderInline(text: string): ReactNode[] {
  const parts = text.split(/\[([^|\]]+)\|([^\]]+)\]/);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) nodes.push(parts[i]);
    if (i + 2 < parts.length) {
      const href = parts[i + 2];
      nodes.push(
        <a key={i} href={href} {...(EXTERNAL_HREF.test(href) ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
          {parts[i + 1]}
        </a>,
      );
    }
  }
  return nodes;
}
