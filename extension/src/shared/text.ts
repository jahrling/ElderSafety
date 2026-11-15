/** Text helpers shared by the signal modules. They work on any Document (real page or jsdom). */

const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG']);

/** Readable text of the page, without scripts/styles. Capped so huge pages stay fast. */
export function pageText(doc: Document, max = 200_000): string {
  const parts: string[] = [];
  let total = 0;
  const walker = doc.createTreeWalker(doc.body ?? doc.documentElement, 4 /* SHOW_TEXT */);
  for (let n = walker.nextNode(); n && total < max; n = walker.nextNode()) {
    const parent = n.parentElement;
    if (!parent || SKIP.has(parent.tagName.toUpperCase()) || parent.closest('[data-eldersafety]')) continue;
    const t = n.nodeValue?.replace(/\s+/g, ' ').trim();
    if (t) {
      parts.push(t);
      total += t.length;
    }
  }
  return parts.join(' ');
}

/** Title plus headings — what the page says it is about. */
export function headlineText(doc: Document): string {
  const heads = Array.from(doc.querySelectorAll('h1, h2, h3'))
    .slice(0, 40)
    .map((h) => h.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  return [doc.title, ...heads].join(' \n ');
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export const BUY_WORDS =
  /\b(buy now|order now|add to cart|yes[,!]? i want|claim (my|your)|get (my|your) (bottles?|discount|copy)|rush my order|i'?m ready|checkout|get instant access|try it (now|today))\b/i;

/** Elements that look like "buy" buttons or links. */
export function buyButtons(doc: Document): Element[] {
  return Array.from(doc.querySelectorAll('a, button, input[type=submit], [role=button]')).filter((el) => {
    const t = (el.textContent || (el as HTMLInputElement).value || '').trim();
    return t.length < 80 && BUY_WORDS.test(t);
  });
}

/** Counts regex hits, each pattern counted once. */
export function matchAll(text: string, patterns: RegExp[]): RegExp[] {
  return patterns.filter((p) => p.test(text));
}
