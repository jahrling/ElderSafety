import { K, EMPTY_PERSONAL, makeSecret, sha256Hex, type Secret } from '../shared/storage';
import type { Personal } from '../shared/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('form');
let photo = '';

async function init() {
  const s = await chrome.storage.local.get(null);
  const pin = s[K.pin] as Secret | undefined;
  if (pin?.hash) {
    $('gate').hidden = false;
    $('gateBtn').addEventListener('click', async () => {
      const v = $<HTMLInputElement>('gatePin').value;
      if ((await sha256Hex(pin.salt + v)) === pin.hash) {
        $('gate').hidden = true;
        show(s);
      } else $('gateMsg').textContent = 'Wrong PIN';
    });
  } else show(s);
}

async function show(s: Record<string, unknown>) {
  form.hidden = false;
  const p: Personal = { ...EMPTY_PERSONAL, ...((s[K.personal] as Partial<Personal>) ?? {}) };
  for (const k of ['readerName', 'caregiverName', 'caregiverPhone', 'message'] as const) $<HTMLInputElement>(k).value = p[k];
  photo = p.photo;
  preview();
  $<HTMLInputElement>('configUrl').value = (s[K.configUrl] as string) ?? '';
  try {
    const managed = await chrome.storage.managed.get('configUrl');
    if (managed.configUrl) {
      $<HTMLInputElement>('configUrl').value = managed.configUrl as string;
      $<HTMLInputElement>('configUrl').disabled = true;
      $('managedNote').hidden = false;
    }
  } catch {
    /* not managed */
  }
  renderStatus(s);
}

function preview() {
  const img = $<HTMLImageElement>('photoPreview');
  img.src = photo;
  img.style.display = photo ? 'block' : 'none';
}

/** Shrinks the photo to at most 400px so it stays small in local storage. */
async function shrink(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

$<HTMLInputElement>('photo').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) {
    photo = await shrink(f);
    preview();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('saveMsg');
  const personal: Personal = {
    readerName: $<HTMLInputElement>('readerName').value.trim(),
    caregiverName: $<HTMLInputElement>('caregiverName').value.trim(),
    caregiverPhone: $<HTMLInputElement>('caregiverPhone').value.trim(),
    message: $<HTMLTextAreaElement>('message').value.trim(),
    photo,
  };
  const update: Record<string, unknown> = { [K.personal]: personal };
  const code = $<HTMLInputElement>('unlockCode').value.trim();
  const pin = $<HTMLInputElement>('pin').value.trim();
  if (code && code.length < 4) return void (msg.textContent = 'Unlock code needs at least 4 digits.');
  if (pin && pin.length < 4) return void (msg.textContent = 'PIN needs at least 4 digits.');
  if (code) update[K.localUnlock] = await makeSecret(code);
  if (pin) update[K.pin] = await makeSecret(pin);
  const url = $<HTMLInputElement>('configUrl');
  if (!url.disabled) update[K.configUrl] = url.value.trim();
  await chrome.storage.local.set(update);
  $<HTMLInputElement>('unlockCode').value = '';
  $<HTMLInputElement>('pin').value = '';
  msg.className = 'ok';
  msg.textContent = 'Saved.';
  renderStatus(await chrome.storage.local.get(null));
});

function renderStatus(s: Record<string, unknown>) {
  const fmt = (t: unknown) => (typeof t === 'number' ? new Date(t).toLocaleString() : 'not yet');
  const lines = [
    `Extension version: ${chrome.runtime.getManifest().version}`,
    `Scam-topic data last updated: ${fmt(s[K.dataSyncedAt])}`,
    `Family config last updated: ${s[K.configUrl] ? fmt(s[K.configSyncedAt]) : 'no config URL set'}`,
    `Unlock code set on this computer: ${(s[K.localUnlock] as Secret | undefined)?.hash ? 'yes' : 'no'}`,
  ];
  $('status').replaceChildren(...lines.map((l) => Object.assign(document.createElement('div'), { textContent: l })));
}

void init();
