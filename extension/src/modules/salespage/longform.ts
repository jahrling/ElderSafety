import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';
import { buyButtons, wordCount } from '../../shared/text';

/** The very long, single-topic "advertorial" page with buy buttons all the way down. */
export function longformSignals(ctx: PageContext): Signal[] {
  const out: Signal[] = [];
  const { doc, metrics } = ctx;
  const words = wordCount(ctx.text);
  const screens = metrics && metrics.viewportHeight > 0 ? metrics.scrollHeight / metrics.viewportHeight : 0;
  const navLinks = doc.querySelectorAll('nav a, header a, [role=navigation] a').length;
  const buys = buyButtons(doc).length;

  const veryLong = screens >= 15 || (!metrics && words >= 3500);
  if (veryLong && navLinks < 6) {
    out.push({
      id: 'longform',
      module: 'salespage',
      weight: 10,
      reason: 'This is one very long page with no menu to the rest of a website — a common sales-letter layout.',
    });
  }
  if (buys >= 4) {
    out.push({
      id: 'repeated-buy',
      module: 'salespage',
      weight: 10,
      reason: `There are ${buys} “buy” buttons repeated down the page.`,
    });
  }
  if (/\b(as seen on|featured (in|on))\b/i.test(ctx.text) && /\b(cnn|fox|nbc|abc|cbs|forbes|today show|dr\.? oz)\b/i.test(ctx.text)) {
    out.push({
      id: 'as-seen-on',
      module: 'salespage',
      weight: 5,
      reason: 'It shows “as seen on” TV or news logos, which are easy to copy and rarely checked.',
    });
  }
  return out;
}
