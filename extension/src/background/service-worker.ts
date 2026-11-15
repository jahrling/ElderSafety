import { ConfigSchema, DATA_URL, GreylistSchema, UNINSTALL_PAGE, isDenylisted } from '../shared/config';
import type { CardFocusReply, ToContent, ToWorker } from '../shared/messages';
import { K, loadState, sha256Hex, type Secret } from '../shared/storage';
import type { RiskLevel } from '../shared/types';

const HOUR = 3_600_000;
const SYNC_MINUTES = 6 * 60;
const UPDATE_CHECK_MINUTES = 7 * 24 * 60;
const UNLOCK_HOURS = 24;
/** After the cooling-off period, buying on that site is allowed for this long before a new pause. */
const AFTER_COOLING_DAYS = 7;

// ---------------- Install / startup ----------------

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await ensureAlarms();
  await syncAll();
  await refreshUninstallUrl();
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await chrome.tabs.create({ url: chrome.runtime.getURL('setup.html?first=1') });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarms();
  await syncAll();
});

chrome.action.onClicked.addListener(() => void chrome.runtime.openOptionsPage());

async function ensureAlarms() {
  if (!(await chrome.alarms.get('sync'))) chrome.alarms.create('sync', { periodInMinutes: SYNC_MINUTES, delayInMinutes: 1 });
  if (!(await chrome.alarms.get('update-check')))
    chrome.alarms.create('update-check', { periodInMinutes: UPDATE_CHECK_MINUTES, delayInMinutes: 60 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync') await syncAll();
  if (alarm.name === 'update-check') await weeklyUpdateCheck();
});

// ---------------- Remote data + family config ----------------

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function configUrl(): Promise<string | null> {
  try {
    const managed = await chrome.storage.managed.get('configUrl');
    if (typeof managed.configUrl === 'string' && managed.configUrl) return managed.configUrl;
  } catch {
    // no managed storage on this machine
  }
  const local = await chrome.storage.local.get(K.configUrl);
  return typeof local[K.configUrl] === 'string' && local[K.configUrl] ? local[K.configUrl] : null;
}

/** Fetch fresh greylist data and family config. Keeps the last good copy if anything fails. */
export async function syncAll() {
  const now = Date.now();
  // Bundled data first, so a fresh install works offline.
  const have = await chrome.storage.local.get(K.greylist);
  if (!have[K.greylist]) {
    try {
      const bundled = GreylistSchema.parse(await fetchJson(chrome.runtime.getURL('data/greylist-topics.json')));
      await chrome.storage.local.set({ [K.greylist]: bundled });
    } catch (e) {
      console.warn('ElderSafety: bundled data unreadable', e);
    }
  }
  try {
    const remote = GreylistSchema.parse(await fetchJson(DATA_URL));
    const current = (await chrome.storage.local.get(K.greylist))[K.greylist];
    if (!current || remote.version >= (current.version ?? 0)) {
      await chrome.storage.local.set({ [K.greylist]: remote, [K.dataSyncedAt]: now });
    }
  } catch (e) {
    console.warn('ElderSafety: data sync failed, keeping last good copy', e);
  }
  const url = await configUrl();
  if (url) {
    try {
      const cfg = ConfigSchema.parse(await fetchJson(url));
      await chrome.storage.local.set({ [K.config]: cfg, [K.configSyncedAt]: now });
    } catch (e) {
      console.warn('ElderSafety: config sync failed, keeping last good copy', e);
    }
  }
}

// ---------------- Weekly update check (belt and braces; the stores also auto-update) ----------------

let pausesOpen = 0;

async function weeklyUpdateCheck() {
  try {
    const [status] = (await chrome.runtime.requestUpdateCheck()) as unknown as [string];
    if (status === 'update_available' && pausesOpen === 0) chrome.runtime.reload();
  } catch (e) {
    console.warn('ElderSafety: update check failed', e);
  }
}

// ---------------- Uninstall page ----------------

export async function refreshUninstallUrl() {
  const { personal } = await loadState();
  const q = new URLSearchParams();
  if (personal.caregiverName) q.set('n', personal.caregiverName);
  if (personal.caregiverPhone) q.set('p', personal.caregiverPhone);
  const url = q.toString() ? `${UNINSTALL_PAGE}?${q}` : UNINSTALL_PAGE;
  await chrome.runtime.setUninstallURL(url.slice(0, 1023));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[K.personal]) void refreshUninstallUrl();
  if (area === 'local' && changes[K.configUrl]) void syncAll();
});

