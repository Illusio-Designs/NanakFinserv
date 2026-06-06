#!/usr/bin/env node
/**
 * ftp-upload.js — one-shot: push local Backend/ to remote /Backend/.
 *
 * Mode: UPLOAD / OVERWRITE only. Never deletes a remote file.
 * Preserves on the server (skipped entirely): uploads/, tmp/, .env, node_modules.
 *
 * Run:  node scripts/ftp-upload.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('basic-ftp');

const HOST = 'ftp.nanakfinserv.com';
const PORT = 21;
const USER = 'nanakfinserv';
const PASS = process.env.FTP_PASSWORD;

const LOCAL_ROOT = path.resolve(__dirname, '..'); // Backend/
const REMOTE_ROOT = '/Backend';

// Directory names skipped anywhere in the tree.
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', '.vscode', '.idea',
  'uploads', 'tmp', 'logs', 'coverage', '.nyc_output', '.cache',
  '__tests__', 'test', 'tests',
]);

function skipFile(name) {
  if (name === '.env' || name.startsWith('.env')) return true;       // .env, .env.*
  if (name.startsWith('.git')) return true;                          // .gitignore, .gitIgnore
  if (name === 'package-lock.json') return true;
  if (name === '.htaccess') return true;
  if (name === '.DS_Store' || name === 'Thumbs.db') return true;
  if (name === '.seed-state.json' || name === '.eslintcache') return true;
  if (name.endsWith('.log')) return true;
  if (name.endsWith('.test.js') || name.endsWith('.spec.js')) return true;
  if (/^ftp-.*\.js$/.test(name)) return true;                        // local FTP helpers
  return false;
}

/** Collect [localPath, remotePath] pairs honoring the skip rules. */
function collect(localDir, remoteDir, out) {
  for (const ent of fs.readdirSync(localDir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      collect(path.join(localDir, ent.name), `${remoteDir}/${ent.name}`, out);
    } else if (ent.isFile()) {
      if (skipFile(ent.name)) continue;
      out.push([path.join(localDir, ent.name), `${remoteDir}/${ent.name}`]);
    }
  }
  return out;
}

async function main() {
  const files = collect(LOCAL_ROOT, REMOTE_ROOT, []);
  console.log(`Prepared ${files.length} files to upload.\n`);

  const client = new Client(60_000);
  client.ftp.verbose = false;
  await client.access({
    host: HOST, port: PORT, user: USER, password: PASS,
    secure: true, secureOptions: { rejectUnauthorized: false },
  });

  const ensured = new Set();
  let done = 0;
  for (const [local, remote] of files) {
    const remoteDir = remote.slice(0, remote.lastIndexOf('/'));
    if (!ensured.has(remoteDir)) {
      await client.ensureDir(remoteDir); // also changes cwd into it
      ensured.add(remoteDir);
    }
    await client.uploadFrom(local, remote);
    done++;
    if (done % 25 === 0 || done === files.length) {
      console.log(`  ${done}/${files.length} … ${remote}`);
    }
  }

  client.close();
  console.log(`\n✅ Done. Uploaded ${done} files to ${REMOTE_ROOT} (no deletions; uploads/, tmp/, .env, node_modules untouched).`);
}

main().catch((e) => { console.error('❌ FAILED:', e.message); process.exit(1); });
