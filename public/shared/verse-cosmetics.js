/* Shared Studyverse account COSMETICS across all three standalone trainers.
   No rewards or state writes; the equipment lives in studyverse_profile_v1. */
(function(){
'use strict';
const PROFILE_KEY='studyverse_profile_v1';
const SLOTS=['theme','atm','frame','font','banner','fx'];
const BANNERS={
 gold:['🏆','✦','🥇'],warning:['⚠️','🧪','⚡'],galaxy:['🪐','✨','🌠'],
 molecule:['⚛️','🔬','✦'],flow:['▣','→','▣'],curve:['📈','✦','📊'],
 cloud:['☁️','☁','☀️'],solitaire:['A♠','K♥','Q♦'],
 pink_paradise:['♥','💗','✦'],parallel_pulse:['♯','⚡','✧']
};
const TITLES={
 title_chaos:'Professor Fischer',title_pizza:'Mozzarella-Magister',title_orbit:'Orbit-Gott',
 title_legend:'Labor-Legende',dsai_title_code:'Snippet-Slayer',
 dsai_title_crisp:'CRISP-DM-Guru',dsai_title_weber:'Professorin Weber',
 dsai_title_boss:'Artificial Legend',sharp_title_thread:'Threadstarter',
 sharp_title_lock:'Lockpicker',sharp_title_spermann:'Professor Spermann'
};
const EFFECTS={
 effects:'🎊',effect_coinrain:'🪙',effect_discoin:'🪩',
 neural_spark:'✧',thread_sparks:'⚡',pulse_rings:'◯'
};
let lastBanner='';
let lastFx='';
function readProfile(){
 try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');return p&&typeof p==='object'&&!Array.isArray(p)?p:null}
 catch{return null}
}
function ensureLayer(cls){
 let node=document.querySelector('.'+cls);
 if(!node){node=document.createElement('div');node.className=cls;node.setAttribute('aria-hidden','true');document.body.appendChild(node)}
 return node;
}
function decorateHeroes(banner){
 const items=BANNERS[banner]||[];
 document.querySelectorAll('.hero').forEach(hero=>{
  let layer=hero.querySelector(':scope > .verse-banner');
  if(!layer){
   layer=document.createElement('div');layer.className='verse-banner';layer.setAttribute('aria-hidden','true');
   hero.appendChild(layer);
  }
  if(layer.dataset.banner===banner)return;
  layer.dataset.banner=banner;
  layer.replaceChildren();
  for(const [i,ch] of items.entries()){
    const span=document.createElement('span');
    span.textContent=ch;
    if(banner==='solitaire')span.classList.add('verse-card');
    span.style.animationDelay=(-1.4*i)+'s';
    layer.appendChild(span);
  }
 });
}
function refreshFx(fx){
 if(lastFx===fx&&document.querySelector('.verse-fx'))return;
 const layer=ensureLayer('verse-fx');
 layer.replaceChildren();
 const symbol=EFFECTS[fx]||'';
 if(symbol){
  for(let i=0;i<9;i++){
   const span=document.createElement('i');
   span.style.setProperty('--i',i);
   span.style.left=(6+i*11)+'%';
   span.style.top=(10+(i%4)*21)+'%';
   span.textContent=symbol;
   layer.appendChild(span);
  }
 }
 lastFx=fx;
}
function applyEquipment(){
 const profile=readProfile();
 const equip=profile&&profile.equipped&&typeof profile.equipped==='object'?profile.equipped:{};
 for(const slot of SLOTS){
  if(typeof equip[slot]==='string'&&equip[slot].length<80)document.body.dataset[slot]=equip[slot];
 }
 const banner=document.body.dataset.banner||'default';
 const fx=document.body.dataset.fx||'none';
 ensureLayer('verse-atmosphere');
 refreshFx(fx);
 decorateHeroes(banner);
 const avatar=typeof equip.avatar==='string'&&equip.avatar?equip.avatar:null;
 if(avatar){
  for(const sel of ['#levelAvatar','#brandAvatar','#avatar','.profile-link .avatar']){
   document.querySelectorAll(sel).forEach(el=>{if(el.textContent!==avatar)el.textContent=avatar});
  }
 }
 const title=typeof equip.title==='string'?TITLES[equip.title]:null;
 const topbar=document.querySelector('.topbar');
 if(topbar){
  let tag=topbar.querySelector('.verse-equipped-title');
  if(title){
   if(!tag){tag=document.createElement('span');tag.className='verse-equipped-title';topbar.appendChild(tag)}
   tag.textContent='🏅 '+title;
  }else if(tag)tag.remove();
 }
}
let scheduled=false;
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;applyEquipment()});
}
function init(){
 if(!document.body)return;
 applyEquipment();
 const observer=new MutationObserver(schedule);
 observer.observe(document.body,{subtree:true,childList:true});
 window.addEventListener('storage',event=>{if(event.key===PROFILE_KEY)schedule()});
 window.addEventListener('pageshow',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
