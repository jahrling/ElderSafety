import type { Assessment, Link, Personal } from '../shared/types';
import { CSS } from './styles';
import { h, shadow } from './dom';


const who = (p: Personal) => p.caregiverName || 'your family';
const reader = (p: Personal) => (p.readerName ? `${p.readerName}, ` : '');

function photo(p: Personal, big = false) {
  return p.photo ? h('img', { class: big ? 'photo big' : 'photo', src: p.photo, alt: `Photo of ${who(p)}` }) : null;
}

function callButton(p: Personal, primary = true) {
  if (!p.caregiverPhone) return null;
  return h('a', { class: primary ? 'btn primary' : 'btn', href: `tel:${p.caregiverPhone.replace(/[^\d+]/g, '')}` }, `📞 Call ${who(p)}`);
}

function scammerNote(p: Personal) {
  return h(
    'div',
    { class: 'scammer-note' },
    h('strong', {}, 'If anyone on the phone tells you to ignore this, turn it off, or install something — that is a scam. '),
    `Hang up and call ${who(p)}.`,
  );
}

function reasonsList(a: Assessment, max = 6) {
  return h('ul', {}, ...a.signals.slice(0, max).map((s) => h('li', {}, s.reason)));
}

function linksList(links: Link[]) {
  return h(
    'ul',
    {},
    ...links.map((l) => h('li', {}, h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.title))),
  );
}

function clear(root: ShadowRoot, cls: string) {
  root.querySelectorAll(`.${cls}`).forEach((e) => e.remove());
}

/** Top-of-page notice. Never blocks reading. */
export function showBanner(a: Assessment, p: Personal, links: Link[]) {
  const root = shadow(CSS);
  clear(root, 'banner');
  const n = a.signals.length;
  const headline =
    a.level === 'high'
      ? `${reader(p)}careful — this page looks like a high-pressure sales pitch.`
      : `Take a moment — this page uses ${n} common sales-pressure ${n === 1 ? 'trick' : 'tricks'}.`;
  const details = h(
    'div',
    { class: 'details', hidden: '' },
    h('strong', {}, 'What we noticed:'),
    reasonsList(a),
    links.length ? h('strong', {}, 'Trustworthy places to learn more:') : null,
    links.length ? linksList(links) : null,
    p.message ? h('div', { class: 'personal' }, `“${p.message}” — ${who(p)}`) : null,
  );
  const why = h('button', {
    onclick: () => {
      details.toggleAttribute('hidden');
      why.textContent = details.hidden ? 'Why?' : 'Hide';
    },
  }, 'Why?');
  const banner = h(
    'div',
    { class: `banner ${a.level}`, role: 'alert', 'data-testid': 'es-banner' },
    h(
      'div',
      { class: 'row' },
      photo(p),
      h('div', { class: 'grow' }, h('strong', {}, headline), ' ', h('span', { class: 'small' }, `${who(p)} asked us to point these out.`)),
      why,
      h('button', { onclick: () => banner.remove() }, 'OK, got it'),
    ),
    details,
  );
  root.append(banner);
}

export interface PauseOptions {
  coolingUntil: number;
  onUnlock: (code: string) => Promise<boolean>;
  onClose: () => void;
}

/** Full-screen "let's slow down" shown when a card number is about to be typed on a risky page. */
export function showPause(a: Assessment, p: Personal, links: Link[], opts: PauseOptions) {
  const root = shadow(CSS);
  clear(root, 'overlay');
  const when = new Date(opts.coolingUntil).toLocaleString([], { weekday: 'long', hour: 'numeric', minute: '2-digit' });
  const input = h('input', { type: 'password', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Unlock code' });
  const msg = h('div', { class: 'msg', role: 'status' });
  const overlay = h(
    'div',
    { class: 'overlay', 'data-testid': 'es-pause' },
    h(
      'div',
      { class: 'card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Let’s slow down before paying' },
      h('div', { class: 'row' }, photo(p, true), h('div', { class: 'grow' }, h('h1', { tabindex: '-1' }, `${reader(p)}let’s slow down before paying.`), h('div', {}, 'This website shows signs of a high-pressure sales pitch.'))),
      p.message || p.caregiverName
        ? h('div', { class: 'personal' }, p.message ? `“${p.message}” — ${who(p)}` : `${who(p)} would like you to check with them before buying from sites like this.`)
        : null,
      h('div', { class: 'actions' }, callButton(p), h('button', { class: p.caregiverPhone ? '' : 'primary', onclick: opts.onClose }, 'Close this page')),
      h('h2', {}, 'What we noticed'),
      reasonsList(a),
      links.length ? h('h2', {}, 'Before you buy, see what doctors and researchers say') : null,
      links.length ? linksList(links) : null,
      scammerNote(p),
      h(
        'div',
        { class: 'unlock' },
        h('div', {}, `Still want to buy? Sleep on it — you can come back after ${when}. Or ask ${who(p)} for the unlock code:`),
        h('div', { class: 'row' }, input, h('button', {
          onclick: async () => {
            msg.textContent = 'Checking…';
            const ok = await opts.onUnlock(input.value.trim());
            if (ok) overlay.remove();
            else msg.textContent = 'That code didn’t work.';
          },
        }, 'Unlock')),
        msg,
      ),
    ),
  );
  root.append(overlay);
  (overlay.querySelector('h1') as HTMLElement | null)?.focus();
}

/** Full-screen warning for fake virus pages and remote-control downloads. */
export function showTakeover(kind: 'techsupport' | 'remoteaccess', p: Personal, onClose: () => void) {
  const root = shadow(CSS);
  clear(root, 'overlay');
  const title =
    kind === 'techsupport'
      ? 'This is a fake warning. Your computer is fine.'
      : 'Did someone ask you to install this?';
  const body =
    kind === 'techsupport'
      ? 'Microsoft, Apple and your bank never put phone numbers in pop-up warnings. Do not call the number. Close this page.'
      : 'This program lets another person control your computer and see your bank accounts. Scammers ask people to install it. Only continue if you are doing this with someone you know in person.';
  const overlay = h(
    'div',
    { class: 'overlay', 'data-testid': `es-takeover-${kind}` },
    h(
      'div',
      { class: 'card danger', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'row' }, photo(p, true), h('div', { class: 'grow' }, h('h1', {}, title))),
      h('p', {}, body),
      h('div', { class: 'actions' }, h('button', { class: 'primary', onclick: onClose }, 'Close this page'), callButton(p, false)),
      scammerNote(p),
      h('p', { class: 'small' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); overlay.remove(); } }, kind === 'remoteaccess' ? `I’m doing this with ${who(p)} — continue` : 'Show me the page anyway')),
    ),
  );
  root.append(overlay);
}

export function removeOverlay() {
  const root = shadow(CSS);
  clear(root, 'overlay');
}
