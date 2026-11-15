import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../extension/src/shared/config';
import { matchTopic } from '../../extension/src/shared/greylist';
import { alternativesFor } from '../../extension/src/shared/alternatives';
import { greylist } from './helpers';

describe('greylist', () => {
  it('every score equals its breakdown and every topic has alternatives', () => {
    for (const t of greylist.topics) {
      const b = t.scoreBreakdown;
      expect(b.enforcement + b.affiliate + b.ageSkew + b.lossSize).toBe(t.score);
      expect(t.alternatives.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('matches permutations', () => {
    const cases: [string, string][] = [
      ['How to reverse your type 2 diabetes naturally', 'blood-sugar'],
      ['Silence tinnitus with this formula', 'tinnitus'],
      ['Move your 401k into gold before the crash', 'gold-ira'],
      ['Your Social Security number has been suspended', 'social-security'],
      ['Regrow your cartilage in 30 days', 'joint-pain'],
      ['Testosterone booster secret for men over 60', 'libido'],
    ];
    for (const [headline, id] of cases) expect(matchTopic(headline, '', greylist, DEFAULT_CONFIG)?.id).toBe(id);
  });
  it('caregiver overrides change the score', () => {
    const m = matchTopic('Gold IRA guide', '', greylist, { ...DEFAULT_CONFIG, topicOverrides: { 'gold-ira': 10 } });
    expect(m?.score).toBe(10);
  });
  it('health topics get research links', () => {
    const m = matchTopic('Reverse neuropathy fast', '', greylist, DEFAULT_CONFIG);
    const links = alternativesFor(m, 'NerveFix Pro');
    expect(links.some((l) => l.url.includes('pubmed.ncbi.nlm.nih.gov') && l.url.includes('systematicreview'))).toBe(true);
    expect(links.some((l) => l.title.includes('NerveFix Pro'))).toBe(true);
  });
});

describe('productNameFrom', async () => {
  const { productNameFrom } = await import('../../extension/src/shared/alternatives');
  const { JSDOM } = await import('jsdom');
  it('keeps hyphenated words', () => {
    const d = new JSDOM('<title>The 7-Second Ritual | Health News</title>').window.document;
    expect(productNameFrom(d)).toBe('The 7-Second Ritual');
  });
});
