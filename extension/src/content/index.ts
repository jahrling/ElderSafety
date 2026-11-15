import { isAllowlisted } from '../shared/config';
import { makeContext } from '../shared/context';
import { assess } from '../shared/scorer';
import { alternativesFor, productNameFrom } from '../shared/alternatives';
import { loadState } from '../shared/storage';
import type { CardFocusReply, ToContent, ToWorker } from '../shared/messages';
import type { Assessment, RiskLevel } from '../shared/types';
import { removeOverlay, showBanner, showPause, showTakeover } from '../ui/views';
import { isCardField } from './card-fields';

const send = <T = unknown>(msg: ToWorker) => chrome.runtime.sendMessage(msg) as Promise<T>;
const RANK: Record<RiskLevel, number> = { none: 0, caution: 1, high: 2 };
const isTop = window === window.top;

async function main() {
  const host = location.hostname;
  const state = await loadState();
  if (isAllowlisted(host, state.config)) return;

  let current: Assessment | null = null;
  let shownRank = 0;
  let takeoverShown = false;
  const started = performance.now();

  // ---------- Page assessment (top frame only) ----------
  const scan = () => {
    if (!document.body) return;
    const ctx = makeContext(
      document,
      host,
      { scrollHeight: document.documentElement.scrollHeight, viewportHeight: window.innerHeight },
      performance.now() - started,
    );
    const a = assess(ctx, state.config, state.greylist);
    const prevLevel = current?.level ?? 'none';
    current = a;
    if (a.takeover && !takeoverShown) {
      takeoverShown = true;
      showTakeover(a.takeover, state.personal, () => void send({ type: 'closeTab' }));
    } else if (RANK[a.level] > shownRank && !a.takeover) {
      shownRank = RANK[a.level];
      showBanner(a, state.personal, alternativesFor(a.topic, productNameFrom(document)));
    }
    if (a.level !== prevLevel) void send({ type: 'risk', level: a.level, host });
  };

  if (isTop) {
    scan();
    // Sales pages reveal buy buttons and timers later, so look again a few times.
    for (const ms of [2_000, 10_000, 45_000, 120_000, 300_000]) setTimeout(scan, ms);
    let pending = false;
    let scans = 0;
    new MutationObserver(() => {
      if (pending || scans > 30) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        scans++;
        scan();
      }, 4_000);
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });

    // Fake virus pages force full screen so you can't see the tabs. Undo that.
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement && current?.takeover === 'techsupport') void document.exitFullscreen().catch(() => {});
    });
  }

  // ---------- Payment guard (every frame, including card iframes) ----------
  let locked = false;
  const block = (e: Event) => {
    if (locked && isCardField(e.target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      (e.target as HTMLInputElement).blur();
    }
  };
  for (const t of ['keydown', 'beforeinput', 'paste', 'drop']) document.addEventListener(t, block, true);

  document.addEventListener(
    'focusin',
    async (e) => {
      if (!isCardField(e.target)) return;
      const field = e.target;
      const reply = await send<CardFocusReply>({ type: 'cardFocus' }).catch(() => ({ locked: false }));
      locked = reply.locked;
      if (locked) field.blur();
    },
    true,
  );

  chrome.runtime.onMessage.addListener((msg: ToContent) => {
    if (msg.type === 'unlocked') {
      locked = false;
      if (isTop) removeOverlay();
    }
    if (msg.type === 'showPause' && isTop) {
      const a: Assessment =
        current ?? { level: 'high', score: 0, signals: [], topic: null, takeover: null };
      showPause(a, state.personal, alternativesFor(a.topic, productNameFrom(document)), {
        coolingUntil: msg.coolingUntil,
        onUnlock: async (code) => !!(await send<boolean>({ type: 'tryUnlock', code })),
        onClose: () => void send({ type: 'closeTab' }),
      });
    }
  });
}

void main();
