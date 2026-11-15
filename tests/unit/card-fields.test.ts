import { describe, expect, it, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';

let isCardField: (el: EventTarget | null) => boolean;
let doc: Document;

beforeAll(async () => {
  const dom = new JSDOM(`<form>
    <input id="a" autocomplete="cc-number">
    <input id="b" name="cardNumber">
    <label for="c">Security code</label><input id="c">
    <input id="d" name="email" autocomplete="email">
    <input id="e" autocomplete="cc-name">
  </form>`);
  Object.assign(globalThis, { HTMLInputElement: dom.window.HTMLInputElement, CSS: { escape: (s: string) => s } });
  doc = dom.window.document;
  ({ isCardField } = await import('../../extension/src/content/card-fields'));
});

describe('isCardField', () => {
  it('recognises card inputs', () => {
    for (const id of ['a', 'b', 'c']) expect(isCardField(doc.getElementById(id))).toBe(true);
  });
  it('ignores other inputs', () => {
    for (const id of ['d', 'e']) expect(isCardField(doc.getElementById(id))).toBe(false);
  });
});
