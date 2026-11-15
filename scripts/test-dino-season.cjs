'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/app/dino-season.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const stub={exports:{}};vm.runInNewContext(compiled,{module:stub,exports:stub.exports,Date,Math,Number,Object,Set,String,Error});
const d=stub.exports;
assert.deepEqual(Array.from({length:5},(_,i)=>d.dinoLevel([0,3,8,15,25][i])),[1,2,3,4,5]);
assert.equal(d.dinoLevel(24),4);assert.equal(d.dinoLevel(100),5);
assert.equal(d.KENNY_SEASON.price,300);
assert.equal(d.KENNY_SEASON.season,1);
assert.equal(d.isKennyActive(d.KENNY_SEASON.start),true);
assert.equal(d.isKennyActive(d.KENNY_SEASON.end),false);
for(const o of d.KENNY_ODDS)assert.equal(Object.values(o).reduce((n,x)=>n+x,0),100);
assert.deepEqual(Array.from(d.KENNY_ODDS,x=>x.event),[1,3,5,7,9]);
assert.deepEqual(Array.from(d.KENNY_ODDS,x=>x.token1000),[1,1,1,2,2]);
assert.deepEqual(Array.from(d.KENNY_ODDS,x=>x.token500),[5,5,5,5,5]);
assert.deepEqual(Array.from(d.KENNY_ODDS,x=>x.token100),[30,29,28,27,26]);
const professors=['title_chaos','dsai_title_weber','sharp_title_spermann'].map(id=>({id,drop:id.startsWith('sharp_')?'pos-pa-01':id.startsWith('dsai_')?'dsai-test-01':'nawi-test-01',group:'title',requirement:{metric:'boss',value:100},cost:1200}));
const ordinary=[{id:'small',drop:'nawi-test-01',group:'avatar',cost:200},{id:'medium',drop:'dsai-test-01',group:'banner',cost:500},{id:'large',drop:'nawi-test-01',group:'theme',cost:900}];
const pool=d.eligibleDinoItems([...professors,...ordinary],new Set());
assert.equal(pool.event.length,5);
assert.equal(pool.zebra.length,1);
assert.equal(d.KENNY_ZEBRA_SKIN.id,'kenny_skin_zebra');
assert.equal(d.KENNY_ODDS[4].zebra,0.5,'Level 5 zebra chance must be 0.5%');
assert.deepEqual(Array.from(d.KENNY_ODDS,x=>x.zebra),[0.1,0.2,0.3,0.4,0.5]);
assert.equal(d.KENNY_BLUE_AVATAR.id,'kenny_avatar');
assert.equal(d.KENNY_BLUE_SKIN.id,'kenny_skin_blue');
assert(!pool.event.some(item=>item.id==='kenny_avatar'),'Blue Kenny must unlock at level 5, not by chance');
assert(!pool.event.some(item=>item.id==='kenny_skin_blue'),'Blue skin accompanies the first colored skin, not a separate draw');
assert.equal(d.KENNY_SKIN_AVATARS.length,4);
for(const color of ['pink','green','red','zebra']){
 const avatar=d.kennyAvatarForSkin('kenny_skin_'+color);
 assert.equal(avatar.id,'kenny_avatar_'+color);
 assert.equal(d.kennyAvatarSkin(avatar.id),color);
 assert(!pool.event.some(item=>item.id===avatar.id),'Matching avatars must not take extra draw slots');
}
assert.equal(d.kennyAvatarSkin('🦖'),'blue','Existing blue equips must remain recognizable');
assert.equal(pool.small.length,1);assert.equal(pool.medium.length,1);assert.equal(pool.large.length,1);
assert(!Object.values(pool).flat().some(x=>professors.some(p=>p.id===x.id)));
assert.equal(d.drawDinoReward(5,pool,()=>.995).tokens,1000);
assert.equal(d.drawDinoReward(1,pool,()=>0).item.id,'small');
const noSmall=d.eligibleDinoItems(ordinary,new Set(['small','kenny_skin_red']));
assert.equal(noSmall.small.length,0);assert.equal(noSmall.event.length,4);
assert.equal(Object.values(d.actualDinoOdds(5,noSmall)).reduce((n,x)=>n+x,0),100);
assert.equal(d.actualDinoOdds(5,noSmall).token1000,2,'Removing owned items must not inflate token jackpots');
const rich=d.eligibleDinoItems([...ordinary,...Array.from({length:24},(_,i)=>({id:'extra_'+i,drop:'dsai-test-01',group:'avatar',cost:200}))],new Set());
assert.equal(rich.small.length,25);
assert.equal(d.actualDinoOdds(5,rich).event,9,'More than 20 ordinary rewards must not raise the level-five exclusive chance');
assert.equal(d.actualDinoOdds(5,noSmall).token100,48.5,'Empty small-item tier shifts to 100 TT, not the remaining cosmetics');
const sparse=d.eligibleDinoItems([{id:'sharp_only',drop:'pos-pa-01',group:'avatar',cost:200,requirement:{metric:'boss',value:99}}],new Set());
assert.equal(sparse.small.length,0,'Kenny must never drop Sharpverse cosmetics');
assert(Math.abs(d.actualDinoOdds(2,sparse).token100-90.8)<1e-8,'Empty regular tiers shift their chance to 100 TT');
const empty=d.eligibleDinoItems([...professors,...ordinary],new Set([
 ...professors.map(item=>item.id),...ordinary.map(item=>item.id),...d.KENNY_EVENT_ITEMS.map(item=>item.id)
]));
assert.equal(Object.values(empty).flat().length,0);
assert.equal(d.actualDinoOdds(5,empty).zebra,0,'Owned zebra cannot drop twice');
assert.equal(d.drawDinoReward(5,pool,()=>0.6675).item?.id,'kenny_skin_zebra','Zebra owns a reserved 0.5% slot');
const emptyOdds=d.actualDinoOdds(5,empty);
assert.equal(Object.values(emptyOdds).reduce((n,x)=>n+x,0),100);
assert.deepEqual([emptyOdds.token100,emptyOdds.token500,emptyOdds.token1000],[93,5,2]);
for(const [roll,tokens] of [[0,100],[.95,500],[.995,1000]]){
 const reward=d.drawDinoReward(5,empty,()=>roll);
 assert.equal(reward.tokens,tokens,'Exhausted item pools must still pay token prizes');
 assert.equal(reward.item,undefined);
}
const state={feeds:35,overfeeds:10,overTokenWins:1400,skin:'blue',settled:false,settlement:0};
assert.equal(d.cashbackDue(state),1500);
assert.equal(d.normalizeDinoState({...state,overfeeds:0}).overfeeds,10,
 'Old max-level feeds must count retroactively even if the former counter is stale');
