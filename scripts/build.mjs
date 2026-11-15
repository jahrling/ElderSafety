// Builds the extension into dist/ (load this folder via chrome://extensions → "Load unpacked").
import { build, context } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const out = 'dist';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const common = {
  bundle: true,
  target: 'chrome110',
  sourcemap: false,
  logLevel: 'info',
};

const entries = [
  // Content scripts must be classic scripts (IIFE), not ES modules.
  { entryPoints: ['extension/src/content/index.ts'], outfile: `${out}/content.js`, format: 'iife' },
  { entryPoints: ['extension/src/background/service-worker.ts'], outfile: `${out}/service-worker.js`, format: 'esm' },
  { entryPoints: ['extension/src/setup/setup.ts'], outfile: `${out}/setup.js`, format: 'iife' },
];

function copyStatic() {
  cpSync('extension/manifest.json', `${out}/manifest.json`);
  cpSync('extension/src/setup/setup.html', `${out}/setup.html`);
  cpSync('extension/icons', `${out}/icons`, { recursive: true });
  cpSync('data', `${out}/data`, { recursive: true });
}

copyStatic();
if (watch) {
  for (const e of entries) await (await context({ ...common, ...e })).watch();
} else {
  await Promise.all(entries.map((e) => build({ ...common, ...e })));
}
