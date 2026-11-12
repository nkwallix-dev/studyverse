'use strict';
// Pure policy checks: staging never changes a user's original economy.
const assert=require('node:assert/strict');
const {legacyWallet,same,digest}=require('./stage-wallets.cjs');
const original=JSON.stringify({version:1,profile:{
 nickname:'Klassenspieler',xp:5768,tokens:4481,inventory:['title','banner'],
 equipped:{title:'title'},claimedLevels:{'10':true}},trainers:{chem:{xp:2222}}});
const fromLegacy=legacyWallet({profile:original});
assert.equal(fromLegacy.xp,5768);
assert.equal(fromLegacy.tokens,4481);
assert.deepEqual(fromLegacy.inventory,['title','banner']);
assert.equal(fromLegacy.sourceHash,digest(original));
assert.equal(same(fromLegacy,{tokens:4481,xp:5768,inventory:['title','banner']}),true);
assert.equal(same(fromLegacy,{tokens:4481,xp:5769,inventory:['title','banner']}),false);
assert.equal(same(fromLegacy,{tokens:4481,xp:5768,inventory:['banner','title']}),false);
assert.throws(()=>legacyWallet({profile:JSON.stringify({profile:{xp:0,tokens:0,inventory:['a','a']}})}),
 /Legacy wallet malformed/);
assert.throws(()=>legacyWallet({profile:JSON.stringify({profile:{xp:-2,tokens:0,inventory:[]}})}),
 /Legacy wallet malformed/);
assert.equal(JSON.parse(original).profile.xp,5768,'Original XP untouched');
console.log('PASS: Shadow migration copies XP, TT, item order exactly and rejects malformed state.');
