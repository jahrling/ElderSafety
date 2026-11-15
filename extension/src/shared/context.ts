import type { PageMetrics } from './types';
import { headlineText, pageText } from './text';

/** Everything a signal needs, computed once per scan. */
export interface PageContext {
  doc: Document;
  host: string;
  text: string;
  headlines: string;
  metrics: PageMetrics | null;
  /** Milliseconds since the page loaded — lets signals notice things revealed later (VSL buy buttons). */
  elapsedMs: number;
}

export function makeContext(doc: Document, host: string, metrics: PageMetrics | null, elapsedMs = 0): PageContext {
  return { doc, host, text: pageText(doc), headlines: headlineText(doc), metrics, elapsedMs };
}
