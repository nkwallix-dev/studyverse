'use strict';
const assert = require('node:assert/strict'),fs = require('node:fs');
const read = path => fs.readFileSync(path,'utf8');
const html=read('src/app/app.html'),app=read('src/app/app.ts'),art=read('src/app/cosmetic-art.component.ts');
const preview=read('src/app/cosmetic-banner.component.ts'),styles=read('src/styles.scss');
const sharedCSS=read('public/shared/verse-cosmetics.css'),sharedJS=read('public/shared/verse-cosmetics.js');
const catalog=read('src/app/shop-items.ts');
for(const key of ['maths_curve','maths_integral']){
 const svg=read('public/cosmetics/banners/'+key+'.svg');
 assert(svg.includes('<svg ')&&svg.includes('</svg>')&&svg.includes('<path ')&&svg.length>2500,key+' not a complete SVG');
 const scene=key.replace('_','-');
 assert.equal(html.split('class="banner-scene scene-'+scene+'"').length-1,3,key+' scene absent in home, profile, or preview');
 assert(preview.includes("'"+key+"'")&&preview.includes("key.startsWith('maths_') ? '.svg' : '.webp'"),key+' thumbnail would fall back');
 assert(styles.includes('data-banner="'+key+'"')&&sharedCSS.includes('data-banner="'+key+'"'),key+' missing from a world');
 assert(catalog.includes("equip:'"+key+"'"),key+' shop ID changed');
}
for(const key of ['maths_chalk_fx','maths_delta_fx']){
 assert(catalog.includes("equip:'"+key+"'"),key+' shop ID changed');
 assert(styles.includes('data-fx="'+key+'"')&&sharedCSS.includes('data-fx="'+key+'"'),key+' missing styles');
 assert(sharedJS.includes(key+':['),key+' particle map absent');
}
assert(!html.includes('studyverse-maths-fx')&&!html.includes('equippedMathsEffect'), 'Permanent math FX overlay must be absent');
assert(html.includes('[attr.data-fx]="\'none\'"'), 'Homepage must never run equipped FX as wallpaper');
assert(sharedJS.includes('candidateAnswerClick')&&sharedJS.includes('feedbackConfirmsCorrect()'),'FX must respond to correct answers');
assert(sharedJS.includes("layer.classList.add('is-burst')")&&sharedJS.includes("layer.classList.remove('is-burst')"),'FX must expire');
assert(!sharedJS.includes('refreshFx(fx)'), 'Do not render FX automatically on equipment hydration');
assert(sharedCSS.includes('>.verse-fx.is-burst'), 'Event FX need activation class');
assert(html.includes('previewParticle(effect,i)')&&app.includes("item.id==='maths_chalk_fx'")&&app.includes("item.id==='maths_delta_fx'"),'Wrong preview particles');
assert(art.includes('effectParticle(n)'),'Shop card missing particles');
assert(styles.includes('maths-chalk-drift')&&styles.includes('maths-delta-ring'),'Both FX must be distinct');
console.log('PASS: real maths banners, three scenes, thumbnails, two FX, global and standalone views.');
