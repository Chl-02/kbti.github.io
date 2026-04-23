// Rewrite source URLs to point to local /images/<path> for files we successfully
// downloaded. URLs whose local file is missing keep their current Wayback form.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const PUBLIC_IMG = path.join(ROOT, 'public', 'images');

const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.html']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

// Pattern matches both the wayback-wrapped form and the raw form, capturing the path.
const RE = /https:\/\/web\.archive\.org\/web\/[^\/]+im_\/https:\/\/images\.ktestone\.com\/([^'"\s\)\\<>]+)|https:\/\/images\.ktestone\.com\/([^'"\s\)\\<>]+)/g;

let filesScanned = 0;
let filesChanged = 0;
let rewrites = 0;
let kept = 0;

for (const file of walk(SRC)) {
  filesScanned++;
  const original = fs.readFileSync(file, 'utf8');
  let dirty = false;
  const next = original.replace(RE, (match, p1, p2) => {
    const relPath = p1 || p2;
    const local = path.join(PUBLIC_IMG, relPath);
    if (fs.existsSync(local) && fs.statSync(local).size > 0) {
      rewrites++;
      dirty = true;
      return `/images/${relPath}`;
    }
    kept++;
    return match;
  });
  if (dirty) {
    fs.writeFileSync(file, next);
    filesChanged++;
  }
}

console.log(`Files scanned:  ${filesScanned}`);
console.log(`Files changed:  ${filesChanged}`);
console.log(`URLs rewritten: ${rewrites}`);
console.log(`URLs kept:      ${kept}`);
