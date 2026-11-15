type Child = Node | string | null | undefined | false;

/** Minimal element builder. Text always goes in as text nodes, never as HTML. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string | ((e: Event) => void)> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v);
    else el.setAttribute(k, v);
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

let root: ShadowRoot | null = null;

export function shadow(css: string): ShadowRoot {
  if (root && root.host.isConnected) return root;
  const host = document.createElement('eldersafety-guard');
  host.setAttribute('data-eldersafety', '');
  root = host.attachShadow({ mode: 'open' });
  root.append(h('style', {}, css));
  document.documentElement.append(host);
  return root;
}
