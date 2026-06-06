#!/usr/bin/env node
/**
 * ftp-mirror.js — make remote /Backend an EXACT mirror of local Backend/.
 *
 *  - Deletes remote files that are NOT in local (extra / older code).
 *  - Uploads/overwrites all local files.
 *  - PRESERVES (never deleted, never recursed for deletion):
 *      .env, node_modules (symlink), uploads/, app/uploads/, tmp/
 *
 * Run:  node scripts/ftp-mirror.js          (dry-run: prints what it would delete)
 *       node scripts/ftp-mirror.js --apply  (actually delete + upload + restart)
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('basic-ftp');
const { Readable } = require('stream');

const HOST = 'ftp.nanakfinserv.com', PORT = 21, USER = 'nanakfinserv', PASS = process.env.FTP_PASSWORD;
const LOCAL_ROOT = path.resolve(__dirname, '..');
const REMOTE_ROOT = '/Backend';
const APPLY = process.argv.includes('--apply');

// Dir names skipped on BOTH sides (data / deps / server-managed).
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', '.vscode', '.idea',
  'uploads', 'tmp', 'logs', 'coverage', '.nyc_output', '.cache',
  '__tests__', 'test', 'tests',
]);
const PRESERVE_FILES = new Set(['.env']); // never delete these remote files

function skipFile(name) {
  if (name === '.env' || name.startsWith('.env')) return true;
  if (name.startsWith('.git')) return true;
  if (name === 'package-lock.json' || name === '.htaccess') return true;
  if (name === '.DS_Store' || name === 'Thumbs.db') return true;
  if (name === '.seed-state.json' || name === '.eslintcache') return true;
  if (name.endsWith('.log') || name.endsWith('.test.js') || name.endsWith('.spec.js')) return true;
  if (/^ftp-.*\.js$/.test(name)) return true;
  return false;
}

function localFiles(dir, rel, set) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      localFiles(path.join(dir, ent.name), rel ? `${rel}/${ent.name}` : ent.name, set);
    } else if (ent.isFile() && !skipFile(ent.name)) {
      set.add(rel ? `${rel}/${ent.name}` : ent.name);
    }
  }
  return set;
}

async function remoteFiles(c, dir, rel, out) {
  let list; try { list = await c.list(dir); } catch { return out; }
  for (const x of list) {
    const r = rel ? `${rel}/${x.name}` : x.name;
    if (x.isDirectory) { if (SKIP_DIRS.has(x.name)) continue; await remoteFiles(c, `${dir}/${x.name}`, r, out); }
    else if (x.isSymbolicLink) { /* node_modules link — leave it */ }
    else out.push(r);
  }
  return out;
}

async function main() {
  const local = localFiles(LOCAL_ROOT, '', new Set());
  const c = new Client(60_000); c.ftp.verbose = false;
  await c.access({ host: HOST, port: PORT, user: USER, password: PASS, secure: true, secureOptions: { rejectUnauthorized: false } });

  const remote = await remoteFiles(c, REMOTE_ROOT, '', []);
  const toDelete = remote.filter(r => !local.has(r) && !PRESERVE_FILES.has(r));

  console.log(`Local files: ${local.size} | Remote files: ${remote.length}`);
  console.log(`\n=== EXTRA/OLDER remote files to DELETE (${toDelete.length}) ===`);
  toDelete.forEach(f => console.log('  DEL  ' + f));

  if (!APPLY) {
    console.log('\n(dry-run) Re-run with --apply to delete the above, upload local, and restart.');
    c.close(); return;
  }

  console.log('\n--- Deleting ---');
  for (const r of toDelete) { try { await c.remove(`${REMOTE_ROOT}/${r}`); } catch (e) { console.log('  skip ' + r + ': ' + e.message); } }

  console.log('--- Uploading local (overwrite) ---');
  const ensured = new Set(); let n = 0;
  for (const r of local) {
    const remotePath = `${REMOTE_ROOT}/${r}`;
    const d = remotePath.slice(0, remotePath.lastIndexOf('/'));
    if (!ensured.has(d)) { await c.ensureDir(d); ensured.add(d); }
    await c.uploadFrom(path.join(LOCAL_ROOT, r), remotePath);
    if (++n % 30 === 0 || n === local.size) console.log(`  ${n}/${local.size}`);
  }

  console.log('--- Restarting (tmp/restart.txt) ---');
  await c.ensureDir(`${REMOTE_ROOT}/tmp`);
  await c.uploadFrom(Readable.from([`restart ${new Date().toISOString()}\n`]), 'restart.txt');

  c.close();
  console.log(`\n✅ Mirror complete. Deleted ${toDelete.length}, uploaded ${n}. Preserved: .env, node_modules, uploads/, app/uploads/, tmp/.`);
}
main().catch(e => { console.error('❌ FAILED:', e.message); process.exit(1); });
