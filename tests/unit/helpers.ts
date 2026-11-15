import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { DEFAULT_CONFIG, GreylistSchema, type Config } from '../../extension/src/shared/config';
import { makeContext } from '../../extension/src/shared/context';
import { assess } from '../../extension/src/shared/scorer';
import type { PageMetrics } from '../../extension/src/shared/types';

export const greylist = GreylistSchema.parse(JSON.parse(readFileSync('data/greylist-topics.json', 'utf8')));

export function load(fixture: string, url = 'https://example-offer.com/') {
  const html = readFileSync(`tests/fixtures/${fixture}`, 'utf8');
  const dom = new JSDOM(html, { url });
  return dom.window.document;
}

export function assessFixture(
  fixture: string,
  opts: { url?: string; config?: Partial<Config>; metrics?: PageMetrics | null } = {},
) {
  const url = opts.url ?? 'https://example-offer.com/';
  const doc = load(fixture, url);
  const ctx = makeContext(doc, new URL(url).hostname, opts.metrics ?? null);
  return assess(ctx, { ...DEFAULT_CONFIG, ...opts.config }, greylist);
}

export const ids = (a: { signals: { id: string }[] }) => a.signals.map((s) => s.id);
