#!/usr/bin/env node
'use strict';
// Safe-to-share overview. The full JSON report and approval manifest are
// private: never upload them to GitHub, paste them into public issues or CI.
const fs=require('node:fs'),path=require('node:path');
const flags=process.argv;
const idx=flags.indexOf('--report');
if(idx===-1||!flags[idx+1]){
 console.error('Usage: node scripts/show-wallet-summary.cjs --report security-reports/wallet-report.json');
 process.exit(2);
}
const filename=path.resolve(flags[idx+1]);
const report=JSON.parse(fs.readFileSync(filename,'utf8'));
if(!report||!Array.isArray(report.entries)||!report.readOnly){
 throw Error('Invalid or non-read-only wallet report');
}
console.log('STUDYVERSE WALLET REVIEW  |  '+report.project);
console.log('Scan: '+report.scannedAt+'  |  '+report.entries.length+' legacy user documents');
console.log('NO MIGRATION HAS BEEN EXECUTED BY THIS COMMAND');
console.log('');
console.log('NAME'.padEnd(26)+'TT'.padStart(12)+'XP'.padStart(12)+'  ITEMS  FLAGS');
for(const entry of [...report.entries].sort((a,b)=>(b.tokens||0)-(a.tokens||0))){
 const label=(entry.flags||[]).includes('REVIEW_NICKNAME')?'[Name zur Prüfung]':
  String(entry.nickname||'(unbekannt)').replace(/[\r\n\t]/g,' ').slice(0,25);
 console.log(label.padEnd(26)+String(entry.tokens).padStart(12)+
  String(entry.xp).padStart(12)+'  '+String(entry.inventory?.length||0).padStart(5)+
  '  '+(entry.flags||[]).join(','));
}
console.log('');
console.log('WARNING: This is an OWNER-REVIEW report, not an automated fraud verdict.');
console.log('Share this REDACTED SUMMARY if you want to discuss values; keep the private JSON file on your machine.');
