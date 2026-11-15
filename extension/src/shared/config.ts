import { z } from 'zod';

/**
 * The family config. The caregiver keeps their copy in a secret Gist (or any HTTPS URL)
 * and the extension re-reads it every few hours. See config/config.example.json.
 * Nothing in here should identify the family — personal details stay on the computer.
 */
export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  strictness: z.enum(['gentle', 'standard', 'strict']).default('standard'),
  modules: z
    .object({
      salespage: z.boolean().default(true),
      scamguard: z.boolean().default(true),
    })
    .default({}),
  /** Sites the family trusts. No warnings or payment pauses on these (subdomains included). */
  allowlist: z.array(z.string()).default([]),
  /** Optional hand-written list of sites to always treat as high risk. Empty by default. */
  denylist: z.array(z.string()).default([]),
  /** Remote-access tools the caregiver uses themselves, e.g. ["rustdesk.com"]. */
  allowedRemoteAccess: z.array(z.string()).default([]),
  coolingOffHours: z.number().min(1).max(168).default(24),
  /** SHA-256 hex of (salt + code). Generate with the setup page or `npm run hash-code`. */
  unlockCodeHash: z.string().regex(/^[0-9a-f]{64}$/).nullable().default(null),
  unlockCodeSalt: z.string().default(''),
  /** Raise or lower how much a greylist topic counts, by topic id. */
  topicOverrides: z.record(z.string(), z.number().min(0).max(100)).default({}),
});
export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = ConfigSchema.parse({});

/** Sites that are never flagged, whatever the family config says. Keeps false alarms down. */
export const BUILTIN_ALLOWLIST = [
  '.gov',
  'wikipedia.org',
  'medlineplus.gov',
  'mayoclinic.org',
  'clevelandclinic.org',
  'hopkinsmedicine.org',
  'cochrane.org',
  'cochranelibrary.com',
  'aarp.org',
  'microsoft.com',
  'apple.com',
  'google.com',
];

const LinkSchema = z.object({ title: z.string().min(1), url: z.string().url() });

export const TopicSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string(),
  category: z.enum(['health', 'money', 'government', 'prizes-relationships', 'tech', 'products']),
  /** Case-insensitive regular expressions matched against the page's title, headings and text. */
  patterns: z.array(z.string()).min(1),
  /** Used to prefill PubMed / MedlinePlus / YouTube searches in the "learn more" panel. */
  searchTerm: z.string(),
  score: z.number().min(0).max(100),
  scoreBreakdown: z.object({
    enforcement: z.number().min(0).max(40),
    affiliate: z.number().min(0).max(25),
    ageSkew: z.number().min(0).max(20),
    lossSize: z.number().min(0).max(15),
  }),
  status: z.enum(['seed-estimate', 'reviewed']),
  sources: z.array(LinkSchema).min(1),
  alternatives: z.array(LinkSchema).min(2),
});
export type Topic = z.infer<typeof TopicSchema>;

export const GreylistSchema = z.object({
  version: z.number(),
  updated: z.string(),
  topics: z.array(TopicSchema),
});
export type Greylist = z.infer<typeof GreylistSchema>;

/** Where the extension fetches fresh greylist data from (no store review needed for data fixes). */
export const DATA_URL =
  'https://raw.githubusercontent.com/jahrling/ElderSafety/main/data/greylist-topics.json';

/** Static page shown after the extension is removed. Served by GitHub Pages from /docs. */
export const UNINSTALL_PAGE = 'https://jahrling.github.io/ElderSafety/uninstalled.html';

export function parseConfig(raw: unknown): Config {
  return ConfigSchema.parse(raw);
}

/** True if `host` is `domain` or a subdomain of it. A leading-dot entry (".gov") matches a suffix. */
export function hostMatches(host: string, domain: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  const d = domain.toLowerCase().trim().replace(/^\*\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!d) return false;
  if (d.startsWith('.')) return h.endsWith(d);
  return h === d || h.endsWith('.' + d);
}

export function isAllowlisted(host: string, config: Config): boolean {
  return [...BUILTIN_ALLOWLIST, ...config.allowlist].some((d) => hostMatches(host, d));
}

export function isDenylisted(host: string, config: Config): boolean {
  return config.denylist.some((d) => hostMatches(host, d));
}

export const THRESHOLDS: Record<Config['strictness'], { caution: number; high: number }> = {
  gentle: { caution: 40, high: 75 },
  standard: { caution: 30, high: 60 },
  strict: { caution: 20, high: 45 },
};
