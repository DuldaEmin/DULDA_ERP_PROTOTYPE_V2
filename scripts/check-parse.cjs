const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const targets = [
  'src/core/app-core.js',
  'src/modules/unit-module.js',
  'src/modules/stock-module.js',
  'src/modules/product-library-module.js',
  'src/modules/cnc-library-module.js'
];

const errors = [];

for (const relPath of targets) {
  const absPath = path.join(root, relPath);
  if (!fs.existsSync(absPath)) {
    errors.push(`Dosya bulunamadi: ${relPath}`);
    continue;
  }
  try {
    const source = fs.readFileSync(absPath, 'utf8');
    new Function(source);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    errors.push(`JS parse hatasi (${relPath}): ${message}`);
  }
}

if (errors.length > 0) {
  console.error('Backbone parse guard basarisiz:');
  for (const row of errors) {
    console.error(`- ${row}`);
  }
  process.exit(1);
}

console.log(`Backbone parse guard OK (${targets.length} dosya).`);
