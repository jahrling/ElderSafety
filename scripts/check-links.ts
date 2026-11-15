// Checks every source/alternative URL in the greylist still resolves. Needs network; run occasionally.
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/greylist-topics.json', 'utf8'));
const urls = new Set<string>();
for (const t of data.topics) for (const l of [...t.sources, ...t.alternatives]) urls.add(l.url);

let bad = 0;
await Promise.all(
  [...urls].map(async (url) => {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (link check)' } });
      if (res.status >= 400) {
        bad++;
        console.log(`${res.status}  ${url}`);
      }
    } catch (e) {
      bad++;
      console.log(`ERR  ${url}  ${(e as Error).message}`);
    }
  }),
);
console.log(`${urls.size - bad}/${urls.size} links OK`);
process.exit(bad ? 1 : 0);
