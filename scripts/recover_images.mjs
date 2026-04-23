// Recover images.ktestone.com assets from Wayback Machine.
// 1) Build map (url -> best timestamp) from cdx_all.json.
// 2) Intersect with the deduped URL list extracted from src.
// 3) For each hit, download from web.archive.org/web/<ts>im_/<url> and save to public/images/<path>.
// 4) Emit a manifest of successes/failures so the rewrite step can reference it.

import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = path.resolve(import.meta.dirname, '..');
const CDX_PATH = path.join(ROOT, 'cdx_all.json');
const URLS_PATH = path.join(ROOT, 'image_urls.txt');
const OUT_DIR = path.join(ROOT, 'public', 'images');
const MANIFEST_PATH = path.join(ROOT, 'image_manifest.json');
const FAIL_LOG = path.join(ROOT, 'image_failures.txt');

const CONCURRENCY = Number(process.env.CONCURRENCY || 12);
const RETRY_LIMIT = 3;
const RETRY_BASE_MS = 1500;

const cdxRows = JSON.parse(fs.readFileSync(CDX_PATH, 'utf8'));
const cdxMap = new Map();
for (let i = 1; i < cdxRows.length; i++) {
  const [original, timestamp] = cdxRows[i];
  // Strip the scheme so we match `images.ktestone.com/...` keys.
  const key = original.replace(/^https?:\/\//, '');
  if (!cdxMap.has(key)) cdxMap.set(key, timestamp);
}

const wantedRaw = fs
  .readFileSync(URLS_PATH, 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);

const wanted = [...new Set(wantedRaw)];
const tasks = [];
const missing = [];
for (const u of wanted) {
  const ts = cdxMap.get(u);
  if (ts) tasks.push({ url: u, ts });
  else missing.push(u);
}

console.log(`Wanted: ${wanted.length}`);
console.log(`In Wayback: ${tasks.length}`);
console.log(`Not in Wayback: ${missing.length}`);

fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = { ok: [], failed: [], skipped_existing: [], not_in_wayback: missing };
let done = 0;
let lastLog = Date.now();

async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.status === 200) {
        const ct = res.headers.get('content-type') || '';
        if (!ct.startsWith('image/')) {
          throw new Error(`non-image content-type: ${ct}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        return buf;
      }
      if (res.status === 429 || res.status >= 500) {
        await sleep(RETRY_BASE_MS * attempt);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
      if (attempt < RETRY_LIMIT) await sleep(RETRY_BASE_MS * attempt);
    }
  }
  throw lastErr;
}

async function processOne({ url, ts }) {
  // url: images.ktestone.com/<path>
  const relPath = url.replace(/^images\.ktestone\.com\//, '');
  const dest = path.join(OUT_DIR, relPath);

  try {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      manifest.skipped_existing.push(relPath);
      return;
    }
    const wbUrl = `https://web.archive.org/web/${ts}im_/https://${url}`;
    const buf = await fetchWithRetry(wbUrl);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    manifest.ok.push(relPath);
  } catch (e) {
    manifest.failed.push({ url: relPath, err: String(e?.message || e) });
  } finally {
    done++;
    const now = Date.now();
    if (now - lastLog > 5000 || done === tasks.length) {
      const pct = ((done / tasks.length) * 100).toFixed(1);
      console.log(
        `${done}/${tasks.length} (${pct}%) ok=${manifest.ok.length} skip=${manifest.skipped_existing.length} fail=${manifest.failed.length}`
      );
      lastLog = now;
    }
  }
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i]);
    }
  });
  await Promise.all(runners);
}

const startedAt = Date.now();
await runPool(tasks, CONCURRENCY, processOne);
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log(`\nDone in ${elapsed}s`);
console.log(`  ok:                ${manifest.ok.length}`);
console.log(`  skipped (cached):  ${manifest.skipped_existing.length}`);
console.log(`  failed:            ${manifest.failed.length}`);
console.log(`  not_in_wayback:    ${manifest.not_in_wayback.length}`);

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  FAIL_LOG,
  [
    '# Failed downloads',
    ...manifest.failed.map((f) => `${f.url}\t${f.err}`),
    '',
    '# Not in Wayback (never archived)',
    ...manifest.not_in_wayback,
  ].join('\n')
);
console.log(`\nManifest: ${MANIFEST_PATH}`);
console.log(`Failure log: ${FAIL_LOG}`);
