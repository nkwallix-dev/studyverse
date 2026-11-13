const {test}=require('node:test');
const assert=require('node:assert/strict');
const {provisionalXp,levelFor}=require('../lib/rank.js');
const doc=xp=>({profile:JSON.stringify({version:1,profile:{xp}})});
test('level boundaries and cloud save envelope',()=>{
  assert.equal(levelFor(0),1);
  assert.equal(levelFor(109),1);
  assert.equal(levelFor(110),2);
  assert.equal(levelFor(440),3);
  assert.equal(provisionalXp(doc(440)),440);
});
test('malformed and invalid private saves do not change public levels',()=>{
  for(const value of [{},null,{profile:'broken'},doc(-1),doc(1.5),doc('440')])
    assert.equal(provisionalXp(value),null);
});
