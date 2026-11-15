import { ConfigSchema, DEFAULT_CONFIG, GreylistSchema, type Config, type Greylist } from './config';
import type { Personal } from './types';

/** Keys in chrome.storage.local. Everything stays on this computer. */
export const K = {
  config: 'config', // last good family config (parsed)
  configSyncedAt: 'configSyncedAt',
  greylist: 'greylist', // last good greylist data
  dataSyncedAt: 'dataSyncedAt',
  configUrl: 'configUrl',
  personal: 'personal',
  pin: 'pin', // { hash, salt } protecting the settings page
  localUnlock: 'localUnlock', // { hash, salt } unlock code set on the settings page
  cooling: 'cooling', // { [host]: firstPausedAt }
  unlocked: 'unlocked', // { [host]: until }
} as const;

export const EMPTY_PERSONAL: Personal = { caregiverName: '', caregiverPhone: '', readerName: '', message: '', photo: '' };

export interface Secret {
  hash: string;
  salt: string;
}

export async function loadState(): Promise<{ config: Config; greylist: Greylist | null; personal: Personal }> {
  const s = await chrome.storage.local.get([K.config, K.greylist, K.personal]);
  const c = ConfigSchema.safeParse(s[K.config] ?? {});
  const g = GreylistSchema.safeParse(s[K.greylist]);
  return {
    config: c.success ? c.data : DEFAULT_CONFIG,
    greylist: g.success ? g.data : null,
    personal: { ...EMPTY_PERSONAL, ...(s[K.personal] ?? {}) },
  };
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function makeSecret(code: string): Promise<Secret> {
  const salt = randomSalt();
  return { salt, hash: await sha256Hex(salt + code) };
}
