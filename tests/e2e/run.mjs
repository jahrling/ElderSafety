// End-to-end check: loads the built extension into Chromium and visits local fixture pages.
// Usage: npm run e2e   (builds first). Uses the `playwright` package available on the machine.
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const server = createServer((req, res) => {
  try {
    const file = resolve('tests/fixtures', '.' + new URL(req.url, 'http://x').pathname);
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': 'text/html' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

const ext = resolve('dist');
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'es-e2e-')), {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});

let failures = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n    ${e.message.split('\n')[0]}`);
  }
}

const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));

await test('setup page opens on first install', async () => {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !ctx.pages().some((p) => p.url().includes('setup.html'))) await new Promise((r) => setTimeout(r, 100));
  assert.ok(ctx.pages().some((p) => p.url().includes('setup.html?first=1')));
});

// Personal details + a local unlock code "4321", as the setup page would store them.
await sw.evaluate(async () => {
  const salt = 'abc';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '4321'));
  const hash = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  await chrome.storage.local.set({
    personal: { readerName: 'Dad', caregiverName: 'Sam', caregiverPhone: '555-0100', message: 'Let’s look at this together.', photo: '' },
    localUnlock: { hash, salt },
  });
});

await test('VSL page shows a banner', async () => {
  const page = await ctx.newPage();
  await page.goto(`${base}/vsl-neuropathy.html`);
  await page.getByTestId('es-banner').waitFor({ timeout: 5000 });
  const text = await page.getByTestId('es-banner').innerText();
  assert.match(text, /Dad, careful/);
  await page.close();
});

await test('typing a card number on a VSL page is paused, unlock code releases it', async () => {
  const page = await ctx.newPage();
  await page.goto(`${base}/vsl-neuropathy.html`);
  await page.getByTestId('es-banner').waitFor({ timeout: 5000 });
  await page.locator('#cardnumber').focus();
  await page.getByTestId('es-pause').waitFor({ timeout: 5000 });
  const pause = await page.getByTestId('es-pause').innerText();
  assert.match(pause, /let’s slow down/i);
  assert.match(pause, /Call Sam/);
  assert.match(pause, /systematic|research|studies|MedlinePlus/i);
  await page.locator('#cardnumber').press('4');
  assert.equal(await page.locator('#cardnumber').inputValue(), '', 'card field should be blocked');
  await page.getByLabel('Unlock code').fill('1111');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await page.getByText('That code didn’t work.').waitFor({ timeout: 3000 });
  await page.getByLabel('Unlock code').fill('4321');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await page.getByTestId('es-pause').waitFor({ state: 'detached', timeout: 3000 });
  await page.locator('#cardnumber').fill('4242');
  assert.equal(await page.locator('#cardnumber').inputValue(), '4242');
  await page.close();
});

await test('fake tech-support page gets a full-screen warning', async () => {
  const page = await ctx.newPage();
  await page.goto(`${base}/techsupport.html`);
  await page.getByTestId('es-takeover-techsupport').waitFor({ timeout: 5000 });
  await page.close();
});

await test('ordinary shop: no banner and no pause', async () => {
  const page = await ctx.newPage();
  await page.goto(`${base}/legit-shop.html`);
  await page.waitForTimeout(1500);
  await page.locator('#cc').focus();
  await page.waitForTimeout(800);
  assert.equal(await page.getByTestId('es-banner').count(), 0);
  assert.equal(await page.getByTestId('es-pause').count(), 0);
  await page.locator('#cc').fill('4242');
  assert.equal(await page.locator('#cc').inputValue(), '4242');
  await page.close();
});

await test('health information article: no banner', async () => {
  const page = await ctx.newPage();
  await page.goto(`${base}/legit-health-article.html`);
  await page.waitForTimeout(1500);
  assert.equal(await page.getByTestId('es-banner').count(), 0);
  await page.close();
});

await ctx.close();
server.close();
console.log(failures ? `\n${failures} failed` : '\nall e2e checks passed');
process.exit(failures ? 1 : 0);
