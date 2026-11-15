import type { PageContext } from '../../shared/context';
import type { Signal } from '../../shared/types';
import { buyButtons } from '../../shared/text';

/** Video hosts built for "video sales letters" (no skip, no seek, buy button appears later). */
export const VSL_HOSTS = [
  'vturb.com.br',
  'vturb.com',
  'converteai.net',
  'vidalytics.com',
  'smartplayer',
  'vslplayer',
  'cdn.jwplayer.com/vsl',
];

const VSL_PHRASES = [
  /watch (this|the) (entire |whole |full )?(video|presentation) (now |until the end|before)/i,
  /(video|presentation) (may|might|will) be (taken down|removed|deleted)/i,
  /before (it'?s|this video is) (taken down|removed|banned)/i,
  /(this|the) (video|presentation) (is|has been) (censored|banned)/i,
  /make sure (your|the) (sound|volume) is (on|turned up)/i,
];

export function vslSignals(ctx: PageContext): Signal[] {
  const out: Signal[] = [];
  const { doc } = ctx;

  const srcs = Array.from(doc.querySelectorAll('script[src], iframe[src], video[src], source[src]'))
    .map((e) => e.getAttribute('src') ?? '')
    .join(' ')
    .toLowerCase();
  const customPlayer = doc.querySelector('vturb-smartplayer, [id^="vid_"][class*="smartplayer"], [id*="vturb"], [class*="vidalytics"]');
  if (VSL_HOSTS.some((h) => srcs.includes(h)) || customPlayer) {
    out.push({
      id: 'vsl-player',
      module: 'salespage',
      weight: 25,
      reason: 'The video on this page uses a player made for sales pitches: you can’t skip or fast-forward it.',
    });
  }

  const bareVideos = Array.from(doc.querySelectorAll('video')).filter(
    (v) => !v.hasAttribute('controls') && (v.hasAttribute('autoplay') || v.closest('[class*="vsl" i], [id*="vsl" i]')),
  );
  if (bareVideos.length && !out.length) {
    out.push({
      id: 'vsl-nocontrols',
      module: 'salespage',
      weight: 15,
      reason: 'The video plays by itself and has no pause or skip controls.',
    });
  }

  if (VSL_PHRASES.some((p) => p.test(ctx.text))) {
    out.push({
      id: 'vsl-urgency',
      module: 'salespage',
      weight: 15,
      reason: 'It says the video might be “taken down” or that you must watch to the end — a pressure tactic.',
    });
  }

  // Buy buttons hidden at first, to be revealed after minutes of video.
  const hiddenBuy = buyButtons(doc).filter((el) => {
    const hidden = (el as HTMLElement).closest('[hidden], [style*="display: none" i], [style*="display:none" i], .esconder, .hidden-cta, [class*="delay" i]');
    return !!hidden;
  });
  if (hiddenBuy.length) {
    out.push({
      id: 'vsl-hidden-buy',
      module: 'salespage',
      weight: 15,
      reason: 'The “buy” button is hidden until you have watched for a while, so you can’t see the price up front.',
    });
  }
  return out;
}
