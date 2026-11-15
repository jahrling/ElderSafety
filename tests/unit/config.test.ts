import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, hostMatches, isAllowlisted, parseConfig } from '../../extension/src/shared/config';
import { readFileSync } from 'node:fs';

describe('hostMatches', () => {
  it('matches domain and subdomains only', () => {
    expect(hostMatches('www.mybank.com', 'mybank.com')).toBe(true);
    expect(hostMatches('mybank.com', 'mybank.com')).toBe(true);
    expect(hostMatches('notmybank.com', 'mybank.com')).toBe(false);
    expect(hostMatches('mybank.com.evil.io', 'mybank.com')).toBe(false);
  });
  it('supports suffix entries and tolerates pasted URLs', () => {
    expect(hostMatches('www.ssa.gov', '.gov')).toBe(true);
    expect(hostMatches('www.mybank.com', 'https://mybank.com/login')).toBe(true);
    expect(hostMatches('www.mybank.com', '*.mybank.com')).toBe(true);
  });
});

describe('config', () => {
  it('built-in allowlist covers .gov', () => {
    expect(isAllowlisted('www.medicare.gov', DEFAULT_CONFIG)).toBe(true);
    expect(isAllowlisted('medicare-benefits-today.com', DEFAULT_CONFIG)).toBe(false);
  });
  it('example config parses', () => {
    const cfg = parseConfig(JSON.parse(readFileSync('config/config.example.json', 'utf8')));
    expect(cfg.allowlist.length).toBeGreaterThan(0);
  });
  it('rejects a malformed unlock hash', () => {
    expect(() => parseConfig({ unlockCodeHash: 'abc' })).toThrow();
  });
});
