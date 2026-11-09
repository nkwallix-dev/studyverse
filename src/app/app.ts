import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SHOP_ITEMS, ShopItem } from './shop-items';

type View = 'dashboard' | 'subjects' | 'shop' | 'profile';
interface Subject { id:string; short:string; name:string; icon:string; group:string; color:string; desc:string; }
interface Activity {label:string;date:string;amount?:number}
interface Profile {
  xp:number; tokens:number; nickname:string; inventory:string[];
  equipped:Record<string,string>; legacyImportedAt?:string;
  chemverseSave?:Record<string,unknown>; claimedLevels:Record<string,boolean>;
  activity:Activity[]; customSubjects?:{id:string;name:string;emoji:string}[];
  [key:string]:unknown;
}
const KEY='studyverse_profile_v1', INTRO='studyverse_import_prompt_seen_v1';
const CHEM='chemverse_niklas_v1', BRIDGE='studyverse_chemverse_launch_v1';
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
  {id:'nawi',short:'NAWI',name:'Naturwissenschaften',icon:'🧪',group:'MINT',color:'#8bffc7',desc:'Chemie, Natur und die Regeln des Universums.'},
  {id:'dsai',short:'DSAI',name:'Data Science & AI',icon:'🤖',group:'Informatik',color:'#bca3ff',desc:'Daten, KI und intelligente Systeme.'},
  {id:'syp',short:'SYP',name:'Systemplanung',icon:'🖥️',group:'Informatik',color:'#8fe9ff',desc:'Cloud, Architektur und Informationssysteme.'},
  {id:'pos',short:'POS',name:'Programmieren',icon:'💻',group:'Informatik',color:'#a4c3ff',desc:'Code, Algorithmen und Anwendungen.'},
  {id:'math',short:'MAT',name:'Mathematik',icon:'📐',group:'MINT',color:'#ffc28d',desc:'Zahlen, Funktionen und Formeln.'},
  {id:'physics',short:'PHY',name:'Physik',icon:'⚡',group:'MINT',color:'#ffe18a',desc:'Kräfte, Energie und Bewegung.'},
  {id:'bio',short:'BIO',name:'Biologie',icon:'🧬',group:'MINT',color:'#a8ffbc',desc:'Zellen, Körper und Leben.'},
  {id:'german',short:'DE',name:'Deutsch',icon:'📚',group:'Sprachen',color:'#ffc7b0',desc:'Texte, Sprache und Literatur.'},
  {id:'english',short:'EN',name:'Englisch',icon:'🌍',group:'Sprachen',color:'#94c6ff',desc:'Grammar, vocabulary and writing.'},
  {id:'spanish',short:'ES',name:'Spanisch',icon:'💃',group:'Sprachen',color:'#ffa7a0',desc:'Grammatik und neue Wörter.'},
  {id:'french',short:'FR',name:'Französisch',icon:'🥐',group:'Sprachen',color:'#d4a9ff',desc:'Langue, vocabulaire et grammaire.'},
  {id:'history',short:'GSK',name:'Geschichte',icon:'🏛️',group:'Gesellschaft',color:'#ffda9b',desc:'Epochen und Ereignisse.'},
  {id:'geography',short:'GEO',name:'Geografie',icon:'🌎',group:'Gesellschaft',color:'#9debcf',desc:'Erde, Umwelt und Wirtschaft.'},
  {id:'economics',short:'BWL',name:'Wirtschaft',icon:'📊',group:'Wirtschaft',color:'#a6efc7',desc:'Wirtschaftliche Zusammenhänge.'},
  {id:'accounting',short:'RW',name:'Rechnungswesen',icon:'💰',group:'Wirtschaft',color:'#ffe18c',desc:'Buchhaltung und Bilanzen.'},
  {id:'network',short:'NWT',name:'Netzwerktechnik',icon:'🌐',group:'Informatik',color:'#9adbff',desc:'Netzwerke, Firewalls und Ports.'},
  {id:'electric',short:'ELT',name:'Elektrotechnik',icon:'🔌',group:'MINT',color:'#ffc488',desc:'Elektrische Systeme und Schaltungen.'},
  {id:'ethics',short:'ETH',name:'Ethik & Religion',icon:'🕊️',group:'Gesellschaft',color:'#d8bfff',desc:'Werte und Verantwortung.'},
  {id:'sports',short:'BSP',name:'Sport',icon:'🏃',group:'Andere',color:'#cbfa9a',desc:'Bewegung und Training.'},
  {id:'informatics',short:'INF',name:'Informatik',icon:'🧠',group:'Informatik',color:'#b9afff',desc:'Computer und digitale Welt.'}
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
 get categories(){return ['Alle','MINT','Informatik','Sprachen','Gesellschaft','Wirtschaft','Andere'];}
 get shopCategories(){return ['Alle','theme','atm','avatar','frame','font','banner','title','fx'];}
 get claimed(){return this.profile.inventory.length;}
 get title(){return this.items.find(i=>i.id===this.profile.equipped['title'])?.name || 'Weltenentdecker';}
 get currentTheme(){return this.profile.equipped['theme'] || 'base';}
 get currentAvatar(){return this.profile.equipped['avatar'] || '🧪';}
 go(page:View){this.view=page;this.selected=null;window.scrollTo({top:0,behavior:'smooth'});}
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
   this.profile.activity=[{label:'CHEMVERSE importiert',date:new Date().toISOString(),amount:safe(data['xp'])},...this.profile.activity].slice(0,30);
   this.awardLevelFreebies();this.save();write(CHEM,JSON.stringify(data));
   this.importOpen=false;this.intro=false;write(INTRO,'1');
   this.alert('CHEMVERSE übertragen! XP, Tokens und Items sind angekommen. 🎉');
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
 openChemverse(){
   const oldRaw=parse(read(CHEM));
   const old:Record<string,unknown>=validChem(oldRaw)?oldRaw:validChem(this.profile.chemverseSave)?{...this.profile.chemverseSave}:{xp:0,coins:0,purchased:{},earned:{},solved:{},learned:{}};
   const purchased=isObj(old['purchased'])?old['purchased']:{};
   for(const id of this.profile.inventory)purchased[id]=true;
   old['purchased']=purchased;old['coins']=this.profile.tokens;old['theme']=this.currentTheme;
   old['loadout']={...(isObj(old['loadout'])?old['loadout']:{}),...this.profile.equipped};
   write(CHEM,JSON.stringify(old));
   write(BRIDGE,JSON.stringify({xp:safe(old['xp'])}));
   window.location.assign(new URL('nawi/test-01/index.html',document.baseURI).href);
 }
 private syncChemverse(){
   const launch=parse(read(BRIDGE));const state=parse(read(CHEM));
   if(!isObj(launch)||!validChem(state))return;
   const gained=Math.max(0,safe(state['xp'])-safe(launch['xp']));
   this.profile.xp+=gained;this.profile.tokens=safe(state['coins']);
   this.profile.inventory=[...new Set([...this.profile.inventory,...Object.entries(state['purchased'] as Record<string,unknown>).filter(([,v])=>!!v).map(([k])=>k)])];
   this.profile.chemverseSave=state;
   this.awardLevelFreebies();
   if(gained)this.profile.activity=[{label:'CHEMVERSE-Runde',date:new Date().toISOString(),amount:gained},...this.profile.activity].slice(0,30);
   this.save();try{localStorage.removeItem(BRIDGE)}catch{}
   if(gained)this.alert('Willkommen zurück! +'+gained+' XP synchronisiert.');
 }
}