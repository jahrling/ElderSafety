import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';

/** Remote-control tools scammers ask people to install so they can take over the computer. */
export const REMOTE_ACCESS_HOSTS = [
  'anydesk.com',
  'teamviewer.com',
  'ultraviewer.net',
  'screenconnect.com',
  'connectwise.com',
  'logmein.com',
  'logmeinrescue.com',
  'goto.com',
  'gotoassist.com',
  'supremocontrol.com',
  'splashtop.com',
  'zoho.com/assist',
  'remotepc.com',
  'rustdesk.com',
  'aeroadmin.com',
  'ammyy.com',
];

const FILE_HINT = /(anydesk|teamviewer|ultraviewer|screenconnect|connectwisecontrol|supremo|rustdesk|aeroadmin|ammyy|logmein)[^/]*\.(exe|msi|dmg)\b/i;

export function remoteAccessSignals(ctx: PageContext, allowed: string[]): Signal[] {
  const url = ctx.doc.location?.href?.toLowerCase() ?? '';
  const isAllowed = (h: string) => allowed.some((a) => h.includes(a.toLowerCase()));
  const hostHit = REMOTE_ACCESS_HOSTS.find((h) => {
    const [domain, path] = h.split('/');
    const onDomain = ctx.host === domain || ctx.host.endsWith('.' + domain);
    return onDomain && (!path || url.includes('/' + path));
  });
  const linkHit = Array.from(ctx.doc.querySelectorAll('a[href]')).some((a) => FILE_HINT.test(a.getAttribute('href') ?? ''));
  if ((hostHit && !isAllowed(hostHit)) || (linkHit && !allowed.length)) {
    return [
      {
        id: 'remote-access',
        module: 'scamguard',
        weight: 50,
        reason: 'This page offers a program that lets another person control your computer. Scammers ask people to install these.',
      },
    ];
  }
  return [];
}
