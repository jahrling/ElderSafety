import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';

const PAY_ODD =
  /\b(pay|payment|paid|send|purchase|buy)\b[^.]{0,60}\b(gift ?cards?|google play cards?|itunes cards?|apple cards?|steam cards?|bitcoin|crypto(currency)?|bitcoin atm|wire transfer|western union|moneygram|zelle)\b/i;
const READ_CODE = /\b(read|send|give|scratch)\b[^.]{0,30}\b(the )?(numbers?|codes?|pin) (on|from) the (back|card)\b/i;

export function giftCardSignals(ctx: PageContext): Signal[] {
  const out: Signal[] = [];
  if (READ_CODE.test(ctx.text)) {
    out.push({
      id: 'giftcard-code',
      module: 'scamguard',
      weight: 65,
      reason: 'It asks for the numbers on the back of a gift card. Only scammers ask to be paid that way.',
    });
  } else if (PAY_ODD.test(ctx.text) && /\b(fee|fine|refund|owe|tax|unlock|release|bail|customs)\b/i.test(ctx.text)) {
    out.push({
      id: 'odd-payment',
      module: 'scamguard',
      weight: 25,
      reason: 'It asks you to pay a fee with gift cards, cryptocurrency or a wire transfer — methods scammers prefer because they can’t be undone.',
    });
  }
  return out;
}