const end=d.settleDinoSeason(state,d.KENNY_SEASON.end);
assert.equal(end.tokens,1500);assert.equal(end.item.id,'kenny_fossil_frame');
assert.equal(d.settleDinoSeason(end.state,d.KENNY_SEASON.end+1000),null,'Settlement must be once per season');
assert.equal(d.settleDinoSeason({...state,feeds:24,overfeeds:0},d.KENNY_SEASON.end).item,undefined);
assert.equal(d.settleDinoSeason(state,d.KENNY_SEASON.end-1),null);
assert(d.hasKennyCompanion(d.freshDinoState(),d.KENNY_SEASON.start),'Kenny visits during his active season');
assert(!d.hasKennyCompanion(d.freshDinoState(),d.KENNY_SEASON.end),'Kenny leaves at season end below level 5');
assert(!d.kennyStaysAfterSeason({...state,feeds:24}),'24 feeds do not grant permanent companionship');
assert(d.kennyStaysAfterSeason({...state,feeds:25}),'25 feeds retain Kenny permanently');
assert(d.hasKennyCompanion({...state,feeds:25},d.KENNY_SEASON.end+180*86400000),
 'Kennyverse stays unlocked beyond the season after reaching level 5');
const html=fs.readFileSync('src/app/app.html','utf8'),css=fs.readFileSync('src/styles.scss','utf8');
assert(html.includes('kenny-sprite')&&html.includes('kenny-avatar.png')&&html.includes('kenny-feeding'));
assert(html.includes('Kennyverse betreten')&&html.includes('kenny-reveal-modal')&&html.includes('openCompanions()'));
assert(!html.includes("shopTab===\'earn\'"),'No leftover earning tab');
const appTS=fs.readFileSync('src/app/app.ts','utf8');
assert(html.includes('class="kenny-test-unlock"')&&html.includes('(click)="testUnlockZebra()"'),
 'Dino-Verse temporarily provides a Test button for the zebra drop');
assert(html.includes('*ngIf="canTestUnlockZebra"'),'The free unlock cannot appear to everyone');
assert(appTS.includes('KENNY_EVENT_ITEMS.filter(item=>item.id!==KENNY_ZEBRA_SKIN.id)'),
 'The Test unlock is gated to collectors owning the other five exclusives');
assert(appTS.includes('this.cloudReady && this.cloudConfigured && !!this.cloud.session') &&
 appTS.includes('this.cloudMaySave') &&
 appTS.includes("!owned.has(KENNY_ZEBRA_SKIN.id)"),
 'The Test action must require a signed-in cloud account and cannot be claimed twice');
assert(appTS.includes('await this.syncCloudNow()')&&appTS.includes("this.cloudStatus!=='✓ Online gespeichert'"),
 'Test reward must be confirmed in Firebase before it is displayed');
assert(appTS.includes('this.profile=before;')&&appTS.includes('write(KEY,JSON.stringify(before));'),
 'Failed cloud writes must revert the temporary zebra reward');
assert(appTS.includes('KENNY_ZEBRA_SKIN.id,...(avatar?[avatar.id]:[])')&&
 appTS.includes("drop:{tier:'event',tokens:0,item:KENNY_ZEBRA_SKIN}"),
 'Zebra unlock must use the real event reward and grant the matching zebra avatar');
assert(html.includes('kenny-pool-dialog')&&!html.includes('Ein Futter kostet 300 TT. Du erhältst'),
 'Prize dialog must no longer waste vertical room on redundant instructions');
assert(css.includes('.universe.kenny-mode.kenny-mode{height:100dvh;min-height:0;overflow:hidden}'));
assert(css.includes('kenny-idle-strip.png')&&css.includes('kenny-feed-strip.png')&&css.includes('kenny-drone-flight')&&css.includes('kenny-meat-drop'));
console.log('PASS: Kenny odds, professor exclusions, unique items, levels, cashback and one-time finale.');
