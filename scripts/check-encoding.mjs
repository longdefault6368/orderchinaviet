import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { TextDecoder } from 'node:util';

const root = resolve(import.meta.dirname, '..');
const scanRoots = ['frontend/app', 'frontend/components', 'frontend/lib', 'frontend/messages', 'backend/src', 'backend/prisma'];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.sql']);
const ignored = new Set(['node_modules', '.next', 'dist', '.git']);
const mojibake = /Ã[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u2013-\u203A]|Â[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u2013-\u203A]|â[€‚„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]|á[º»]|Ä[‘]|Æ[°¡]|ðŸ|å¹|VNÄ|â‚|ngÅ|Å©/u;
const decoder = new TextDecoder('utf-8', { fatal: true });
const errors = [];

function walk(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

for (const folder of scanRoots) {
  for (const file of walk(join(root, folder))) {
    if (!extensions.has(extname(file))) continue;
    let text;
    try { text = decoder.decode(readFileSync(file)); }
    catch { errors.push(`${relative(root, file)}: không phải UTF-8 hợp lệ`); continue; }
    text.split(/\r?\n/u).forEach((line, index) => {
      if (mojibake.test(line)) errors.push(`${relative(root, file)}:${index + 1}: ${line.trim().slice(0, 140)}`);
    });
  }
}

if (errors.length) {
  console.error('Phát hiện nội dung lỗi encoding/mojibake:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('Encoding check passed: UTF-8, không phát hiện mojibake.');
