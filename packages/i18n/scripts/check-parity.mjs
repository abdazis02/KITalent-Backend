#!/usr/bin/env node
/**
 * Translation parity checker — PRD §10.34 #10 (stable, lint-able keys).
 * Fails (exit 1) if any namespace/key exists in one locale but not the other.
 * Run: `pnpm --filter @kitalent/i18n check:keys`
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'locales');
const BASE = 'id-ID';
const TARGET = 'en-US';

function flatten(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
}

function loadKeys(locale, ns) {
  const file = join(root, locale, `${ns}.json`);
  if (!existsSync(file)) return null;
  return new Set(flatten(JSON.parse(readFileSync(file, 'utf8'))));
}

let failed = false;
const namespaces = readdirSync(join(root, BASE)).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

for (const ns of namespaces) {
  const base = loadKeys(BASE, ns);
  const target = loadKeys(TARGET, ns);
  if (!target) {
    console.error(`✖ ${ns}: missing in ${TARGET}`);
    failed = true;
    continue;
  }
  const missingInTarget = [...base].filter((k) => !target.has(k));
  const missingInBase = [...target].filter((k) => !base.has(k));
  if (missingInTarget.length) {
    console.error(`✖ ${ns}: keys missing in ${TARGET}: ${missingInTarget.join(', ')}`);
    failed = true;
  }
  if (missingInBase.length) {
    console.error(`✖ ${ns}: keys missing in ${BASE}: ${missingInBase.join(', ')}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`✓ Locale parity OK across ${namespaces.length} namespaces.`);
