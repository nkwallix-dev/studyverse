'use strict';
/* MathsVerse is deliberately parked until the next maths exam.
 * Its subject entry remains visible, but no previous homework material, trainer
 * shortcut or shop cosmetics may be exposed to new players. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('src/app/app.ts','utf8');
const html=fs.readFileSync('src/app/app.html','utf8');
const registry=fs.readFileSync('src/app/trainer-registry.ts','utf8');
const shop=fs.readFileSync('src/app/shop-items.ts','utf8');
assert(app.includes("id:'mat',short:'AM'"),'Mathematics must still be a subject in Studyverse');
assert(app.includes("subjectHasTrainer(id:string):boolean{return TRAINERS.some"),
 'Subject is only enterable with an active registered test');
assert(!registry.includes("id:'maths-hw-02'"),'Old homework course must no longer be registered');
assert(!shop.includes("id:'maths-hw-02'"),'Old MathsVerse shop collection must be removed');
assert(!shop.includes("id:'maths_avatar_pi'")&&!shop.includes("id:'maths_title_integral'"),
 'Both old MathsVerse cosmetics must be absent from the catalog');
assert(!fs.existsSync('public/maths/hw-02/index.html'),
 'Old MathsVerse homepage must be deleted');
assert(!fs.existsSync('public/maths/hw-02/app.js'),
 'Old MathsVerse course assets must be deleted');
assert(html.includes('[disabled]="!subjectHasTrainer(s.id)"'),
 'MathsVerse must display as locked / coming soon');
assert(html.includes('COMING SOON'), 'Unavailable subject should be explicitly marked');
assert(html.includes('*ngFor="let trainer of trainers"'),
 'No hardcoded MathsVerse sidebar link should remain');
console.log('PASS: MathsVerse is visible but locked, previous lessons and 2 shop items removed.');
