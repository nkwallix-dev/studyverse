/* Companion availability shared by the homepage and Kennyverse.
 * Season 01: everybody may play while Kenny is visiting. At 25 feeds
 * (level 5) he becomes a permanent companion even after season end.
 * Unlocked cosmetics and settled cashback are unaffected.
 */
(function(root){
 'use strict';
 const KEY='studyverse_profile_v1';
 const START=Date.parse('2026-11-14T00:00:00+01:00');
 const END=Date.parse('2027-01-14T00:00:00+01:00');
 function current(now){
  const time=Number.isFinite(now)?now:Date.now();
  let profile=null;
  try{profile=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
  const state=profile&&profile.dinoSeasons&&profile.dinoSeasons['kenny-2026'];
  const feeds=Number.isSafeInteger(state&&state.feeds)&&state.feeds>=0?state.feeds:0;
  const active=time>=START&&time<END;
  const retained=feeds>=25;
  return {feeds,active,retained,available:active||retained,ended:time>=END};
 }
 root.STUDYVERSE_KENNY_ACCESS={current,
  available:now=>current(now).available,
  retained:now=>current(now).retained};
})(window);
