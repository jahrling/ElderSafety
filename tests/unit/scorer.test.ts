import { describe, expect, it } from 'vitest';
import { assessFixture, ids } from './helpers';

describe('scam pages score high', () => {
  it('VSL supplement page', () => {
    const a = assessFixture('vsl-neuropathy.html');
    expect(a.level).toBe('high');
    expect(ids(a)).toEqual(
      expect.arrayContaining(['vsl-player', 'vsl-urgency', 'vsl-hidden-buy', 'funnel-checkout', 'cure-claim', 'countdown', 'bulk-bottles']),
    );
    expect(a.topic?.id).toBe('neuropathy');
  });

  it('advertorial page', () => {
    const a = assessFixture('advertorial-bloodsugar.html');
    expect(a.level).toBe('high');
    expect(ids(a)).toEqual(expect.arrayContaining(['suppressed-truth', 'secret-trick', 'repeated-buy', 'funnel-checkout']));
    expect(a.topic?.id).toBe('blood-sugar');
  });

  it('gold IRA pitch is at least a caution, with the gold topic', () => {
    const a = assessFixture('gold-ira.html');
    expect(a.level).not.toBe('none');
    expect(a.topic?.id).toBe('gold-ira');
  });

  it('fake tech support takes over the screen', () => {
    const a = assessFixture('techsupport.html');
    expect(a.takeover).toBe('techsupport');
    expect(a.level).toBe('high');
  });

  it('gift card payment request', () => {
    const a = assessFixture('giftcard.html');
    expect(ids(a)).toContain('giftcard-code');
    expect(a.level).toBe('high');
  });

  it('remote-access download site takes over unless the caregiver allows it', () => {
    expect(assessFixture('legit-shop.html', { url: 'https://anydesk.com/en/downloads' }).takeover).toBe('remoteaccess');
    expect(
      assessFixture('legit-shop.html', { url: 'https://anydesk.com/en/downloads', config: { allowedRemoteAccess: ['anydesk.com'] } }).takeover,
    ).toBeNull();
  });
});

describe('legitimate pages stay quiet', () => {
  it('health information article', () => {
    expect(assessFixture('legit-health-article.html').level).toBe('none');
  });
  it('news story quoting scam language stays quiet', () => {
    expect(assessFixture('legit-news.html').level).toBe('none');
  });
  it('ordinary shop checkout', () => {
    expect(assessFixture('legit-shop.html').level).toBe('none');
  });
});

describe('config', () => {
  it('denylisted site is high even with no signals', () => {
    const a = assessFixture('legit-shop.html', { url: 'https://shop.bad-example.com/', config: { denylist: ['bad-example.com'] } });
    expect(a.level).toBe('high');
  });
  it('strictness changes thresholds', () => {
    const gentle = assessFixture('gold-ira.html', { config: { strictness: 'gentle' } });
    const strict = assessFixture('gold-ira.html', { config: { strictness: 'strict' } });
    const rank = { none: 0, caution: 1, high: 2 } as const;
    expect(rank[strict.level]).toBeGreaterThanOrEqual(rank[gentle.level]);
  });
  it('modules can be switched off', () => {
    const a = assessFixture('vsl-neuropathy.html', { config: { modules: { salespage: false, scamguard: true } } });
    expect(a.level).toBe('none');
  });
  it('a topic alone never warns', () => {
    const a = assessFixture('legit-health-article.html');
    expect(a.signals.find((s) => s.id.startsWith('topic:'))).toBeUndefined();
  });
});
