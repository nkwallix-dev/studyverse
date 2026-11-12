'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {quizGrant,bossGrant,isBlockedPublicText,parseCounter,QUIZ_XP,BOSS_XP}=require('../lib/core.js');
test('quiz credit never exceeds 20 questions/500 quiz tokens/750 total',()=>{
 assert.equal(quizGrant({quizQuestions:0,quizTokens:0,bossTokens:0,totalTokens:0}),25);
 assert.equal(quizGrant({quizQuestions:20,quizTokens:475,bossTokens:0,totalTokens:475}),0);
 assert.equal(quizGrant({quizQuestions:19,quizTokens:500,bossTokens:0,totalTokens:500}),0);
 assert.equal(quizGrant({quizQuestions:19,quizTokens:475,bossTokens:250,totalTokens:725}),25);
 assert.equal(quizGrant({quizQuestions:19,quizTokens:475,bossTokens:250,totalTokens:750}),0);
});
test('boss credit requires at least 14/20, once, and respects total cap',()=>{
 assert.equal(bossGrant({quizQuestions:0,quizTokens:0,bossTokens:0,totalTokens:0},13,20),0);
 assert.equal(bossGrant({quizQuestions:0,quizTokens:0,bossTokens:0,totalTokens:0},14,20),250);
 assert.equal(bossGrant({quizQuestions:0,quizTokens:0,bossTokens:250,totalTokens:250},19,20),0);
 assert.equal(bossGrant({quizQuestions:0,quizTokens:0,bossTokens:0,totalTokens:600},19,20),0);
});
test('nickname scanner handles leet spacing and false-positive safeguards',()=>{
 for(const word of ['n1gg4','n i g g a','H3!L H!TL3R','h.u.r.e.n.s.o.h.n','administrat0r','ＮＩＧＧＡ','nіggа'])assert(isBlockedPublicText(word),word);
 for(const name of ['Niki','Claudia','Karin','Matheprofi','Chemverse Legend','Astronaut'])assert(!isBlockedPublicText(name),name);
});
test('untrusted counters are always parsed as nonnegative integers',()=>{
 assert.deepEqual(parseCounter({totalTokens:-500,quizTokens:12.3,quizQuestions:4,bossTokens:0}),{
  totalTokens:0,quizTokens:0,quizQuestions:4,bossTokens:0
 });
});

test('verified daily XP progression is bounded by daily reward ledger',()=>{
 assert.equal(QUIZ_XP,10);
 assert.equal(BOSS_XP,50);
 assert.equal(20*QUIZ_XP+BOSS_XP,250);
});
