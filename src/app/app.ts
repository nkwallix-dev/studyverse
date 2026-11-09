import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SHOP_ITEMS, ShopItem } from './shop-items';
import { TRAINERS, TrainerDef, achievementValue } from './trainer-registry';

type View = 'dashboard' | 'subjects' | 'shop' | 'profile' | 'achievements';
interface Subject { id:string; short:string; name:string; icon:string; group:string; color:string; desc:string; }
interface Activity {label:string;date:string;amount?:number}
interface Profile {
  xp:number; tokens:number; nickname:string; inventory:string[];
  equipped:Record<string,string>; legacyImportedAt?:string;
  chemverseSave?:Record<string,unknown>; claimedLevels:Record<string,boolean>;
  activity:Activity[]; customSubjects?:{id:string;name:string;emoji:string}[];
  trainerSaves?:Record<string,Record<string,unknown>>;
  [key:string]:unknown;
}
const KEY='studyverse_profile_v1', INTRO='studyverse_import_prompt_seen_v1';
const CHEM='chemverse_niklas_v1', BRIDGE='studyverse_trainer_launch_v2';
const defaultEquip=()=>({theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'});
const initial=():Profile=>({xp:0,tokens:0,nickname:'Explorer',inventory:[],equipped:defaultEquip(),claimedLevels:{},activity:[],customSubjects:[]});
const safe=(n:unknown):number=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
const isObj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const validChem=(v:unknown):v is Record<string,unknown>=>isObj(v)&&typeof v['xp']==='number'&&typeof v['coins']==='number'&&['learned','solved','earned','purchased'].every(k=>isObj(v[k]));
const read=(k:string):string|null=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k:string,v:string):void=>{try{localStorage.setItem(k,v)}catch{}};
const parse=(s:string|null):unknown=>{try{return s?JSON.parse(s):null}catch{return null}};
const levelFor=(xp:number)=>1+Math.floor(Math.sqrt(xp/110));
export const SUBJECTS:Subject[]=[
  {id:'bwm',short:'BWM',name:'Betriebswirtschaft',icon:'📊',group:'Wirtschaft',color:'#ffd18d',desc:'Unternehmen, Märkte und wirtschaftliche Entscheidungen.'},
  {id:'ggp',short:'GGP',name:'Geschichte',icon:'🏛️',group:'Gesellschaft',color:'#ffbca9',desc:'Geschichte, Politik und Gesellschaft.'},
  {id:'pos',short:'POS',name:'C# Programmieren',icon:'💻',group:'Informatik',color:'#9dc3ff',desc:'C#, WPF, Algorithmen und Softwareentwicklung.'},
  {id:'dbi',short:'DBI',name:'Datenbanken',icon:'🗄️',group:'Informatik',color:'#88e4eb',desc:'SQL, T-SQL, Datenmodelle und Abfragen.'},
  {id:'nscs',short:'NSCS',name:'Netzwerktechnik',icon:'🌐',group:'Informatik',color:'#a9dcff',desc:'Netzwerke, Routing, Firewall und Security.'},
  {id:'dsai',short:'DSAI',name:'Data Science & AI',icon:'🤖',group:'Informatik',color:'#c5a2ff',desc:'Data Science, künstliche Intelligenz und Machine Learning.'},
  {id:'nawi',short:'NAWI',name:'Chemie',icon:'🧪',group:'Naturwissenschaften',color:'#8bffc7',desc:'Kohlenwasserstoffe, Formeln, Reaktionen und mehr.'},
  {id:'syp',short:'SYP',name:'Systemplanung & Projektentwicklung',icon:'🖥️',group:'Informatik',color:'#8fe9ff',desc:'Systemarchitektur, Cloud, Planung und Projekte.'}
];

@Component({
 selector:'app-root', standalone:true, imports:[CommonModule,FormsModule],
 templateUrl:'./app.html', styleUrl:'./app.scss'
})
export class App implements OnInit,OnDestroy {
 readonly subjects=SUBJECTS;
 readonly items=SHOP_ITEMS;
 view:View='dashboard'; selected:string|null=null; search=''; group='Alle'; shopGroup='Alle';
 intro=!read(INTRO); importOpen=false; info=''; nicknameEdit='';
 achievementSubject='Alle';achievementTest='Alle';
 profile:Profile=this.load(); public today=new Date();
 private onReturn=()=>this.syncChemverse();
 ngOnInit(){this.nicknameEdit=this.profile.nickname;this.syncChemverse();window.addEventListener('pageshow',this.onReturn);}
 ngOnDestroy(){window.removeEventListener('pageshow',this.onReturn);}
 private load():Profile {
   const raw=parse(read(KEY));const fresh=initial();
   if(!isObj(raw))return fresh;
   return {...fresh,...raw,xp:safe(raw['xp']),tokens:safe(raw['tokens']),
    nickname:typeof raw['nickname']==='string'?raw['nickname']:'Explorer',
    inventory:Array.isArray(raw['inventory'])?raw['inventory'].filter(v=>typeof v==='string') as string[]:[],
    claimedLevels:isObj(raw['claimedLevels'])?raw['claimedLevels'] as Record<string,boolean>:{},
    equipped:{...defaultEquip(),...(isObj(raw['equipped'])?raw['equipped']:{} as Record<string,string>)},
    activity:Array.isArray(raw['activity'])?raw['activity'] as Activity[]:[]};
 }
 private save(){write(KEY,JSON.stringify(this.profile));}
 private alert(message:string){this.info=message;}
 get level(){return levelFor(this.profile.xp);}
 get levelBegin(){return (this.level-1)**2*110;}
 get levelEnd(){return this.level**2*110;}
 get levelProgress(){return Math.min(100,Math.round(100*(this.profile.xp-this.levelBegin)/(this.levelEnd-this.levelBegin)));}
 get subjectsAll():Subject[]{
   return [...SUBJECTS,...(this.profile.customSubjects||[]).map(s=>({id:s.id,name:s.name,short:s.name.slice(0,4).toUpperCase(),icon:s.emoji,group:'Andere',color:'#c6a7ff',desc:'Deine eigene Lernwelt.'}))];
 }
 get selectedSubject(){return this.subjectsAll.find(s=>s.id===this.selected);}
 get filteredSubjects(){return this.subjectsAll.filter(s=>(this.group==='Alle'||s.group===this.group)&&
 (s.name+' '+s.short+' '+s.desc).toLowerCase().includes(this.search.toLowerCase().trim()));}
 get filteredItems(){return this.items.filter(i=>(this.shopGroup==='Alle'||i.group===this.shopGroup)).slice().sort((a,b)=>a.level===b.level?a.cost-b.cost:(a.level||1)-(b.level||1));}
 get categories(){return ['Alle','Informatik','Naturwissenschaften','Wirtschaft','Gesellschaft','Andere'];}
 get shopCategories(){return ['Alle','theme','atm','avatar','frame','font','banner','title','fx'];}
 get claimed(){return this.profile.inventory.length;}
 get trainers(){return TRAINERS;}
 get achievementSubjects(){return ['Alle',...new Set(TRAINERS.map(t=>t.subjectId))];}
 get achievementTests(){return TRAINERS.filter(t=>this.achievementSubject==='Alle'||t.subjectId===this.achievementSubject);}
 get achievementGroups(){return this.achievementTests.filter(t=>this.achievementTest==='Alle'||t.id===this.achievementTest).map(t=>({trainer:t,items:t.achievements.map(a=>{const snapshot=this.snapshot(t);const value=achievementValue(a,snapshot);return {...a,value,done:value>=a.target,percent:Math.min(100,Math.round(value/a.target*100))};})}));}
 get achievementTotals(){const gs=this.achievementGroups;return {total:gs.reduce((n,g)=>n+g.items.length,0),done:gs.reduce((n,g)=>n+g.items.filter(a=>a.done).length,0)};}
 getTrainerForSubject(id:string){return TRAINERS.filter(t=>t.subjectId===id);}
 private snapshot(t:TrainerDef):Record<string,unknown>{const local=parse(read(t.saveKey));if(isObj(local))return local;const saved=this.profile.trainerSaves?.[t.id];if(isObj(saved))return saved;if(t.id==='nawi-test-01'&&isObj(this.profile.chemverseSave))return this.profile.chemverseSave;return {};}
 setAchievementSubject(id:string){this.achievementSubject=id;this.achievementTest='Alle';}
 get title(){return this.items.find(i=>i.id===this.profile.equipped['title'])?.name || 'Weltenentdecker';}
 get currentTheme(){return this.profile.equipped['theme'] || 'base';}
 get currentAvatar(){return this.profile.equipped['avatar'] || '🧪';}
 go(page:View){if(page==='achievements')this.syncTrainer();this.view=page;this.selected=null;window.scrollTo({top:0,behavior:'smooth'});}
 choose(id:string){this.selected=id;this.view='subjects';window.scrollTo({top:0,behavior:'smooth'});}
 startImport(){this.intro=false;this.importOpen=true;write(INTRO,'1');}
 skipIntro(){this.intro=false;write(INTRO,'1');}
 get canImport(){return !this.profile.legacyImportedAt;}
 importBrowser(){this.applyImport(parse(read(CHEM)));}
 async importFile(event:Event){
   const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;
   if(file.size>2_000_000){this.alert('Datei zu groß (max. 2 MB).');return;}
   try{this.applyImport(JSON.parse(await file.text()));}catch{this.alert('Das ist keine gültige CHEMVERSE-JSON-Datei.');}
   input.value='';
 }
 private applyImport(data:unknown){
   if(!this.canImport){this.alert('CHEMVERSE wurde bereits einmal importiert.');return;}
   if(!validChem(data)){this.alert('Ungültiger CHEMVERSE-Export: XP, Coins oder Fortschrittsdaten fehlen.');return;}
   const purchased=data['purchased'] as Record<string,unknown>;
   this.profile.xp+=safe(data['xp']);this.profile.tokens+=safe(data['coins']);
   this.profile.inventory=[...new Set([...this.profile.inventory,...Object.keys(purchased).filter(k=>!!purchased[k])])];
   if(isObj(data['claimedLevels']))this.profile.claimedLevels={...this.profile.claimedLevels,...data['claimedLevels'] as Record<string,boolean>};
   const loadout=isObj(data['loadout'])?data['loadout']:{};
   this.profile.equipped={...this.profile.equipped,...loadout as Record<string,string>};
   if(typeof data['theme']==='string')this.profile.equipped['theme']=data['theme'];
   this.profile.legacyImportedAt=new Date().toISOString();
   this.profile.chemverseSave=data;
   this.profile.trainerSaves={...(this.profile.trainerSaves||{}),'nawi-test-01':data};
   this.profile.activity=[{label:'CHEMVERSE importiert',date:new Date().toISOString(),amount:safe(data['xp'])},...this.profile.activity].slice(0,30);
   this.awardGlobalLevelRewards();this.awardLevelFreebies();this.save();write(CHEM,JSON.stringify(data));
   this.importOpen=false;this.intro=false;write(INTRO,'1');
   this.alert('CHEMVERSE übertragen! XP, Tokens und Items sind angekommen. 🎉');
 }
 private awardGlobalLevelRewards():number {
   let total=0;
   for(let lvl=2;lvl<=this.level;lvl++){
     const k=String(lvl);
     if(this.profile.claimedLevels[k])continue;
     this.profile.claimedLevels[k]=true;
     const bonus=60+(lvl-1)*60;
     this.profile.tokens+=bonus;
     total+=bonus;
     this.profile.activity=[{label:'Level '+lvl+' erreicht · Token-Bonus',date:new Date().toISOString(),amount:bonus},...this.profile.activity].slice(0,30);
   }
   return total;
 }
 private awardLevelFreebies(){
   const free=this.items.filter(i=>i.cost===0&&(i.level||1)<=this.level);
   this.profile.inventory=[...new Set([...this.profile.inventory,...free.map(i=>i.id)])];
 }
 owns(item:ShopItem){return this.profile.inventory.includes(item.id);}
 active(item:ShopItem){
   const key=item.group;const value=key==='avatar'?item.icon:(item.equip||item.id);
   return this.profile.equipped[key]===value;
 }
 priceLabel(item:ShopItem){
   if(this.owns(item))return this.active(item)?'Aktiv ✓':'Ausrüsten';
   if(this.level<(item.level||1))return 'Ab Level '+item.level;
   return item.cost===0?'Abholen':item.cost+' Tokens';
 }
 buyOrEquip(item:ShopItem){
   if(!this.owns(item)){
     if(this.level<(item.level||1)){this.alert('Freischaltung erst ab Level '+item.level+'.');return;}
     if(this.profile.tokens<item.cost){this.alert('Nicht genug Tokens, Bruder. 💀');return;}
     this.profile.tokens-=item.cost;this.profile.inventory=[...this.profile.inventory,item.id];
     this.profile.activity=[{label:item.name+' gekauft',date:new Date().toISOString(),amount:-item.cost},...this.profile.activity].slice(0,30);
     this.alert(item.icon+' '+item.name+' gekauft! Jetzt kannst du es ausrüsten.');
   }else{
     const key=item.group,value=key==='avatar'?item.icon:(item.equip||item.id);
     this.profile.equipped[key]=this.active(item)?this.equipDefault(key):value;
     this.alert(item.name+' – Ausrüstung geändert.');
   }
   this.save();
 }
 private equipDefault(k:string){return defaultEquip()[k as keyof ReturnType<typeof defaultEquip>] || 'none';}
 themeStyle(item:ShopItem){return item.bg || 'linear-gradient(130deg,#212a47,#504193)';}
 addSubject(){
   const name=prompt('Wie heißt das neue Fach?')?.trim();
   if(!name||name.length>40)return;
   if(this.subjectsAll.some(s=>s.name.toLowerCase()===name.toLowerCase())){this.alert('Dieses Fach gibt es schon.');return;}
   const custom=this.profile.customSubjects||[];
   const id='custom-'+Date.now();
   this.profile.customSubjects=[...custom,{id,name,emoji:'📚'}];
   this.save();this.choose(id);
 }
 saveNickname(){
   const name=this.nicknameEdit.trim();
   if(name.length<1||name.length>24){this.alert('Der Name muss 1 bis 24 Zeichen haben.');return;}
   this.profile.nickname=name;this.save();this.alert('Profil aktualisiert.');
 }
 exportProfile(){
   const blob=new Blob([JSON.stringify(this.profile,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);const link=document.createElement('a');
   link.href=url;link.download='studyverse-backup.json';link.click();
   URL.revokeObjectURL(url);
 }
 openChemverse(){this.openTrainer('nawi-test-01');}
 openTrainer(id:string){
   const trainer=TRAINERS.find(t=>t.id===id);if(!trainer){this.alert('Diese Lernwelt ist noch nicht verfügbar.');return;}
   const oldRaw=parse(read(trainer.saveKey));
   const old:Record<string,unknown>=isObj(oldRaw)?{...oldRaw}:isObj(this.profile.trainerSaves?.[id])?{...this.profile.trainerSaves![id]}:id==='nawi-test-01'&&validChem(this.profile.chemverseSave)?{...this.profile.chemverseSave}:{xp:0,coins:0,purchased:{},earned:{},solved:{},learned:{}};
   const purchased=isObj(old['purchased'])?old['purchased']:{};
   for(const item of this.profile.inventory)purchased[item]=true;
   old['purchased']=purchased;old['coins']=this.profile.tokens;old['theme']=this.currentTheme;
   old['loadout']={...(isObj(old['loadout'])?old['loadout']:{}),...this.profile.equipped};
   write(trainer.saveKey,JSON.stringify(old));
   write(BRIDGE,JSON.stringify({id:trainer.id,saveKey:trainer.saveKey,xp:safe(old['xp'])}));
   window.location.assign(new URL(trainer.path,document.baseURI).href);
 }
 private syncChemverse(){this.syncTrainer();}
 private syncTrainer(){
   const launch=parse(read(BRIDGE));if(!isObj(launch))return;
   const trainer=TRAINERS.find(t=>t.id===launch['id']);if(!trainer||launch['saveKey']!==trainer.saveKey)return;
   const state=parse(read(trainer.saveKey));
   if(!isObj(state)||typeof state['xp']!=='number'||typeof state['coins']!=='number')return;
   const gained=Math.max(0,safe(state['xp'])-safe(launch['xp']));
   this.profile.xp+=gained;this.profile.tokens=safe(state['coins']);
   const purchased=isObj(state['purchased'])?state['purchased']:{};
   this.profile.inventory=[...new Set([...this.profile.inventory,...Object.entries(purchased).filter(([,v])=>!!v).map(([k])=>k)])];
   this.profile.trainerSaves={...(this.profile.trainerSaves||{}),[trainer.id]:state};
   if(trainer.id==='nawi-test-01')this.profile.chemverseSave=state;
   const levelBonus=this.awardGlobalLevelRewards();
   this.awardLevelFreebies();
   if(gained)this.profile.activity=[{label:trainer.title+' · Lernrunde',date:new Date().toISOString(),amount:gained},...this.profile.activity].slice(0,30);
   this.save();try{localStorage.removeItem(BRIDGE)}catch{}
   if(gained||levelBonus)this.alert('Willkommen zurück! '+(gained?'+'+gained+' XP ':'')+(levelBonus?'· +'+levelBonus+' Level-Tokens':'')+' synchronisiert.');
 }
}