// ---------------- Per-tab risk, cooling-off, unlock ----------------

const tabRisk = new Map<number, { level: RiskLevel; host: string }>();
const attempts = new Map<number, number[]>();

chrome.tabs.onRemoved.addListener((id) => {
  tabRisk.delete(id);
  attempts.delete(id);
});

async function getMap(key: string): Promise<Record<string, number>> {
  return ((await chrome.storage.local.get(key))[key] as Record<string, number>) ?? {};
}

function topHost(sender: chrome.runtime.MessageSender): string {
  try {
    return new URL(sender.tab?.url ?? '').hostname;
  } catch {
    return '';
  }
}

async function onCardFocus(sender: chrome.runtime.MessageSender): Promise<CardFocusReply> {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return { locked: false };
  const { config } = await loadState();
  const host = tabRisk.get(tabId)?.host || topHost(sender);
  const level = tabRisk.get(tabId)?.level ?? 'none';
  if (level === 'none' && !isDenylisted(host, config)) return { locked: false };

  const now = Date.now();
  const unlocked = await getMap(K.unlocked);
  if ((unlocked[host] ?? 0) > now) return { locked: false };

  const cooling = await getMap(K.cooling);
  const coolMs = config.coolingOffHours * HOUR;
  let start = cooling[host];
  if (start && now > start + coolMs + AFTER_COOLING_DAYS * 24 * HOUR) start = undefined; // old cycle: pause again
  if (start && now >= start + coolMs) return { locked: false }; // slept on it
  if (!start) {
    start = now;
    // prune entries older than 30 days so this never grows into a history
    for (const [h, t] of Object.entries(cooling)) if (now - t > 30 * 24 * HOUR) delete cooling[h];
    cooling[host] = start;
    await chrome.storage.local.set({ [K.cooling]: cooling });
  }
  const msg: ToContent = { type: 'showPause', coolingUntil: start + coolMs };
  pausesOpen++;
  await chrome.tabs.sendMessage(tabId, msg, { frameId: 0 }).catch(() => {});
  return { locked: true };
}

async function onTryUnlock(code: string, sender: chrome.runtime.MessageSender): Promise<boolean> {
  const tabId = sender.tab?.id;
  if (tabId === undefined || !code) return false;
  // At most 5 tries an hour per tab, so a code can't be guessed while someone coaches over the phone.
  const now = Date.now();
  const recent = (attempts.get(tabId) ?? []).filter((t) => now - t < HOUR);
  if (recent.length >= 5) return false;
  recent.push(now);
  attempts.set(tabId, recent);

  const { config } = await loadState();
  const local = (await chrome.storage.local.get(K.localUnlock))[K.localUnlock] as Secret | undefined;
  const candidates: Secret[] = [];
  if (config.unlockCodeHash) candidates.push({ hash: config.unlockCodeHash, salt: config.unlockCodeSalt });
  if (local?.hash) candidates.push(local);
  for (const s of candidates) {
    if ((await sha256Hex(s.salt + code)) === s.hash) {
      const host = tabRisk.get(tabId)?.host || topHost(sender);
      const unlocked = await getMap(K.unlocked);
      for (const [h, t] of Object.entries(unlocked)) if (t < now) delete unlocked[h];
      unlocked[host] = now + UNLOCK_HOURS * HOUR;
      await chrome.storage.local.set({ [K.unlocked]: unlocked });
      pausesOpen = Math.max(0, pausesOpen - 1);
      const msg: ToContent = { type: 'unlocked' };
      await chrome.tabs.sendMessage(tabId, msg).catch(() => {});
      return true;
    }
  }
  return false;
}

chrome.runtime.onMessage.addListener((msg: ToWorker, sender, reply) => {
  const tabId = sender.tab?.id;
  switch (msg.type) {
    case 'risk':
      if (tabId !== undefined && sender.frameId === 0) tabRisk.set(tabId, { level: msg.level, host: msg.host });
      return false;
    case 'cardFocus':
      void onCardFocus(sender).then(reply);
      return true;
    case 'tryUnlock':
      void onTryUnlock(msg.code, sender).then(reply);
      return true;
    case 'closeTab':
      pausesOpen = Math.max(0, pausesOpen - 1);
      if (tabId !== undefined) void chrome.tabs.remove(tabId);
      return false;
    case 'openSetup':
      void chrome.runtime.openOptionsPage();
      return false;
  }
  return false;
});
