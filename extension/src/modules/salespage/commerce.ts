import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';

/** Checkout networks that host most supplement / "secret system" sales funnels. */
export const FUNNEL_CHECKOUTS = [
  'clickbank.net',
  'clkbank.com',
  'buygoods.com',
  'digistore24.com',
  'checkout-ds24.com',
  'maxweb.com',
  'cartpanda.com',
  'samcart.com',
  'clickfunnels.com',
];

export function commerceSignals(ctx: PageContext): Signal[] {
  const out: Signal[] = [];
  const hrefs = Array.from(ctx.doc.querySelectorAll('a[href], form[action]'))
    .map((e) => (e.getAttribute('href') ?? e.getAttribute('action') ?? '').toLowerCase());

  const onFunnelHost = FUNNEL_CHECKOUTS.some((d) => ctx.host === d || ctx.host.endsWith('.' + d));
  if (onFunnelHost || hrefs.some((h) => FUNNEL_CHECKOUTS.some((d) => h.includes(d)))) {
    out.push({
      id: 'funnel-checkout',
      module: 'salespage',
      weight: 20,
      reason: 'The order buttons go to a checkout service used mainly by online sales funnels and affiliate marketers.',
    });
  }
  const loc = ctx.doc.location?.href?.toLowerCase() ?? '';
  if (/[?&](hop|affid|aff_id|affiliate|subid|cbtid|tid|clickid)=/.test(loc)) {
    out.push({
      id: 'affiliate-link',
      module: 'salespage',
      weight: 5,
      reason: 'You arrived through an affiliate link — someone is paid a commission if you buy.',
    });
  }
  if (/\b(3|6|9|12) bottles?\b/i.test(ctx.text) && /\b(most popular|best value|biggest discount)\b/i.test(ctx.text)) {
    out.push({
      id: 'bulk-bottles',
      module: 'salespage',
      weight: 10,
      reason: 'It pushes you to buy 3 or 6 bottles at once “for the best value”.',
    });
  }
  return out;
}
