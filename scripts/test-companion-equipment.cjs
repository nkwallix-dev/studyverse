const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, filename);
const m = require('../src/app/features/dinoverse/equipment/companion-equipment.model.ts');
const { KennyWorld, STEP } = require('../src/app/features/dinoverse/platformer/kenny-platformer.world.ts');
const item = m.COMPANION_ITEMS[0].id;
let state = m.normalizeCompanions(null);
for (let i = 0; i < 49; i++) state = m.recordPickup(state, 'test_'+i, item);
assert.equal(m.countItem(state,item),49);
assert.equal(m.equipCompanion(state,item).equipped,null);
state=m.recordPickup(state,'test_49',item);
assert.equal(m.countItem(state,item),50);
assert.equal(m.equipCompanion(state,item).equipped,item);
state=m.recordPickup(state,'test_49',item);
assert.equal(m.countItem(state,item),50);
state=m.recordPickup(state,'test_50',item);
assert.equal(m.countItem(state,item),51);
state={...state,seen:[item]};
state=m.normalizeCompanions(JSON.parse(JSON.stringify(state)));
assert.deepEqual(state.seen,[item]);
const a=m.recordPickup(state,'device_a',item), b=m.recordPickup(state,'device_b',item);
assert.equal(m.countItem(m.mergeCompanions(a,b),item),53);
assert.deepEqual(m.mergeCompanions(a,b),m.mergeCompanions(b,a));
assert.equal(m.equipCompanion(m.equipCompanion(state,item),null).equipped,null);
for(const species of ['triceratops','stegosaurus']) {
 assert.equal(m.dropsFor(species,'basic').length,0);
 assert.equal(m.dropsFor(species,'medium',()=>0).length,1);
 assert.notEqual(m.dropsFor(species,'medium',()=>0)[0],m.dropsFor(species,'medium',()=>.99)[0]);
 assert.equal(new Set(m.dropsFor(species,'elite')).size,2);
}
const w=new KennyWorld(item);
assert(w.fusions.has(item));
const idle={axis:0,crouch:false,jump:false,jumpHeld:false,bite:false};
const enemy=w.enemies[1];
enemy.health=1;
w.player.x=enemy.x-45;
w.step(STEP,{...idle,bite:true});
assert.equal(w.loot.length,1);
assert.equal(w.pickupEvents.length,0,'Defeating an enemy is not a pickup');
w.player.x=w.loot[0].x;
w.step(STEP,idle);
assert.equal(w.pickupEvents.length,1);
for(let i=0;i<10;i++)w.step(STEP,idle);
assert.equal(w.pickupEvents.length,1,'Collision cannot duplicate a pickup');
assert.equal(new KennyWorld().fusions.size,0,'Run fusion must not leak into next run');
assert.equal(w.enemies[0].health,2);assert.equal(w.enemies[2].health,7);
console.log('Companion equipment: thresholds, deduplication, merge, persistence, equipment and real pickups passed.');

// Mock the Firestore REST boundary: retries merge into the latest remote profile.
(async () => {
 const { StudyverseCloud } = require('../src/app/cloud.ts');
 const cloud = new StudyverseCloud();
 cloud.config = { apiKey: 'test-only-api-key', projectId: 'test-project' };
 cloud.session = { uid: 'test-user', username: 'test', idToken: 'fixture', refreshToken: 'fixture', expiresAt: Date.now()+3600000 };
 let remote = {version:1,profile:{tokens:987,xp:456,inventory:['existing'],companions:m.recordPickup(null,'remote_one',item)},trainers:{existing:{done:true}}};
 let revision = 1, writes = 0;
 const originalFetch = global.fetch;
 global.fetch = async (url, init={}) => {
  assert(String(url).startsWith('https://firestore.googleapis.com/'));
  if(!init.method) return {ok:true,status:200,json:async()=>({updateTime:'rev'+revision,fields:{profile:{stringValue:JSON.stringify(remote)}}})};
  assert.equal(init.method,'PATCH');
  assert(String(url).includes('currentDocument.updateTime=rev'+revision));
  if(writes++===0) {
   remote.profile.companions=m.recordPickup(remote.profile.companions,'remote_two',item);
   remote.profile.tokens=999; revision++;
   return {ok:false,status:412};
  }
  remote=JSON.parse(JSON.parse(init.body).fields.profile.stringValue);revision++;
  return {ok:true,status:200};
 };
 try {
  const snapshot={version:1,profile:{tokens:1,xp:1,companions:m.recordPickup(null,'local_one',item)},trainers:{}};
  await cloud.save(snapshot,true);
  assert.equal(remote.profile.tokens,999,'Companion writes preserve the latest wallet');
  assert.equal(remote.profile.xp,456);
  assert.deepEqual(remote.profile.inventory,['existing']);
  assert.deepEqual(remote.trainers,{existing:{done:true}});
  assert.equal(m.countItem(remote.profile.companions,item),3);
  assert.equal(writes,2,'Precondition conflict retries against latest remote state');
  console.log('Companion cloud: conflict retry, merged pickups and unchanged remote wallet/trainers passed.');
 } finally {global.fetch=originalFetch;}
})().catch(error=>{console.error(error);process.exitCode=1;});
