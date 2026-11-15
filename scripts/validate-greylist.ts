// Validates data/greylist-topics.json: schema, unique ids, score = breakdown sum, patterns compile.
// Runs in CI on every push so a bad data file never reaches anyone's browser.
import { readFileSync } from 'node:fs';
import { GreylistSchema } from '../extension/src/shared/config';

const raw = JSON.parse(readFileSync('data/greylist-topics.json', 'utf8'));
const parsed = GreylistSchema.safeParse(raw);
if (!parsed.success) {
  console.error(parsed.error.format());
  process.exit(1);
}
const errors: string[] = [];
const ids = new Set<string>();
for (const t of parsed.data.topics) {
  if (ids.has(t.id)) errors.push(`${t.id}: duplicate id`);
  ids.add(t.id);
  const b = t.scoreBreakdown;
  const sum = b.enforcement + b.affiliate + b.ageSkew + b.lossSize;
  if (sum !== t.score) errors.push(`${t.id}: score ${t.score} ≠ breakdown sum ${sum}`);
  for (const p of t.patterns) {
    try {
      new RegExp(p, 'i');
    } catch (e) {
      errors.push(`${t.id}: bad pattern ${p}: ${(e as Error).message}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`greylist OK: ${parsed.data.topics.length} topics`);
