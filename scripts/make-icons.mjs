// Generates the simple shield icons in extension/icons without any image library.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

function shield(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const u = x / size - 0.5, v = y / size;
      // Shield: flat-ish top, tapering to a point at the bottom.
      const half = v < 0.55 ? 0.4 : 0.4 * (1 - (v - 0.55) / 0.4);
      const inside = v > 0.08 && v < 0.95 && Math.abs(u) < half;
      // Heart-ish check mark stripe for contrast.
      const mark = inside && Math.abs(u + 0.02 - (v - 0.5) * 0.6) < 0.06 && v > 0.3 && v < 0.7;
      const i = y * (size * 4 + 1) + 1 + x * 4;
      const [r, g, b, a] = mark ? [255, 255, 255, 255] : inside ? [31, 111, 92, 255] : [0, 0, 0, 0];
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('extension/icons', { recursive: true });
for (const s of [16, 48, 128]) writeFileSync(`extension/icons/${s}.png`, shield(s));
console.log('icons written');
