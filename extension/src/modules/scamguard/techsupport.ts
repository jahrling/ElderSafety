import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';

const REAL_SUPPORT_HOSTS = ['microsoft.com', 'apple.com', 'google.com', 'norton.com', 'mcafee.com', 'hp.com', 'dell.com'];

const ALARM = [
  /\byour (computer|pc|device|mac|iphone|system) (is|has been|was) (infected|locked|blocked|compromised|hacked|disabled)\b/i,
  /\b(trojan|spyware|zeus|pornographic spyware|virus(es)? (detected|found))\b/i,
  /\b(do not|don'?t) (close|restart|shut ?down|turn off) (this (page|window)|your (computer|pc))\b/i,
  /\b(windows|microsoft|apple|mac) (defender|security|firewall) (alert|warning|center)\b/i,
  /\berror (code|#)\s*:?\s*(0x[0-9a-f]+|#?dw\w+|\d{3,})/i,
  /\b(access to this pc has been blocked|your data (is|are) at risk|identity theft)\b/i,
];
const CALL = /\b(call|contact|dial)\b[^.]{0,40}\b(support|technician|microsoft|apple|windows|help ?desk|toll[- ]free)\b/i;
const TOLL_FREE = /\b(\+?1[\s.-]?)?\(?8(00|33|44|55|66|77|88)\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;

/** Fake "your computer is infected, call this number" pages. */
export function techSupportSignals(ctx: PageContext): Signal[] {
  if (REAL_SUPPORT_HOSTS.some((h) => ctx.host === h || ctx.host.endsWith('.' + h))) return [];
  const text = ctx.text + ' ' + ctx.headlines;
  const alarms = ALARM.filter((r) => r.test(text)).length;
  const phone = TOLL_FREE.test(text);
  const call = CALL.test(text);
  const out: Signal[] = [];
  if (alarms >= 1 && phone && call) {
    out.push({
      id: 'techsupport-scam',
      module: 'scamguard',
      weight: 70,
      reason: 'This page says your computer has a virus and tells you to call a phone number. Real companies never do this.',
    });
  } else if (alarms >= 2) {
    out.push({
      id: 'fake-virus-alert',
      module: 'scamguard',
      weight: 35,
      reason: 'This page shows a fake virus warning. A website cannot see viruses on your computer.',
    });
  }
  return out;
}
