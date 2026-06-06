#!/usr/bin/env node
/**
 * ftp-restart.js — triggers a Phusion Passenger restart over FTP.
 *
 * cPanel's Node runtime (Passenger) recycles the app process on the next
 * request once <FTP_BASE_DIR>/tmp/restart.txt changes its mtime. This script
 * connects over (explicit) FTPS, ensures the tmp/ dir exists, and uploads a
 * fresh restart.txt to bump that mtime.
 *
 * Required env (set by the GitHub Action):
 *   FTP_HOST       → ftp.nanakfinserv.com
 *   FTP_PORT       → 21
 *   FTP_USER       → nanakfinserv
 *   FTP_PASSWORD   → (FTP password)
 *   FTP_SECURE     → "explicit" for explicit FTPS (default), "implicit", or "false"
 *   FTP_BASE_DIR   → /Backend/
 *
 * Run locally:  node scripts/ftp-restart.js
 */

const { Client } = require('basic-ftp');
const { Readable } = require('stream');

function parseSecure(value) {
  const v = String(value || 'explicit').toLowerCase();
  if (v === 'implicit') return 'implicit';
  if (v === 'false' || v === 'no' || v === '0') return false;
  return true; // explicit FTPS (AUTH TLS)
}

async function main() {
  const host = process.env.FTP_HOST;
  const port = Number(process.env.FTP_PORT || 21);
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const secure = parseSecure(process.env.FTP_SECURE);
  const baseDir = process.env.FTP_BASE_DIR || '/Backend/';

  if (!host || !user || !password) {
    throw new Error('Missing FTP_HOST / FTP_USER / FTP_PASSWORD env vars');
  }

  const tmpDir = `${baseDir.replace(/\/+$/, '')}/tmp`;
  const stamp = new Date().toISOString();

  const client = new Client(30_000);
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      port,
      user,
      password,
      secure,
      secureOptions: { rejectUnauthorized: false },
    });

    // Make sure tmp/ exists, then drop a fresh restart.txt to bump its mtime.
    // ensureDir() leaves the working directory inside tmp/, so upload with a
    // relative name — some servers reject an absolute path here with 553.
    await client.ensureDir(tmpDir);
    await client.uploadFrom(
      Readable.from([`restart requested at ${stamp}\n`]),
      'restart.txt',
    );

    console.log(`✅ Passenger restart triggered → ${tmpDir}/restart.txt (${stamp})`);
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error('❌ ftp-restart failed:', err.message);
  process.exit(1);
});
