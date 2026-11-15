import { THRESHOLDS, isDenylisted, type Config, type Greylist } from './config';
import type { PageContext } from './context';
import { matchTopic } from './greylist';
import type { Assessment, Signal } from './types';
import { vslSignals } from '../modules/salespage/vsl';
import { longformSignals } from '../modules/salespage/longform';
import { claimSignals } from '../modules/salespage/claims';
import { pressureSignals } from '../modules/salespage/pressure';
import { commerceSignals } from '../modules/salespage/commerce';
import { techSupportSignals } from '../modules/scamguard/techsupport';
import { remoteAccessSignals } from '../modules/scamguard/remoteaccess';
import { giftCardSignals } from '../modules/scamguard/giftcard';
import { buyButtons } from './text';

/** Caps keep one noisy family of signals from dominating (e.g. lots of health words on a news story). */
const CLAIMS_CAP = 35;
/** Without anything being sold on the page (e.g. a news story quoting scam ads), claims stay below a warning. */
const CLAIMS_CAP_NO_SALE = 15;
const PRESSURE_CAP = 25;

function capped(signals: Signal[], cap: number): Signal[] {
  let total = 0;
  return signals.map((s) => {
    const w = Math.max(0, Math.min(s.weight, cap - total));
    total += w;
    return { ...s, weight: w };
  });
}

export function collectSignals(ctx: PageContext, config: Config): Signal[] {
  const out: Signal[] = [];
  if (config.modules.salespage) {
    const selling = [...vslSignals(ctx), ...longformSignals(ctx), ...commerceSignals(ctx), ...capped(pressureSignals(ctx), PRESSURE_CAP)];
    const sells = selling.length > 0 || buyButtons(ctx.doc).length > 0 || /\$\s?\d/.test(ctx.text);
    out.push(...selling, ...capped(claimSignals(ctx), sells ? CLAIMS_CAP : CLAIMS_CAP_NO_SALE));
  }
  if (config.modules.scamguard) {
    out.push(...techSupportSignals(ctx), ...remoteAccessSignals(ctx, config.allowedRemoteAccess), ...giftCardSignals(ctx));
  }
  if (isDenylisted(ctx.host, config)) {
    out.push({ id: 'denylist', module: 'family', weight: 100, reason: 'Your family marked this website as one to be careful with.' });
  }
  return out;
}

export function assess(ctx: PageContext, config: Config, greylist: Greylist | null): Assessment {
  const signals = collectSignals(ctx, config);
  let score = signals.reduce((s, x) => s + x.weight, 0);

  const topic = greylist ? matchTopic(ctx.headlines, ctx.text, greylist, config) : null;
  // A topic alone never warns: it only amplifies pages that already show sales tactics.
  if (topic && score >= 10) {
    const multiplier = 1 + topic.score / 200;
    const extra = Math.round(score * (multiplier - 1));
    score += extra;
    signals.push({
      id: `topic:${topic.id}`,
      module: 'salespage',
      weight: extra,
      reason: `This page is about ${topic.label.toLowerCase()} — a subject scammers often target at older people.`,
    });
  }

  const t = THRESHOLDS[config.strictness];
  const level = score >= t.high ? 'high' : score >= t.caution ? 'caution' : 'none';
  const ids = new Set(signals.map((s) => s.id));
  const takeover = ids.has('techsupport-scam') ? 'techsupport' : ids.has('remote-access') ? 'remoteaccess' : null;
  signals.sort((a, b) => b.weight - a.weight);
  return { level, score, signals: signals.filter((s) => s.weight > 0), topic, takeover };
}
