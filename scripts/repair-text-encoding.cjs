const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const CP1252_UNICODE_TO_BYTE = new Map([
  [0x20AC, 0x80], [0x201A, 0x82], [0x0192, 0x83], [0x201E, 0x84], [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87],
  [0x02C6, 0x88], [0x2030, 0x89], [0x0160, 0x8A], [0x2039, 0x8B], [0x0152, 0x8C], [0x017D, 0x8E], [0x2018, 0x91],
  [0x2019, 0x92], [0x201C, 0x93], [0x201D, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97], [0x02DC, 0x98],
  [0x2122, 0x99], [0x0161, 0x9A], [0x203A, 0x9B], [0x0153, 0x9C], [0x017E, 0x9E], [0x0178, 0x9F]
]);

const markerRegex = /[ÃÂâÄÅÆ]/;
const suspiciousRegex = /[ÃÂâÄÅÆƒ‚�œŒŠšŽžŸ]/;
const cpChunkRegex = /[A-Za-z0-9\u00C0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A€]+/g;

function repairChunk(chunk) {
  if (!markerRegex.test(chunk)) return chunk;
  const bytes = [];
  for (const ch of chunk) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xFF) {
      bytes.push(cp);
      continue;
    }
    const mapped = CP1252_UNICODE_TO_BYTE.get(cp);
    if (typeof mapped === 'number') {
      bytes.push(mapped);
      continue;
    }
    return chunk;
  }
  const decoded = Buffer.from(bytes).toString('utf8');
  if (!decoded) return chunk;
  const beforeBad = (chunk.match(/[ÃÂâÄÅÆ�]/g) || []).length;
  const afterBad = (decoded.match(/[ÃÂâÄÅÆ�]/g) || []).length;
  if (afterBad > beforeBad) return chunk;
  return decoded;
}

function normalizeMojibakeText(input) {
  let out = String(input ?? '');
  if (!suspiciousRegex.test(out)) return out;

  for (let pass = 0; pass < 4; pass += 1) {
    const prev = out;
    out = out.replace(cpChunkRegex, (chunk) => repairChunk(chunk));
    if (out === prev) break;
    if (!suspiciousRegex.test(out)) break;
  }
  return out;
}

function shouldSkipString(value) {
  const s = String(value || '');
  if (!suspiciousRegex.test(s)) return true;
  if (/^data:[^\n]{0,200};base64,/i.test(s)) return true;
  if (s.length > 120000 && /base64,/i.test(s)) return true;
  return false;
}

function sanitizeObjectStrings(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  let changed = false;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const entry = value[i];
      if (typeof entry === 'string') {
        if (shouldSkipString(entry)) continue;
        const next = normalizeMojibakeText(entry);
        if (next !== entry) {
          value[i] = next;
          changed = true;
        }
      } else if (entry && typeof entry === 'object') {
        if (sanitizeObjectStrings(entry, seen)) changed = true;
      }
    }
    return changed;
  }

  Object.keys(value).forEach((key) => {
    const entry = value[key];
    if (typeof entry === 'string') {
      if (shouldSkipString(entry)) return;
      const next = normalizeMojibakeText(entry);
      if (next !== entry) {
        value[key] = next;
        changed = true;
      }
      return;
    }
    if (entry && typeof entry === 'object' && sanitizeObjectStrings(entry, seen)) {
      changed = true;
    }
  });

  return changed;
}

function repairPlainTextFile(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const next = normalizeMojibakeText(raw);
  if (next !== raw) {
    fs.writeFileSync(absPath, next, 'utf8');
    return true;
  }
  return false;
}

function repairJsonFile(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = JSON.parse(raw);
  const changed = sanitizeObjectStrings(parsed);
  if (!changed) return false;
  fs.writeFileSync(absPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  return true;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Kullanim: node scripts/repair-text-encoding.cjs <dosya...>');
  process.exit(1);
}

const touched = [];
for (const rel of files) {
  const abs = path.resolve(root, rel);
  if (!fs.existsSync(abs)) {
    console.warn(`Atlandi (yok): ${rel}`);
    continue;
  }
  const ext = path.extname(abs).toLowerCase();
  let changed = false;
  try {
    if (ext === '.json') changed = repairJsonFile(abs);
    else changed = repairPlainTextFile(abs);
  } catch (error) {
    console.error(`Hata (${rel}): ${error?.message || error}`);
    process.exitCode = 1;
    continue;
  }
  if (changed) touched.push(rel);
}

if (process.exitCode) process.exit(process.exitCode);

if (!touched.length) {
  console.log('Encoding onarimi: degisiklik yok.');
} else {
  console.log('Encoding onarimi tamamlandi:');
  touched.forEach((row) => console.log(`- ${row}`));
}
