// Packs dist/ into eldersafety-<version>.zip for store upload.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
const name = `eldersafety-${version}.zip`;
execFileSync('zip', ['-r', `../${name}`, '.'], { cwd: 'dist', stdio: 'inherit' });
console.log(`Wrote ${name}`);
