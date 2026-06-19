#!/usr/bin/env node
// 放到 scripts/sync-version.mjs。把 <CRATE_NAME> 改成 src-tauri/Cargo.toml 的 package name。
// 把版本号同步到 package.json / tauri.conf.json / Cargo.toml / Cargo.lock
// 用法：node scripts/sync-version.mjs <version>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version ?? '')) {
  console.error(`版本号格式不合法：${version}（应形如 0.2.0）`);
  process.exit(2);
}
function patch(rel, fn) {
  const path = resolve(root, rel);
  writeFileSync(path, fn(readFileSync(path, 'utf8')));
  console.log(`✓ ${rel} → ${version}`);
}
const jsonVersion = (t) => t.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
patch('package.json', jsonVersion);
patch('src-tauri/tauri.conf.json', jsonVersion);
patch('src-tauri/Cargo.toml', (t) => t.replace(/^version = "[^"]*"/m, `version = "${version}"`));
patch('src-tauri/Cargo.lock', (t) =>
  t.replace(/(name = "<CRATE_NAME>"\nversion = )"[^"]*"/, `$1"${version}"`),
);
