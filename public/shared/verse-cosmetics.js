/* Shared Studyverse account COSMETICS across all three standalone trainers.
   No rewards or state writes; the equipment lives in studyverse_profile_v1. */
(function(){
'use strict';
const PROFILE_KEY='studyverse_profile_v1';
const DEFAULTS={theme:'base',atm:'none',frame:'none',font:'standard',banner:'default',fx:'none'};
const SLOTS=Object.keys(DEFAULTS);
const AVATAR_ROOT = new URL('../cosmetics/avatars/', document.currentScript.src);
const AVATAR_FILES = new Map(Object.entries({
  default: 'default_avatar.png',
  maths_avatar_pi: 'maths_pi_fox.svg',
  maths_owl: 'maths_euler_owl.svg',
  avatar_pizza: 'pizza_avatar.png',
  avatar_alien: 'alien_avatar.png',
  avatar_frog: 'laborfish_avatar.png',
  avatar_brain: 'galaxy_brain_avatar.png',
  avatar_crown: 'gold_crown_avatar.png',
  chem_flask: 'chem_flask_avatar.png',
  dsai_bot: 'dsai_bot_avatar.png',
  dsai_panda: 'dsai_panda_avatar.png',
  dsai_spider: 'dsai_spider_avatar.png',
  dsai_python: 'dsai_python_avatar.png',
  sharp_sheep: 'sharp_sheep_avatar.png',
  sharp_scissors: 'sharp_scissors_avatar.png',
  sharp_ram: 'sharp_ram_avatar.png',
  kenny_avatar: 'kenny_blue_avatar.png',
  kenny_avatar_pink: 'kenny_pink_avatar.png',
  kenny_avatar_green: 'kenny_green_avatar.png',
  kenny_avatar_red: 'kenny_red_avatar.png',
  kenny_avatar_zebra: 'kenny_zebra_avatar.png',
}));
const LEGACY_AVATARS = new Map(Object.entries({
  '🦊': 'maths_avatar_pi',
  '🦉': 'maths_owl',
  '🧪': 'default',
  '🍕': 'avatar_pizza',
  '👽': 'avatar_alien',
  '🐟': 'avatar_frog',
  '🧠': 'avatar_brain',
  '👑': 'avatar_crown',
  '⚗️': 'chem_flask',
  '🤖': 'dsai_bot',
  '🐼': 'dsai_panda',
  '🕷️': 'dsai_spider',
  '🐍': 'dsai_python',
  '🐑': 'sharp_sheep',
  '✂️': 'sharp_scissors',
  '🐏': 'sharp_ram',
  '🦖': 'kenny_avatar',
  zebra_avatar: 'kenny_avatar_zebra',
  kenny_zebra_avatar: 'kenny_avatar_zebra',
}));
const BANNERS={
 gold:['🏆','✦','🥇'],warning:['⚠️','🧪','⚡'],galaxy:['🪐','✨','🌠'],
 molecule:['⚛️','🔬','✦'],flow:['▣','→','▣'],curve:['📈','✦','📊'],
 cloud:['☁️','☁','☀️'],solitaire:['A♠','K♥','Q♦'],
 pink_paradise:['♥','💗','✦'],parallel_pulse:['♯','⚡','✧'],
 maths_curve:['f′(x)','∿','∂'],maths_integral:['∫','dx','∑']
};
const TITLES={
 title_chaos:'Professor Fischer',title_pizza:'Mozzarella-Magister',title_orbit:'Orbit-Gott',
 title_legend:'Labor-Legende',dsai_title_code:'Snippet-Slayer',
 dsai_title_crisp:'CRISP-DM-Guru',dsai_title_weber:'Professorin Weber',
 dsai_title_boss:'Artificial Legend',sharp_title_thread:'Threadstarter',
 sharp_title_lock:'Lockpicker',sharp_title_spermann:'Professor Spermann',
 maths_title_integral:'Integral-Genie',maths_boss_title:'Professor Filipp'
};
const EFFECTS={
 effects:'🎊',effect_coinrain:'🪙',effect_discoin:'🪩',
 neural_spark:'✧',thread_sparks:'⚡',pulse_rings:'◯',
 maths_chalk_fx:'∂',maths_delta_fx:'Δ'
};
const MATHS_PARTICLES={
 maths_chalk_fx:['∂','f′','∫','·','dx','∑'],
 maths_delta_fx:['Δ','∫','Δx','∂','π','∑']
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
   span.textContent=MATHS_PARTICLES[fx]?MATHS_PARTICLES[fx][i%MATHS_PARTICLES[fx].length]:symbol;
   layer.appendChild(span);
  }
 }
 lastFx=fx;
}
function renderAvatar(element, avatar) {
  const file = AVATAR_FILES.get(LEGACY_AVATARS.get(avatar) ?? avatar);
  if (!file) {
    const fallback = /^[a-z0-9_-]+$/i.test(avatar) ? '🧪' : avatar;
    if (element.textContent !== fallback) element.textContent = fallback;
    return;
  }

  const source = new URL(file, AVATAR_ROOT).href;
  if (element.firstElementChild?.src === source) return;
  const image = document.createElement('img');
  image.className = 'studyverse-verse-avatar';
  image.src = source;
  image.alt = 'Avatar';
  element.replaceChildren(image);
}

function applyEquipment(){
 document.body.classList.add('studyverse-cosmetics');
 const profile=readProfile();
 const equip=profile&&profile.equipped&&typeof profile.equipped==='object'?profile.equipped:{};
 for(const slot of SLOTS){
  const value=typeof equip[slot]==='string'&&equip[slot].length>0&&equip[slot].length<80?equip[slot]:DEFAULTS[slot];
  if(document.body.dataset[slot]!==value)document.body.dataset[slot]=value;
 }
 const banner=document.body.dataset.banner||'default';
 const fx=document.body.dataset.fx||'none';
 ensureLayer('verse-atmosphere');
 refreshFx(fx);
 decorateHeroes(banner);
 const avatar=typeof equip.avatar==='string'&&equip.avatar?equip.avatar:null;
 if(avatar){
  for(const sel of ['#levelAvatar','#brandAvatar','#avatar','.profile-link .avatar']){
   document.querySelectorAll(sel).forEach((element) => renderAvatar(element, avatar));
  }
 }
 const title=typeof equip.title==='string'?TITLES[equip.title]:null;
 const topbar=document.querySelector('.topbar');
 if(topbar){
  let tag=topbar.querySelector('.verse-equipped-title');
  if(title){
   if(!tag){tag=document.createElement('span');tag.className='verse-equipped-title';topbar.appendChild(tag)}
   if(tag.textContent!=='🏅 '+title)tag.textContent='🏅 '+title;
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
 window.addEventListener('focus',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
 window.addEventListener('studyverse-equipment-change',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
