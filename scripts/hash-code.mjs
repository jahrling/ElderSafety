// Prints unlockCodeHash/unlockCodeSalt for the family config: npm run hash-code -- 1234
import { createHash, randomBytes } from 'node:crypto';

const code = process.argv[2];
if (!code || code.length < 4) {
  console.error('Usage: npm run hash-code -- <code of at least 4 digits>');
  process.exit(1);
}
const salt = randomBytes(12).toString('hex');
const hash = createHash('sha256').update(salt + code).digest('hex');
console.log(JSON.stringify({ unlockCodeHash: hash, unlockCodeSalt: salt }, null, 2));
