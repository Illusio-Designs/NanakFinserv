#!/usr/bin/env node
/* Read-only: list the remote Backend directory tree (no changes made). */
const { Client } = require('basic-ftp');

const HOST = 'ftp.nanakfinserv.com';
const PORT = 21;
const USER = 'nanakfinserv';
const PASS = process.env.FTP_PASSWORD;

async function listDir(client, dir, depth, maxDepth) {
  let entries;
  try {
    entries = await client.list(dir);
  } catch (e) {
    console.log(`${'  '.repeat(depth)}[cannot list ${dir}: ${e.message}]`);
    return;
  }
  for (const e of entries) {
    const kind = e.isDirectory ? 'DIR ' : e.isSymbolicLink ? 'LINK' : 'file';
    const size = e.isFile ? ` (${e.size} b)` : '';
    console.log(`${'  '.repeat(depth)}${kind}  ${e.name}${size}`);
    if (e.isDirectory && depth < maxDepth) {
      await listDir(client, `${dir.replace(/\/+$/, '')}/${e.name}`, depth + 1, maxDepth);
    }
  }
}

async function main() {
  const client = new Client(30_000);
  client.ftp.verbose = false;
  try {
    await client.access({
      host: HOST, port: PORT, user: USER, password: PASS,
      secure: true, secureOptions: { rejectUnauthorized: false },
    });
    const cwd = await client.pwd();
    console.log(`Connected. Login directory: ${cwd}\n`);

    console.log('=== Root of FTP login ===');
    await listDir(client, '/', 0, 0);

    console.log('\n=== /Backend (top level + 1 deep) ===');
    await listDir(client, '/Backend', 0, 1);
  } finally {
    client.close();
  }
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
