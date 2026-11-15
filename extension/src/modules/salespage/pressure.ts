import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';

const RULES: { id: string; weight: number; re: RegExp; reason: string }[] = [
  {
    id: 'scarcity',
    weight: 8,
    re: /\b(only \d+ (left|remaining|bottles|units|spots)|limited (stock|supply|quantities)|(almost|nearly) sold out|selling out fast|while supplies last)\b/i,
    reason: 'It says stock is “almost gone” — a way to rush you.',
  },
  {
    id: 'deadline',
    weight: 8,
    re: /\b(offer (ends|expires)|(price|discount) (will|may) (go up|increase|end)|today only|expires (in|at) (midnight|\d)|(this|the) (offer|discount|price) (won'?t|will not) last)\b/i,
    reason: 'It says the price or offer is about to expire — a way to rush you.',
  },
  {
    id: 'fake-discount',
    weight: 5,
    re: /\b(regular(ly)? (price|retail)|normally|retail price)\b[^.]{0,40}\$\s?\d{2,4}[^.]{0,60}\b(today|now) (only )?\$\s?\d{1,3}/i,
    reason: 'It shows a big “normal price” crossed out next to a much lower “today” price.',
  },
];

export function pressureSignals(ctx: PageContext): Signal[] {
  const out: Signal[] = [];
  for (const r of RULES) {
    if (r.re.test(ctx.text)) out.push({ id: r.id, module: 'salespage', weight: r.weight, reason: r.reason });
  }
  const timer = ctx.doc.querySelector('[id*="countdown" i], [class*="countdown" i], [id*="timer" i], [class*="timer" i]');
  if (timer && /\d{1,2}\s*:\s*\d{2}/.test(timer.textContent ?? '')) {
    out.push({
      id: 'countdown',
      module: 'salespage',
      weight: 10,
      reason: 'There is a countdown clock. These often restart when you reload — they are there to rush you.',
    });
  }
  return out;
}
