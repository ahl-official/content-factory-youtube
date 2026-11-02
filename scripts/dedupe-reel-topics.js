// One-off cleanup for the Reel Engine `topics` sheet.
//
// The old full-save path duplicated rows, and topic ids were a per-browser
// counter starting at 1, so many topics share an id. Saves now match rows by
// id (/api/db/patch), which needs every id to be unique.
//
// This script drops rows that are exact copies of another row and gives every
// remaining topic a fresh unique id. It writes a JSON backup first.
//
//   node scripts/dedupe-reel-topics.js           # dry run: report only
//   node scripts/dedupe-reel-topics.js --apply   # back up, then rewrite the sheet
//
// Needs REEL_SHEET_ID (or GOOGLE_SHEET_ID), GOOGLE_SERVICE_ACCOUNT_EMAIL and
// GOOGLE_PRIVATE_KEY, the same variables the server uses.
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function main() {
  const apply = process.argv.includes('--apply');
  const sheetId = process.env.REEL_SHEET_ID || process.env.GOOGLE_SHEET_ID;
  if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Set REEL_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY');
  }
  const doc = new GoogleSpreadsheet(sheetId, new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  }));
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle.topics;
  if (!sheet) throw new Error(`No "topics" tab in "${doc.title}"`);

  const rows = await sheet.getRows();
  const headers = sheet.headerValues;
  const raw = rows.map(r => Object.fromEntries(headers.map(h => [h, r.get(h) ?? ''])));

  // Exact copies: identical in every column except id.
  const seen = new Set();
  const kept = raw.filter(row => {
    const { id, ...rest } = row;
    const key = JSON.stringify(rest);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const base = Date.now() * 1000;
  const cleaned = kept.map((row, i) => ({ ...row, id: String(base + i) }));
  const distinctIds = new Set(raw.map(r => String(r.id))).size;

  console.log(`Sheet: "${doc.title}"`);
  console.log(`topics rows: ${raw.length}, distinct ids: ${distinctIds}, after removing exact copies: ${cleaned.length}`);
  if (!apply) {
    console.log('Dry run. Re-run with --apply to back up and rewrite the topics tab.');
    return;
  }

  const backupPath = path.join(process.cwd(), `topics-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ headers, rows: raw }, null, 2));
  console.log(`Backup written: ${backupPath}`);

  await sheet.clearRows();
  await sheet.addRows(cleaned);
  console.log(`Rewrote topics tab with ${cleaned.length} rows.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
