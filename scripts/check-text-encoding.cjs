const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');

function unique(arr) {
  return Array.from(new Set(arr));
}

function localAssetFromUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(https?:)?\/\//i.test(raw)) return '';
  const clean = raw.split('?')[0].split('#')[0].trim();
  if (!clean) return '';
  return clean.replace(/^\.\//, '');
}

function collectRuntimeFiles() {
  const files = ['index.html'];
  if (!fs.existsSync(indexPath)) return files;
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  const scriptRegex = /<script[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(indexHtml))) {
    const rel = localAssetFromUrl(scriptMatch[1]);
    if (!rel) continue;
    files.push(rel);
  }

  const cssRegex = /<link[^>]*\shref=["']([^"']+)["'][^>]*>/gi;
  let cssMatch;
  while ((cssMatch = cssRegex.exec(indexHtml))) {
    const rel = localAssetFromUrl(cssMatch[1]);
    if (!rel) continue;
    if (rel.toLowerCase().endsWith('.css')) files.push(rel);
  }

  return unique(files);
}

const suspiciousRegex = /[\uFFFD\u00C3\u00C2\u00E2\u00C4\u00C5\u00C6\u0192\u0152\u0153]/;
const badControlRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
const skipLiteralRegex = /(?:\\u00c3|\\u00c2|\\u00e2|\\u00c4|\\u00c5|\\u00c6)/i;

function indexToLineCol(text, idx) {
  const before = text.slice(0, idx);
  const line = before.split('\n').length;
  const lastNl = before.lastIndexOf('\n');
  const col = idx - (lastNl + 1) + 1;
  return { line, col };
}

function scanFile(relPath) {
  const absPath = path.join(root, relPath);
  if (!fs.existsSync(absPath)) return [];
  const source = fs.readFileSync(absPath, 'utf8');
  const findings = [];

  if (badControlRegex.test(source)) {
    const idx = source.search(badControlRegex);
    const { line, col } = indexToLineCol(source, idx);
    findings.push({ relPath, line, col, reason: 'kontrol karakteri' });
  }

  const regex = new RegExp(suspiciousRegex.source, 'g');
  let match;
  while ((match = regex.exec(source))) {
    const hit = match[0] || '';
    const around = source.slice(Math.max(0, match.index - 24), Math.min(source.length, match.index + 24));
    if (skipLiteralRegex.test(around)) continue;
    const { line, col } = indexToLineCol(source, match.index);
    findings.push({ relPath, line, col, reason: `supheli karakter: ${JSON.stringify(hit)}` });
    if (findings.length >= 20) break;
  }

  return findings;
}

const files = collectRuntimeFiles();
const allFindings = files.flatMap((relPath) => scanFile(relPath));

if (allFindings.length) {
  console.error('Metin encoding guard basarisiz. Supheli karakterler bulundu:');
  allFindings.slice(0, 80).forEach((f) => {
    console.error(`- ${f.relPath}:${f.line}:${f.col} -> ${f.reason}`);
  });
  process.exit(1);
}

console.log(`Metin encoding guard OK (${files.length} dosya).`);
