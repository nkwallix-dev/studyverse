import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SHOP_ITEMS, SHOP_DROPS, ShopItem, ShopRequirement } from './shop-items';
import { LEGACY_OWNED_ITEMS } from './legacy-owned-items';
import { TRAINERS, TrainerDef, achievementValue } from './trainer-registry';
import { StudyverseCloud, CloudSnapshot, PublicPlayer, AccountNotice, CLOUD_DAILY_KEY, cloudError, isAllowedNickname } from './cloud';

type View = 'dashboard' | 'subjects' | 'shop' | 'profile' | 'achievements' | 'friends';
interface Subject { id:string; short:string; name:string; icon:string; group:string; color:string; desc:string; }
interface Activity {label:string;date:string;amount?:number}
interface Profile {
  xp:number; tokens:number; nickname:string; inventory:string[];
  equipped:Record<string,string>; legacyImportedAt?:string;
  chemverseSave?:Record<string,unknown>; claimedLevels:Record<string,boolean>;
  activity:Activity[]; customSubjects?:{id:string;name:string;emoji:string}[];
  trainerSaves?:Record<string,Record<string,unknown>>; shopDropMigrationV1?:boolean; achievementTokenClaims?:Record<string,boolean>;
 rewardSeen?:Record<string,boolean>; rewardQueue?:string[];
  [key:string]:unknown;
}
const KEY='studyverse_profile_v1', INTRO='studyverse_import_prompt_seen_v1';
const CHEM='chemverse_niklas_v1', BRIDGE='studyverse_trainer_launch_v2', RESTORE='studyverse_before_restore_v1', LOCAL_ARCHIVE='studyverse_before_first_cloud_login_v1';
const defaultEquip=()=>({theme:'base',atm:'none',frame:'none',avatar:'🧪',font:'standard',banner:'default',title:'',fx:'none'});
const initial=():Profile=>({xp:0,tokens:0,nickname:'Explorer',inventory:[],equipped:defaultEquip(),claimedLevels:{},activity:[],customSubjects:[],shopDropMigrationV1:true});
const safe=(n:unknown):number=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
const isObj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const validChem=(v:unknown):v is Record<string,unknown>=>isObj(v)&&typeof v['xp']==='number'&&typeof v['coins']==='number'&&['learned','solved','earned','purchased'].every(k=>isObj(v[k]));
// Backups exported from STUDYVERSE use "tokens" and "inventory", not CHEMVERSE's "coins" and "purchased".
const validStudyverse=(v:unknown):v is Record<string,unknown>=>isObj(v)
 && typeof v['xp']==='number'&&Number.isFinite(v['xp'])&&v['xp']>=0
 && typeof v['tokens']==='number'&&Number.isFinite(v['tokens'])&&v['tokens']>=0
 && typeof v['nickname']==='string'&&v['nickname'].trim().length>0
 && Array.isArray(v['inventory'])&&v['inventory'].every(x=>typeof x==='string')
 && isObj(v['equipped']);
const read=(k:string):string|null=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k:string,v:string):void=>{try{localStorage.setItem(k,v)}catch{}};
const parse=(s:string|null):unknown=>{try{return s?JSON.parse(s):null}catch{return null}};
const levelFor=(xp:number)=>1+Math.floor(Math.sqrt(xp/110));
export const SUBJECTS:Subject[]=[
  {id:'bwm',short:'BWM',name:'Betriebswirtschaft',icon:'📊',group:'Wirtschaft',color:'#ffd18d',desc:'Unternehmen, Märkte und wirtschaftliche Entscheidungen.'},
  {id:'ggp',short:'GGP',name:'Geschichte',icon:'🏛️',group:'Gesellschaft',color:'#ffbca9',desc:'Geschichte, Politik und Gesellschaft.'},
  {id:'pos',short:'POS',name:'C# Programmieren',icon:'💻',group:'Informatik',color:'#9dc3ff',desc:'C#, WPF, Algorithmen und Softwareentwicklung.'},
  {id:'mat',short:'AM',name:'Mathematik',icon:'🧮',group:'Naturwissenschaften',color:'#d7abff',desc:'Neue Mathematik-Schularbeit in Vorbereitung · Inhalte folgen in Kürze.'},
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
 private readonly changeDetector=inject(ChangeDetectorRef);
 readonly subjects=SUBJECTS;
 readonly items=SHOP_ITEMS;
 view:View='dashboard'; selected:string|null=null; search=''; group='Alle'; shopGroup='Alle';
 shopDrop='global'; spotlightRewardId=''; rewardPopupSuppressed=false; shopTab:'catalog'|'inventory'|'earn'='catalog'; inventoryDrop='Alle'; inventoryGroup='Alle'; inventorySearch=''; previewed:ShopItem|null=null; avatarPickerOpen=false;
 intro=!read(INTRO); importOpen=false; info=''; nicknameEdit='';
 readonly cloud=new StudyverseCloud();
 cloudReady=false; cloudConfigured=false; cloudBusy=false; cloudHydrating=false; cloudMaySave=false;
 cloudMode:'register'|'login'='register'; cloudUsername=''; cloudPin=''; cloudMessage=''; cloudStage='';
 cloudStatus='Lokal'; private cloudTimer:ReturnType<typeof setTimeout>|null=null;
 publicPlayers:PublicPlayer[]=[]; friendsLoading=false; friendsError=''; 
 private cloudWrites:Promise<void>=Promise.resolve();
 private friendSync:Promise<void>=Promise.resolve();
 private friendProfileStamp='';
 // An admin-issued notice is tied to Firebase UID, not an editable nickname.
 moderationNotice:AccountNotice|null=null;
 noticePreview=false;noticeSaving=false;noticeError='';
 private noticeCheckId=0;
 achievementSubject='Alle';achievementTest='Alle';achievementSort:'open'|'done'|'progress'|'reward'|'title'='open';
 profile:Profile=this.load(); public today=new Date();
 private onReturn=()=>{this.rewardPopupSuppressed=false;this.syncChemverse();this.grantAchievementTokens();this.checkRewardUnlocks();this.queueCloudSave();};
 ngOnInit(){
   this.nicknameEdit=this.profile.nickname;
   // Standalone Verses link to the shared player profile; resolve the hash
   // without changing the single-page app's existing navigation model.
   if(window.location.hash==='#profile'){
     this.view='profile';
     window.history.replaceState(null,'',window.location.pathname+window.location.search);
   }
   this.syncChemverse();
  this.checkRewardUnlocks();
  const bonus=this.grantAchievementTokens();
   if(bonus)this.alert('🏆 Deine bereits erreichten Achievements bringen dir rückwirkend +'+bonus+' TT!');
   window.addEventListener('pageshow',this.onReturn);
   void this.startCloud();
 }
 ngOnDestroy(){window.removeEventListener('pageshow',this.onReturn);}
 private load():Profile {
   const raw=parse(read(KEY));const fresh=initial();
   if(!isObj(raw))return fresh;
   const restored:Profile={...fresh,...raw,xp:safe(raw['xp']),tokens:safe(raw['tokens']),
    nickname:typeof raw['nickname']==='string'?raw['nickname']:'Explorer',
    inventory:Array.isArray(raw['inventory'])?raw['inventory'].filter(v=>typeof v==='string') as string[]:[],
    claimedLevels:isObj(raw['claimedLevels'])?raw['claimedLevels'] as Record<string,boolean>:{},
    equipped:{...defaultEquip(),...(isObj(raw['equipped'])?raw['equipped']:{} as Record<string,string>)},
    activity:Array.isArray(raw['activity'])?raw['activity'] as Activity[]:[]};
   // Existing Froschlabor purchases retain avatar_frog; update only the currently equipped emoji.
   if(restored.equipped['avatar']==='🐸'){
     restored.equipped['avatar']='🐟';
     write(KEY,JSON.stringify(restored));
   }
   // Preserve explicitly owned cosmetics while applying only legacy free rewards that do not bypass new boss achievements.
   if(raw['shopDropMigrationV1']!==true){
     const oldLevel=levelFor(restored.xp);
     const previousRewards=[{id:'avatar_atom',level:2},{id:'ionstorm',level:3},{id:'blueprint',level:4},{id:'legend',level:5}];
     restored.inventory=[...new Set([...restored.inventory,...previousRewards.filter(x=>oldLevel>=x.level).map(x=>x.id)])];
     restored.shopDropMigrationV1=true;
     write(KEY,JSON.stringify(restored));
   }
   return restored;
 }
 private save(){write(KEY,JSON.stringify(this.profile));this.queueCloudSave();void this.publishFriendCard();}
 private alert(message:string){this.info=message;}

 private async checkOwnAccountNotice():Promise<void>{
   const uid=this.cloud.session?.uid;
   if(!uid||!this.cloudMaySave)return;
   const check=++this.noticeCheckId;
   // Preview works immediately even before the new Firestore rules are live.
   if(new URLSearchParams(window.location.search).get('warningPreview')==='1'&&
      read('studyverse_fairplay_preview_seen_'+uid)!=='1'){
     this.moderationNotice=null;this.noticePreview=true;this.noticeError='';
     this.changeDetector.markForCheck();return;
   }
   try{
     const notice=await this.cloud.readAccountNotice();
     if(this.cloud.session?.uid!==uid||check!==this.noticeCheckId)return;
     const seen=notice?await this.cloud.noticeAcknowledged(notice.id):false;
     if(this.cloud.session?.uid!==uid||check!==this.noticeCheckId)return;
     if(notice&&!seen){
       this.moderationNotice=notice;this.noticePreview=false;this.noticeError='';
     }
   }catch(error){
     // Failing to load the optional moderation UI must not corrupt a save.
     this.noticeError=cloudError(error);
   }finally{this.changeDetector.markForCheck();}
 }
 async acknowledgeAccountNotice():Promise<void>{
   if(this.noticeSaving)return;
   if(this.noticePreview){
     const uid=this.cloud.session?.uid;
     if(uid)write('studyverse_fairplay_preview_seen_'+uid,'1');
     this.noticePreview=false;this.noticeError='';
     this.changeDetector.markForCheck();return;
   }
   if(!this.moderationNotice||!this.cloud.session)return;
   this.noticeSaving=true;this.noticeError='';
   const uid=this.cloud.session.uid,noticeId=this.moderationNotice.id;
   try{
     await this.cloud.acknowledgeNotice(noticeId);
     if(this.cloud.session?.uid===uid&&this.moderationNotice?.id===noticeId)
       this.moderationNotice=null;
   }catch(error){
     this.noticeError='Konnte deine Bestätigung nicht speichern: '+cloudError(error)+'. Bitte erneut versuchen.';
   }finally{this.noticeSaving=false;this.changeDetector.markForCheck();}
 }
 get cloudUser(){return this.cloud.session?.username||'';}
 // Friends directory contains only nickname, avatar and a vanity title.
 // Published numeric scores are excluded: local XP/TT stay unverified.
 private publishFriendCard(rename=false):Promise<void>{
   if(!this.cloudReady||!this.cloudConfigured||!this.cloud.session||
      !this.cloudMaySave||this.cloudHydrating)return Promise.resolve();
   const uid=this.cloud.session.uid;
   const nickname=this.profile.nickname,avatar=this.currentAvatar,title=this.title;
   if(!isAllowedNickname(nickname))return Promise.resolve();
   const stamp=uid+'|'+nickname+'|'+avatar+'|'+title;
   if(!rename&&stamp===this.friendProfileStamp)return this.friendSync;
   this.friendSync=this.friendSync.catch(()=>{}).then(async()=>{
     if(this.cloud.session?.uid!==uid||!this.cloudMaySave)return;
     await this.cloud.publishFriendProfile(nickname,avatar,title,rename);
     this.friendProfileStamp=stamp;
   }).catch(error=>{
     // Directory errors must never prevent saving personal learning progress.
     if(this.view==='friends'){
       this.friendsError='Öffentliches Profil konnte nicht synchronisiert werden: '+cloudError(error);
       this.changeDetector.markForCheck();
     }
   });
   return this.friendSync;
 }
 async refreshFriends():Promise<void>{
   const uid=this.cloud.session?.uid;
   if(!uid||!this.cloudConfigured){
     this.publicPlayers=[];this.friendsLoading=false;
     this.friendsError='Melde dich mit deinem Studyverse-Cloudkonto an, um alle Spieler zu sehen.';
     this.changeDetector.markForCheck();return;
   }
   this.friendsLoading=true;this.friendsError='';
   this.changeDetector.markForCheck();
   try{
     await this.publishFriendCard();
     const entries=await this.cloud.listPublicProfiles();
     if(this.cloud.session?.uid===uid){this.publicPlayers=entries;this.friendsError='';}
   }catch(error){
     if(this.cloud.session?.uid===uid){
       this.publicPlayers=[];
       const explanation=cloudError(error);
       this.friendsError=/PERMISSION_DENIED|403|Berechtigung|blockiert|permissions/i.test(String(error)+' '+explanation)
         ?'Die öffentliche Spielerliste ist noch nicht in den Firestore-Sicherheitsregeln freigeschaltet. Private Spielstände bleiben geschützt.'
         :explanation;
     }
   }finally{this.friendsLoading=false;this.changeDetector.markForCheck();}
 }
 isOwnPlayer(player:PublicPlayer):boolean{return player.uid===this.cloud.session?.uid;}

 private cloudSnapshot():CloudSnapshot{
   const trainers:Record<string,Record<string,unknown>>={...(this.profile.trainerSaves||{})};
   for(const trainer of TRAINERS){
     const local=parse(read(trainer.saveKey));
     if(isObj(local))trainers[trainer.id]=local;
   }
   const snapshot:CloudSnapshot={version:1,profile:{...this.profile,trainerSaves:trainers},trainers};
   const daily=parse(read(CLOUD_DAILY_KEY));
   if(daily!==null)snapshot.daily=daily;
   const bridge=parse(read(BRIDGE));
   if(isObj(bridge))snapshot.bridge=bridge;
   return snapshot;
 }
 private useCloudSnapshot(snapshot:CloudSnapshot){
   if(!validStudyverse(snapshot.profile))throw Error('Ungültiger Cloud-Spielstand. Der lokale Stand bleibt erhalten.');
   const previous=this.currentBackupSnapshot();
   try{
     write(RESTORE,JSON.stringify(previous));
     write(KEY,JSON.stringify(snapshot.profile));
     for(const trainer of TRAINERS){
       const saved=snapshot.trainers[trainer.id];
       if(isObj(saved))write(trainer.saveKey,JSON.stringify(saved));
       else localStorage.removeItem(trainer.saveKey);
     }
     if(snapshot.daily!==undefined)write(CLOUD_DAILY_KEY,JSON.stringify(snapshot.daily));
     else localStorage.removeItem(CLOUD_DAILY_KEY);
     if(isObj(snapshot.bridge))write(BRIDGE,JSON.stringify(snapshot.bridge));
     else localStorage.removeItem(BRIDGE);
     write(INTRO,'1');
   }catch(e){
     this.writeBackupSnapshot(previous);
     throw e;
   }
   this.profile=this.load();this.nicknameEdit=this.profile.nickname;
  this.checkRewardUnlocks();
  this.intro=false;this.importOpen=false;
   this.syncTrainer();
 }
 private queueCloudSave(){
   if(!this.cloudReady||!this.cloud.session||this.cloudHydrating||!this.cloudMaySave)return;
   if(this.cloudTimer!==null)clearTimeout(this.cloudTimer);
   this.cloudStatus='Ungespeicherte Änderungen';
   this.cloudTimer=setTimeout(()=>{this.cloudTimer=null;void this.syncCloudNow();},1000);
 }
 async syncCloudNow():Promise<void>{
   if(!this.cloud.session||this.cloudHydrating||!this.cloudMaySave){
     if(this.cloud.session&&!this.cloudMaySave)this.cloudMessage='Cloud-Stand nicht geladen. Bitte die Seite neu öffnen, bevor du synchronisierst.';
     return;
   }
   if(this.cloudTimer!==null){clearTimeout(this.cloudTimer);this.cloudTimer=null;}
   const uid=this.cloud.session.uid;
   const snapshot=this.cloudSnapshot();
   this.cloudWrites=this.cloudWrites.catch(()=>{}).then(async()=>{
     if(this.cloud.session?.uid!==uid)return;
     await this.cloud.save(snapshot);
     this.cloudStatus='✓ Online gespeichert';
     this.changeDetector.markForCheck();
   }).catch(error=>{
     this.cloudStatus='⚠ Speichern fehlgeschlagen';
     this.cloudMessage=cloudError(error);
     this.changeDetector.markForCheck();
   });
   await this.cloudWrites;
 }
 private async startCloud(){
   try{
     await this.cloud.initialize();
     this.cloudConfigured=this.cloud.configured;
     if(this.cloud.session){
       this.cloudHydrating=true;
       const remote=await this.cloud.load();
       if(remote)this.useCloudSnapshot(remote);
       if(this.profile.nickname==='Explorer'&&this.cloud.session?.username){
         this.profile.nickname=this.cloud.session.username;
         this.nicknameEdit=this.profile.nickname;
         write(KEY,JSON.stringify(this.profile));
       }
       this.cloudMaySave=true;
       this.cloudHydrating=false;
     }
   }catch(e){
     this.cloudMessage=cloudError(e);this.cloudStatus='⚠ Cloud-Laden fehlgeschlagen';
     this.cloudMaySave=false;this.cloudHydrating=false;
     if(this.cloud.session)this.cloudMode='login';
   }finally{
     this.cloudConfigured=this.cloud.configured;this.cloudReady=true;
     if(this.cloud.session&&this.cloudMaySave){
       void this.checkOwnAccountNotice();
       void this.publishFriendCard();
       this.queueCloudSave();
     }
     this.changeDetector.markForCheck();
   }
 }
 private freshCloudAccount(){
   // Client-editable browser progress is never a valid initial cloud balance.
   const existing=this.currentBackupSnapshot();
   const hasLocal=this.profile.xp>0||this.profile.tokens>0||this.profile.inventory.length>0
     ||TRAINERS.some(t=>isObj(parse(read(t.saveKey))));
   if(hasLocal)
     write(LOCAL_ARCHIVE,JSON.stringify({savedAt:new Date().toISOString(),profile:existing.profile,trainers:existing.trainers}));
   this.clearDeviceProgress();
   this.profile=initial();
   if(this.cloud.session?.username)this.profile.nickname=this.cloud.session.username;
   this.nicknameEdit=this.profile.nickname;
   write(KEY,JSON.stringify(this.profile));
   this.intro=false;write(INTRO,'1');
 }
 get hasLocalArchive(){return isObj(parse(read(LOCAL_ARCHIVE)));}
 exportLocalArchive(){
   const backup=read(LOCAL_ARCHIVE);
   if(!backup){this.alert('Kein früherer lokaler Spielstand archiviert.');return;}
   const blob=new Blob([backup],{type:'application/json'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='studyverse-alter-lokaler-spielstand.json';link.click();
   URL.revokeObjectURL(url);
 }
 async submitCloudAccount(){
   if(this.cloudBusy)return;
   const registering=this.cloudMode==='register';
   const offlineProgress=this.profile.xp>0||this.profile.tokens>0||this.profile.inventory.length>0
     ||TRAINERS.some(t=>isObj(parse(read(t.saveKey))));
   if(registering&&offlineProgress&&!window.confirm(
      'Sicherheitsupdate: Neue Cloud-Accounts starten mit 0 XP und 0 TastyTokens. Dein bisheriger lokaler Stand wird als Offline-Archiv gesichert, aber nicht hochgeladen. Möchtest du fortfahren?'
   ))return;
   this.cloudBusy=true;this.cloudMessage='';this.cloudHydrating=true;this.cloudMaySave=false;
   let authenticated=false;
   try{
     if(registering){
       this.cloudStage='Account wird erstellt …';
       await this.cloud.register(this.cloudUsername,this.cloudPin);
       authenticated=true;
       this.cloudStage='Spielstand wird online gespeichert …';
       this.changeDetector.markForCheck();
       // A new online account must not inherit altered localStorage/JSON values.
       this.freshCloudAccount();
       await this.cloud.save(this.cloudSnapshot());
     }else{
       this.cloudStage='Anmeldedaten werden geprüft …';
       await this.cloud.login(this.cloudUsername,this.cloudPin);
       authenticated=true;
       this.cloudStage='Cloud-Spielstand wird geladen …';
       this.changeDetector.markForCheck();
       const remote=await this.cloud.load();
       if(remote)this.useCloudSnapshot(remote);
       else {
         // Existing credentials without a saved server profile are also new;
         // never seed them from an editable offline snapshot.
         this.freshCloudAccount();
         this.alert('🔒 Neues Cloud-Profil startet mit 0 XP/TT. Der vorherige Browser-Spielstand wurde nur lokal archiviert.');
         await this.cloud.save(this.cloudSnapshot());
       }
     }
     if(this.profile.nickname==='Explorer'&&this.cloud.session?.username){
       this.profile.nickname=this.cloud.session.username;
       this.nicknameEdit=this.profile.nickname;
       write(KEY,JSON.stringify(this.profile));
       await this.cloud.save(this.cloudSnapshot());
     }
     this.cloudMaySave=true;this.cloudStatus='✓ Online gespeichert';this.cloudPin='';this.cloudUsername='';
     // Publishing happens after hydration finishes; otherwise registration
     // inadvertently suppresses creation of the player's friends card.
     void this.checkOwnAccountNotice();
     this.cloudMessage='';
   }catch(e){
     this.cloudMessage=cloudError(e);
     if(registering&&authenticated){
       // Firebase may have created the account even when the first Firestore write fails.
       // Do not delete the session or local progress; a retry is safe and idempotent.
       this.cloudMaySave=true;
       this.cloudStatus='⚠ Cloud-Speichern fehlgeschlagen';
       this.alert('Dein Account wurde erstellt, aber der Spielstand ist noch nicht online bestätigt: '+this.cloudMessage+' Im Profil kannst du „Jetzt synchronisieren“ drücken.');
     }else if(authenticated){
       // Loading an existing account failed: never overwrite the remote save with a stale local profile.
       this.cloudMaySave=false;
       this.cloudStatus='⚠ Cloud-Laden fehlgeschlagen';
       this.alert('Login erfolgreich, aber Cloud-Spielstand nicht geladen: '+this.cloudMessage+' Lade die Seite erneut.');
     }
   }finally{
     this.cloudHydrating=false;this.cloudBusy=false;this.cloudStage='';
     // Successful registration and login both create/repair the owner's
     // public social card after the private save finished hydrating.
     // Never publish client-editable XP/TT or overwrite legacy levels.
     if(this.cloud.session&&this.cloudMaySave&&this.cloudStatus==='✓ Online gespeichert')
       void this.publishFriendCard();
     // Angular's zoneless change detection needs an explicit notification after fetch promises.
     // Notify it when cloud data is loaded, so the login modal closes without an extra click.
     this.changeDetector.markForCheck();
   }
 }
 private clearDeviceProgress(){
   for(const trainer of TRAINERS)localStorage.removeItem(trainer.saveKey);
   for(const key of [KEY,CHEM,BRIDGE,CLOUD_DAILY_KEY,RESTORE])localStorage.removeItem(key);
 }
 async logOutCloud(){
   if(!this.cloud.session)return;
   await this.syncCloudNow();
   if(!this.cloudMaySave||this.cloudStatus==='⚠ Speichern fehlgeschlagen'){
     this.alert('Cloud-Speicherung fehlgeschlagen. Exportiere zur Sicherheit ein Backup und versuche es erneut, bevor du dich abmeldest.');
     return;
   }
   this.cloud.signOut();this.cloudMaySave=false;this.publicPlayers=[];this.friendsError='';this.friendProfileStamp='';this.moderationNotice=null;this.noticePreview=false;this.noticeError='';this.noticeCheckId++;this.clearDeviceProgress();
   this.profile=initial();this.nicknameEdit=this.profile.nickname;
   this.cloudMode='login';this.cloudStatus='Abgemeldet';this.cloudMessage='';
   this.view='dashboard';this.intro=false;write(INTRO,'1');
   this.changeDetector.markForCheck();
 }

 get level(){return levelFor(this.profile.xp);}
 get levelBegin(){return (this.level-1)**2*110;}
 get levelEnd(){return this.level**2*110;}
 get levelProgress(){return Math.min(100,Math.round(100*(this.profile.xp-this.levelBegin)/(this.levelEnd-this.levelBegin)));}
 get subjectsAll():Subject[]{
   return [...SUBJECTS,...(this.profile.customSubjects||[]).map(s=>({id:s.id,name:s.name,short:s.name.slice(0,4).toUpperCase(),icon:s.emoji,group:'Andere',color:'#c6a7ff',desc:'Deine eigene Lernwelt.'}))];
 }
 get selectedSubject(){return this.subjectsAll.find(s=>s.id===this.selected);}
 // Playable worlds always lead. Chemverse, Dsaiverse and the next-up C# world
 // retain their intended positions; newly registered trainers become visible automatically.
 get orderedSubjects():Subject[]{
   const all=this.subjectsAll;
   const pinned:Record<string,number>={nawi:0,dsai:1,pos:2};
   const position=(s:Subject)=>pinned[s.id]??(100+all.indexOf(s));
   return [...all].sort((a,b)=>
     Number(this.subjectHasTrainer(b.id))-Number(this.subjectHasTrainer(a.id))
     ||position(a)-position(b));
 }
 get activeSubjects(){return this.orderedSubjects.filter(s=>this.subjectHasTrainer(s.id));}
 get filteredSubjects(){return this.orderedSubjects.filter(s=>(this.group==='Alle'||s.group===this.group)&&
 (s.name+' '+s.short+' '+s.desc).toLowerCase().includes(this.search.toLowerCase().trim()));}
 /** Show a test in the dropdown only once at least one prize is unlocked. */
 get drops(){return SHOP_DROPS.filter(d=>d.id==='global'||this.items.some(i=>i.drop===d.id&&this.isUnlocked(i)));}
 get selectedDrop(){return this.drops.find(d=>d.id===this.shopDrop)||this.drops[0];}
 get dropItems(){return this.items.filter(i=>i.drop===this.selectedDrop.id);}
 get dropOwned(){return this.dropItems.filter(i=>this.owns(i)).length;}
 dropItemCount(id:string){return this.items.filter(i=>i.drop===id).length;}
 dropOwnedCount(id:string){return this.items.filter(i=>i.drop===id&&this.owns(i)).length;}
 itemProgressPercent(item:ShopItem):number{
   if(this.owns(item)||this.isUnlocked(item))return 100;
   if(item.drop==='global')return Math.min(100,Math.floor(100*this.level/(item.level||1)));
   if(!item.requirement)return 0;
   // Verse item progress depends entirely on study achievements; global items use player level.
   return Math.min(100,Math.floor(100*this.metricProgress(item.drop,item.requirement.metric)/item.requirement.value));
 }
 groupLabel(group:string):string{
   const labels:Record<string,string>={theme:'Themes',atm:'Hintergründe',avatar:'Avatare',frame:'Rahmen',font:'Schriften',banner:'Banner',title:'Titel',fx:'Effekte'};
   return labels[group]||group;
 }
 // The product category belongs in its readable name, not only in tiny metadata.
 // Item IDs and stored base names are deliberately unchanged for old inventories.
 itemTypeName(group:string):string{
   const labels:Record<string,string>={theme:'Theme',atm:'Hintergrund',avatar:'Avatar',frame:'Rahmen',font:'Schriftart',banner:'Banner',title:'Titel',fx:'Effekt'};
   return labels[group]||'Cosmetic';
 }
 itemNameSuffix(item:ShopItem):string{
   const type=this.itemTypeName(item.group);
   const endings=item.group==='font'?['schrift','schriftart']:[type.toLocaleLowerCase('de')];
   const name=item.name.trim().toLocaleLowerCase('de');
   return endings.some(suffix=>name===suffix||name.endsWith(' '+suffix)||name.endsWith('-'+suffix))?'':type;
 }
 itemDisplayName(item:ShopItem):string{
   const suffix=this.itemNameSuffix(item);
   return suffix?item.name+' '+suffix:item.name;
 }

 get dropUnlocked(){return this.dropItems.filter(i=>this.owns(i)||this.isUnlocked(i)).length;}
 get filteredItems(){return this.dropItems
  .filter(i=>!this.owns(i)&&(this.shopGroup==='Alle'||i.group===this.shopGroup))
  .sort((a,b)=>Number(this.isUnlocked(b))-Number(this.isUnlocked(a))
    ||this.sortRequirement(a)-this.sortRequirement(b)||a.name.localeCompare(b.name,'de'));}
 private sortRequirement(item:ShopItem){return item.drop==='global'?(item.level||1)*10:(item.requirement?.value||0);}
 // Every test uses the same category tabs, even when it has no items in one category.
 get shopCategories(){return ['Alle',...new Set(this.items.map(i=>i.group))];}
 get selectedCategoryHasItems(){return this.shopGroup==='Alle'||this.dropItems.some(i=>i.group===this.shopGroup);}
 chooseDrop(id:string){if(!this.drops.some(d=>d.id===id))return;this.shopDrop=id;this.shopGroup='Alle';this.previewed=null;this.spotlightRewardId='';}
 metricProgress(drop:string,metric:ShopRequirement['metric']):number{
   const trainer=TRAINERS.find(t=>t.id===drop);if(!trainer)return 0;
   const save=this.snapshot(trainer),solved=isObj(save['solved'])?save['solved']:{};
   if(metric==='academy')return Object.values(isObj(save['courseDone'])?save['courseDone']:{}).filter(Boolean).length;
   if(metric==='boss')return safe(save['bestBoss']);
   const prefix=({quiz:'q',draw:'d',reaction:'r',sorter:'s',pipeline:'p',forecast:'f'} as Record<ShopRequirement['metric'],string>)[metric]||'';
   return Object.keys(solved).filter(k=>k.startsWith(prefix)&&!!solved[k]).length;
 }
 isUnlocked(item:ShopItem):boolean{
   if(this.owns(item))return true;
   // Only universal cosmetics are gated by the player profile level.
   if(item.drop==='global')return this.level>=(item.level||1);
   if(!item.requirement)return false;
   return this.metricProgress(item.drop,item.requirement.metric)>=item.requirement.value;
 }
 requirementLabel(item:ShopItem):string{
   if(item.drop==='global')return 'Ab Profil-Level '+(item.level||1);
   const r=item.requirement;if(!r)return 'Drop noch nicht verfügbar';
   const value=this.metricProgress(item.drop,r.metric);
   const captions={academy:'Lernlektionen',quiz:'Quizfragen',draw:'Code- oder Zeichenaufgaben',reaction:'Reaktionsaufgaben',sorter:'Data-Sorter-Aufgaben',pipeline:'Prozess-Puzzles',forecast:'Festival-Prognosen',boss:'Boss-Ergebnis'};
   const proof=r.metric==='boss'?'Boss: '+value+'% / '+r.value+'%':value+'/'+r.value+' '+captions[r.metric];
   return proof;
 }
 get dropDescription(){return this.shopDrop==='global'?'Freischaltungen durchs globale Profil-Level':'Freischaltungen durch echten Fortschritt im jeweiligen Test';}
 get shopAchievementStatus(){
   // This shows ONLY rewards that can still be earned, not the lifetime reward pool.
   const trainer=TRAINERS.find(t=>t.id===this.shopDrop) || TRAINERS[0];
   const save=this.snapshot(trainer);
   const open=trainer.achievements.filter(a=>achievementValue(a,save)<a.target);
   return {trainer:trainer.title,total:trainer.achievements.length,
     done:trainer.achievements.length-open.length,remaining:open.length,
     reward:open.reduce((sum,a)=>sum+a.reward,0)};
 }
 get earningAchievementStatus(){
   // The rewards tab is global, unlike the selected collection in the shop.
   const totals=TRAINERS.map(trainer=>{
     const save=this.snapshot(trainer);
     const remaining=trainer.achievements.filter(a=>achievementValue(a,save)<a.target);
     return {total:trainer.achievements.length,remaining:remaining.length,
       reward:remaining.reduce((sum,a)=>sum+a.reward,0)};
   });
   const total=totals.reduce((sum,t)=>sum+t.total,0);
   const remaining=totals.reduce((sum,t)=>sum+t.remaining,0);
   return {total,remaining,done:total-remaining,
     reward:totals.reduce((sum,t)=>sum+t.reward,0)};
 }
 get shopTotalRemainingCost(){return this.items.filter(item=>!this.owns(item)).reduce((sum,item)=>sum+item.cost,0);}
 get shopTotalTokenGap(){return Math.max(0,this.shopTotalRemainingCost-this.profile.tokens);}
 get dailyChem(){
   // Global daily budget: 20 quiz payouts and one boss payout shared by all Ver(s)es.
   // Include earlier per-trainer payouts when migrating from the original single-subject daily system.
   const now=new Date();
   const date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
   const global=parse(read('studyverse_shared_daily_v1'));
   const unique=new Set<string>(),valid=isObj(global)&&global['date']===date;
   if(valid&&Array.isArray(global['quizIds']))for(const id of global['quizIds']){
     if(typeof id==='string')unique.add(id);
   }
   let boss=valid&&global['bossPaid']===true;
   for(const trainer of TRAINERS){
     const snap=this.snapshot(trainer),daily=isObj(snap['dailyCoin'])?snap['dailyCoin']:{};
     if(daily['date']!==date)continue;
     if(Array.isArray(daily['quizIds']))for(const id of daily['quizIds']){
       if(typeof id==='string')unique.add(id.includes(':')?id:(trainer.subjectId==='nawi'?'chem:':'dsai:')+id);
     }
     boss=boss||daily['bossPaid']===true;
   }
   const count=Math.min(20,unique.size);
   return {questions:count,boss,quizRemaining:(20-count)*25,bossRemaining:boss?0:250};
 }
 get shopCollectionCost(){return this.dropItems.filter(i=>!this.owns(i)).reduce((n,i)=>n+i.cost,0);}
 get shopTokenGap(){return Math.max(0,this.shopCollectionCost-this.profile.tokens);}
 goEarnTokens(mode:'quiz'|'boss'|'academy'){
   const trainer=TRAINERS.find(t=>t.id===this.shopDrop)||TRAINERS[0];
   if(mode==='academy'){this.openTrainer(trainer.id);return;}
   const url=new URL('daily/index.html',document.baseURI);
   url.searchParams.set('mode',mode);
   window.location.assign(url.href);
 }
 preview(item:ShopItem){this.previewed=item;}
 closePreview(){this.previewed=null;}

 get categories(){return ['Alle','Informatik','Naturwissenschaften','Wirtschaft','Gesellschaft','Andere'];}
 get claimed(){return this.ownedCatalogItems.length;}
 get ownedCatalogItems(){return [...this.items,...LEGACY_OWNED_ITEMS].filter(item=>this.owns(item));}
 get inventoryDrops(){return ['Alle',...new Set(this.ownedCatalogItems.map(item=>item.drop))];}
 get inventoryCategories(){
   return ['Alle',...new Set(this.ownedCatalogItems.filter(item=>this.inventoryDrop==='Alle'||item.drop===this.inventoryDrop).map(item=>item.group))];
 }
 get inventoryItems(){
   const query=this.inventorySearch.trim().toLocaleLowerCase('de');
   return this.ownedCatalogItems.filter(item=>
      (this.inventoryDrop==='Alle'||item.drop===this.inventoryDrop) &&
      (this.inventoryGroup==='Alle'||item.group===this.inventoryGroup) &&
      (!query||(this.itemDisplayName(item)+' '+item.desc+' '+this.groupLabel(item.group)).toLocaleLowerCase('de').includes(query))
   ).sort((a,b)=>Number(this.active(b))-Number(this.active(a))||a.name.localeCompare(b.name,'de'));
 }
 get inventoryEquippedCount(){return this.ownedCatalogItems.filter(item=>this.active(item)).length;}
 dropLabel(id:string){return this.drops.find(drop=>drop.id===id)?.title||(id==='maths-hw-02'?'MathsVerse · Archiv':id);}
 changeInventoryDrop(id:string){this.inventoryDrop=id;this.inventoryGroup='Alle';}
 setShopTab(tab:'catalog'|'inventory'|'earn'){this.shopTab=tab;this.previewed=null;window.scrollTo({top:0,behavior:'smooth'});}
 openInventory(){this.go('shop');this.setShopTab('inventory');}
 openTokenEarning(){this.go('shop');this.setShopTab('earn');}
 get trainers(){return TRAINERS;}
 get achievementSubjects(){return ['Alle',...new Set(TRAINERS.map(t=>t.subjectId))];}
 get achievementTests(){return TRAINERS.filter(t=>this.achievementSubject==='Alle'||t.subjectId===this.achievementSubject);}
 get achievementGroups(){
   return this.achievementTests.filter(t=>this.achievementTest==='Alle'||t.id===this.achievementTest).map(trainer=>{
     const snapshot=this.snapshot(trainer);
     const items=trainer.achievements.map(a=>{
       const value=achievementValue(a,snapshot);
       return {...a,value,done:value>=a.target,percent:Math.min(100,Math.round(value/a.target*100))};
     }).sort((a,b)=>{
       switch(this.achievementSort){
         case 'done':return Number(b.done)-Number(a.done)||b.percent-a.percent;
         case 'progress':return b.percent-a.percent||Number(a.done)-Number(b.done);
         case 'reward':return b.reward-a.reward||b.percent-a.percent;
         case 'title':return a.title.localeCompare(b.title,'de');
         default:return Number(a.done)-Number(b.done)||b.percent-a.percent;
       }
     });
     return {trainer,items};
   });
 }
 get achievementTotals(){const gs=this.achievementGroups;return {total:gs.reduce((n,g)=>n+g.items.length,0),done:gs.reduce((n,g)=>n+g.items.filter(a=>a.done).length,0)};}
 getTrainerForSubject(id:string){return TRAINERS.filter(t=>t.subjectId===id);}
 subjectHasTrainer(id:string):boolean{return TRAINERS.some(t=>t.subjectId===id && !!t.path);}
 subjectCountLabel(id:string):string{
   const count=this.getTrainerForSubject(id).length;
   return count===1?'1 Test spielbereit':count>1?count+' Tests spielbereit':'Noch nicht verfügbar';
 }
 private snapshot(t:TrainerDef):Record<string,unknown>{const local=parse(read(t.saveKey));if(isObj(local))return local;const saved=this.profile.trainerSaves?.[t.id];if(isObj(saved))return saved;if(t.id==='nawi-test-01'&&isObj(this.profile.chemverseSave))return this.profile.chemverseSave;return {};}
 setAchievementSubject(id:string){this.achievementSubject=id;this.achievementTest='Alle';}
 private grantAchievementTokens():number{
   const ledger:Record<string,boolean>=this.profile.achievementTokenClaims || {};
   let paid=0;
   for(const trainer of TRAINERS){
     const state=this.snapshot(trainer);
     for(const badge of trainer.achievements){
       const key=trainer.id+':'+badge.id;
       if(ledger[key]||achievementValue(badge,state)<badge.target)continue;
       ledger[key]=true;paid+=badge.reward;
       this.profile.activity=[{label:'🏆 '+badge.title+' · '+trainer.title,date:new Date().toISOString(),amount:badge.reward},...this.profile.activity].slice(0,30);
     }
   }
   if(paid){
     this.profile.tokens+=paid;
     this.profile.achievementTokenClaims=ledger;
     this.save();
   }
   return paid;
 }
 /** Persistent per-user reward notifications. Previously earned items appear in the
  * catalog without generating a wall of retroactive popups on first upgrade. */
 private checkRewardUnlocks(){
  const unlocked=this.items.filter(i=>i.drop!=='global'&&this.isUnlocked(i)&&!this.owns(i));
  if(!isObj(this.profile.rewardSeen)){
   this.profile.rewardSeen=Object.fromEntries(unlocked.map(i=>[i.id,true]));
   this.profile.rewardQueue=[];
   this.save();
   return;
  }
  const seen=this.profile.rewardSeen;
  const queue=Array.isArray(this.profile.rewardQueue)?this.profile.rewardQueue.filter(id=>typeof id==='string'):[];
  for(const item of unlocked){
   if(seen[item.id])continue;
   seen[item.id]=true;
   if(!queue.includes(item.id))queue.push(item.id);
  }
  this.profile.rewardQueue=queue.filter(id=>{
   const item=this.items.find(i=>i.id===id);
   return !!item&&!this.owns(item)&&this.isUnlocked(item);
  });
  this.save();this.changeDetector.markForCheck();
 }
 get nextReward():ShopItem|null{
  if(this.rewardPopupSuppressed)return null;
  const id=this.profile.rewardQueue?.[0];
  return this.items.find(i=>i.id===id&&!this.owns(i)&&this.isUnlocked(i))||null;
 }
 acceptReward(){
  const item=this.nextReward;
  if(!item)return;
  // Accept the notification only; learning goals grant PURCHASE ELIGIBILITY,
  // never free inventory. Existing TT, XP and cosmetics remain untouched.
  this.profile.rewardQueue=(this.profile.rewardQueue||[]).filter(id=>id!==item.id);
  this.rewardPopupSuppressed=true;
  this.save();
  this.changeDetector.markForCheck();
 }
 showRewardInShop(){
  const item=this.nextReward;
  if(!item)return;
  this.profile.rewardQueue=(this.profile.rewardQueue||[]).filter(id=>id!==item.id);
  this.rewardPopupSuppressed=true;
  this.go('shop');this.shopTab='catalog';this.shopGroup='Alle';this.shopDrop=item.drop;
  this.spotlightRewardId=item.id;
  this.save();this.changeDetector.markForCheck();
 }
 get title(){return [...this.items,...LEGACY_OWNED_ITEMS].find(i=>i.id===this.profile.equipped['title'])?.name || 'Weltenentdecker';}
 get currentTheme(){return this.profile.equipped['theme'] || 'base';}
 // Keep the equipped design on the real homepage; only the modal showcases a candidate item.
 get previewTheme(){return this.currentTheme;}
 previewSlot(k:string){return this.profile.equipped[k] || (k==='font'?'standard':'none');}
 previewValue(slot:string,item:ShopItem):string{
   return item.group===slot?(item.equip||item.id):(slot==='theme'?'base':slot==='font'?'standard':'none');
 }
 previewParticle(item:ShopItem):string{
   if(item.id==='effect_coinrain')return '🪙';
   if(item.id==='effect_discoin')return '🪩';
   if(item.id==='dsai_fx')return '✧';
   if(item.id==='g_thread_sparks')return '⚡';
   if(item.id==='g_pulse_rings')return '◯';
   return '🎊';
 }
 get previewParticleSlots(){return [0,1,2,3,4,5,6,7,8,9,10,11];}
 get currentAvatar(){return this.profile.equipped['avatar'] || '🧪';}
 get unlockedAvatars(){return this.ownedCatalogItems.filter(item=>item.group==='avatar');}
 get unlockedTitles(){return this.ownedCatalogItems.filter(item=>item.group==='title');}
 setProfileTitle(id:string){
   if(id){
     const item=this.ownedCatalogItems.find(x=>x.id===id&&x.group==='title');
     if(!item||!this.owns(item)){this.alert('Diesen Titel hast du noch nicht freigeschaltet.');return;}
   }
   this.profile.equipped['title']=id||'';
   this.save();
   this.alert('🏅 Titel geändert: '+this.title);
 }

 openAvatarPicker(){this.avatarPickerOpen=true;}
 closeAvatarPicker(){this.avatarPickerOpen=false;}
 selectProfileAvatar(id:string){
   if(id==='default'){
     this.profile.equipped['avatar']=defaultEquip().avatar;
   } else {
     const item=this.ownedCatalogItems.find(x=>x.id===id&&x.group==='avatar');
     if(!item||!this.owns(item)){this.alert('Diesen Avatar musst du erst im Item-Shop erhalten.');return;}
     this.profile.equipped['avatar']=item.icon;
   }
   this.avatarPickerOpen=false;this.save();this.alert('🖌️ Avatar aktualisiert!');
 }
 go(page:View){if(page==='achievements'||page==='shop')this.syncTrainer();this.view=page;this.selected=null;this.previewed=null;if(page==='shop')this.shopTab='catalog';if(page==='friends')void this.refreshFriends();window.scrollTo({top:0,behavior:'smooth'});}
 choose(id:string){if(!this.subjectHasTrainer(id))return;this.selected=id;this.view='subjects';window.scrollTo({top:0,behavior:'smooth'});}
 startImport(){if(this.rejectUnsafeBackupRestore())return;this.intro=false;this.importOpen=true;write(INTRO,'1');}
 skipIntro(){this.intro=false;write(INTRO,'1');}
 // JSON backups are for personal offline recovery, not authoritative cloud scores.
 get canRestoreBackup(){return this.cloudReady&&!this.cloudConfigured&&!this.cloud.session;}
 get canImport(){return this.canRestoreBackup&&!this.profile.legacyImportedAt;}
 private rejectUnsafeBackupRestore():boolean{
   if(this.canRestoreBackup)return false;
   this.alert('🔒 JSON-Import für Cloud-Accounts deaktiviert. Bearbeitete Backups könnten XP und TastyTokens beliebig erhöhen. Deine Cloud-Sicherung bleibt erhalten.');
   return true;
 }
 get canUndoRestore(){return this.canRestoreBackup&&isObj(parse(read(RESTORE)));}
 importBrowser(){if(this.rejectUnsafeBackupRestore())return;this.applyImport(parse(read(CHEM)));}
 async importFile(event:Event){
   const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;
   if(this.rejectUnsafeBackupRestore()){input.value='';return;}
   try{
     if(file.size>10_000_000){this.alert('Datei zu groß (max. 10 MB).');return;}
     let data:unknown;
     try{data=JSON.parse(await file.text());}
     catch{this.alert('Die Datei ist kein gültiges JSON. Bitte das Original-Backup wählen.');return;}
     // Works for both classic raw STUDYVERSE backups and a future versioned backup envelope.
     const candidate=isObj(data)&&isObj(data['profile'])?data['profile']:data;
     if(validStudyverse(candidate)){this.restoreStudyverseBackup(candidate);return;}
     if(validChem(candidate)){this.applyImport(candidate);return;}
     this.alert('Dateiformat nicht erkannt. Bitte STUDYVERSE-Backup oder CHEMVERSE-Spielstand (.json) auswählen.');
   }finally{input.value='';}
 }
 private currentBackupSnapshot():{profile:string|null;trainers:Record<string,string|null>}{
   const trainers:Record<string,string|null>={};
   for(const trainer of TRAINERS)trainers[trainer.id]=read(trainer.saveKey);
   return {profile:read(KEY),trainers};
 }
 private writeBackupSnapshot(snapshot:{profile:string|null;trainers:Record<string,string|null>}):void{
   if(snapshot.profile===null)localStorage.removeItem(KEY);
   else localStorage.setItem(KEY,snapshot.profile);
   for(const trainer of TRAINERS){
     const value=snapshot.trainers[trainer.id];
     if(typeof value==='string')localStorage.setItem(trainer.saveKey,value);
     else localStorage.removeItem(trainer.saveKey);
   }
 }
 private restoreStudyverseBackup(data:Record<string,unknown>){
   if(this.rejectUnsafeBackupRestore())return;
   // Restore is a replacement, not an addition: importing the same file twice must NEVER duplicate XP/TT.
   const hasLocalProgress=this.profile.xp>0||this.profile.tokens>0||this.profile.inventory.length>0
     ||TRAINERS.some(tr=>isObj(parse(read(tr.saveKey)))&&Object.keys(parse(read(tr.saveKey)) as Record<string,unknown>).length>0);
   if(hasLocalProgress&&!window.confirm('STUDYVERSE-Backup wiederherstellen? Der aktuelle Spielstand auf diesem Gerät wird ersetzt. Zur Sicherheit bleibt eine Rückfallkopie lokal gespeichert.'))return;
   const snapshots:Record<string,Record<string,unknown>>={};
   const provided=isObj(data['trainerSaves'])?data['trainerSaves']:{};
   for(const trainer of TRAINERS){
     const raw=provided[trainer.id];
     if(isObj(raw))snapshots[trainer.id]=raw;
     else if(trainer.id==='nawi-test-01'&&isObj(data['chemverseSave']))snapshots[trainer.id]=data['chemverseSave'] as Record<string,unknown>;
   }
   const incoming:Profile={
     ...initial(),...data,
     xp:safe(data['xp']),tokens:safe(data['tokens']),
     nickname:(data['nickname'] as string).trim().slice(0,24),
     inventory:[...new Set(data['inventory'] as string[])],
     equipped:{...defaultEquip(),...data['equipped'] as Record<string,string>},
     claimedLevels:isObj(data['claimedLevels'])?data['claimedLevels'] as Record<string,boolean>:{},
     activity:Array.isArray(data['activity'])?data['activity'] as Activity[]:[],
     trainerSaves:snapshots,
     shopDropMigrationV1:data['shopDropMigrationV1']===true
   };
   if(snapshots['nawi-test-01']){
     incoming.chemverseSave=snapshots['nawi-test-01'];
     if(!incoming.legacyImportedAt)incoming.legacyImportedAt='Aus STUDYVERSE-Backup';
   }
   const next:{profile:string|null;trainers:Record<string,string|null>}={profile:JSON.stringify(incoming),trainers:{}};
   for(const trainer of TRAINERS)next.trainers[trainer.id]=snapshots[trainer.id]?JSON.stringify(snapshots[trainer.id]):null;
   const previous=this.currentBackupSnapshot();
   try{
     localStorage.setItem(RESTORE,JSON.stringify(previous));
     this.writeBackupSnapshot(next);
     localStorage.removeItem(BRIDGE); // A pending old trainer bridge must never add phantom XP after restoration.
     localStorage.setItem(INTRO,'1');
   }catch{
     try{this.writeBackupSnapshot(previous);}catch{}
     this.alert('Backup konnte nicht gespeichert werden (Browser-Speicher prüfen). Dein bisheriger Stand wurde beibehalten.');
     return;
   }
   this.profile=this.load();this.nicknameEdit=this.profile.nickname;
   this.intro=false;this.importOpen=false;this.view='profile';this.queueCloudSave();
   this.alert('✅ STUDYVERSE-Backup wiederhergestellt! '+this.profile.xp+' XP, '+this.profile.tokens+' TT und '+this.profile.inventory.length+' Items sind da.'+
     (Object.keys(snapshots).length?' Lernstände wurden ebenfalls übertragen.':' Achtung: Diese Datei enthält keine gespeicherten Lernwelten.'));
 }
 undoStudyverseRestore(){
   if(this.rejectUnsafeBackupRestore())return;
   const raw=parse(read(RESTORE));
   if(!isObj(raw)||(raw['profile']!==null&&typeof raw['profile']!=='string')||!isObj(raw['trainers'])){
     this.alert('Keine gültige Rückfallkopie vorhanden.');return;
   }
   if(!window.confirm('Vorherigen lokalen PC-Stand wiederherstellen? Der aktuell importierte Stand wird dadurch ersetzt.'))return;
   const earlier={profile:raw['profile'] as string|null,trainers:raw['trainers'] as Record<string,string|null>};
   const current=this.currentBackupSnapshot();
   try{
     this.writeBackupSnapshot(earlier);
     localStorage.removeItem(BRIDGE);
     localStorage.removeItem(RESTORE);
   }catch{
     try{this.writeBackupSnapshot(current);}catch{}
     this.alert('Rückgängig machen fehlgeschlagen. Der aktuelle Stand bleibt erhalten.');return;
   }
   this.profile=this.load();this.nicknameEdit=this.profile.nickname;this.importOpen=false;this.queueCloudSave();
   this.alert('↶ Vorherigen PC-Spielstand wiederhergestellt.');
 }
 private applyImport(data:unknown){
   if(this.rejectUnsafeBackupRestore())return;
   if(!this.canImport){this.alert('CHEMVERSE wurde bereits einmal importiert.');return;}
   if(!validChem(data)){this.alert('Ungültiger CHEMVERSE-Export: XP, TastyTokens oder Fortschrittsdaten fehlen.');return;}
   const purchased=data['purchased'] as Record<string,unknown>;
   this.profile.xp+=safe(data['xp']);this.profile.tokens+=safe(data['coins']);
   const importedLevel=levelFor(safe(data['xp']));
   const legacyFree=[{id:'avatar_atom',level:2},{id:'ionstorm',level:3},{id:'blueprint',level:4},{id:'legend',level:5}];
   this.profile.inventory=[...new Set([...this.profile.inventory,...Object.keys(purchased).filter(k=>!!purchased[k]),
     ...legacyFree.filter(i=>importedLevel>=i.level).map(i=>i.id)])];
   if(isObj(data['claimedLevels']))this.profile.claimedLevels={...this.profile.claimedLevels,...data['claimedLevels'] as Record<string,boolean>};
   const loadout=isObj(data['loadout'])?data['loadout']:{};
   this.profile.equipped={...this.profile.equipped,...loadout as Record<string,string>};
   if(this.profile.equipped['avatar']==='🐸')this.profile.equipped['avatar']='🐟';
   if(typeof data['theme']==='string')this.profile.equipped['theme']=data['theme'];
   this.profile.legacyImportedAt=new Date().toISOString();
   this.profile.chemverseSave=data;
   this.profile.trainerSaves={...(this.profile.trainerSaves||{}),'nawi-test-01':data};
   this.profile.activity=[{label:'CHEMVERSE importiert',date:new Date().toISOString(),amount:safe(data['xp'])},...this.profile.activity].slice(0,30);
   this.awardGlobalLevelRewards();this.awardLevelFreebies();this.save();write(CHEM,JSON.stringify(data));
   const achievedBonus=this.grantAchievementTokens();
   this.importOpen=false;this.intro=false;write(INTRO,'1');
   this.alert('CHEMVERSE übertragen! '+(achievedBonus?'+ '+achievedBonus+' Achievement-TT rückwirkend! 🎉':'XP, TastyTokens und Items sind angekommen. 🎉'));
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
     this.profile.activity=[{label:'Level '+lvl+' erreicht · TT-Bonus',date:new Date().toISOString(),amount:bonus},...this.profile.activity].slice(0,30);
   }
   return total;
 }
 private awardLevelFreebies(){
   const free=this.items.filter(i=>i.drop==='global'&&i.cost===0&&(i.level||1)<=this.level);
   this.profile.inventory=[...new Set([...this.profile.inventory,...free.map(i=>i.id)])];
 }
 owns(item:ShopItem){return this.profile.inventory.includes(item.id);}
 active(item:ShopItem){
   const key=item.group;const value=key==='avatar'?item.icon:(item.equip||item.id);
   return this.profile.equipped[key]===value;
 }
 priceLabel(item:ShopItem){
  if(this.owns(item))return this.active(item)?'✓ Ausgerüstet':'Ausrüsten';
  if(!this.isUnlocked(item))return item.drop==='global'?'🔒 Level '+item.level+' nötig':'🔒 Lernziel fehlt';
  return '◉ '+item.cost+' TT kaufen';
 }
 buyOrEquip(item:ShopItem){
  if(!this.owns(item)){
   if(!this.isUnlocked(item)){this.alert('Erst freischalten: '+this.requirementLabel(item));return;}
   if(this.profile.tokens<item.cost){this.alert('Nicht genug TastyTokens, Bruder. 💀');return;}
   this.profile.tokens-=item.cost;
   this.profile.inventory=[...new Set([...this.profile.inventory,item.id])];
   this.profile.activity=[{
    label:'Gekauft: '+item.name,
    date:new Date().toISOString(),amount:-item.cost
   },...this.profile.activity].slice(0,30);
   this.alert(item.icon+' '+this.itemDisplayName(item)+' gekauft!');
   this.profile.rewardQueue=(this.profile.rewardQueue||[]).filter(id=>id!==item.id);
  }else{
   const key=item.group,value=key==='avatar'?item.icon:(item.equip||item.id);
   this.profile.equipped[key]=this.active(item)?this.equipDefault(key):value;
   this.alert(this.itemDisplayName(item)+' – Ausrüstung geändert.');
  }
  this.previewed=null;this.spotlightRewardId='';this.save();
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
   if(!isAllowedNickname(name)){this.alert('Bitte wähle einen unbedenklichen Anzeigenamen (2–24 Zeichen, ohne Sonderzeichen oder beleidigende Begriffe).');return;}
   this.profile.nickname=name;this.save();void this.publishFriendCard(true);this.alert('Profil aktualisiert.');
 }
 exportProfile(){
   // Include the most recent per-test save, not just the global wallet and appearance.
   this.syncTrainer();
   const snapshots:Record<string,Record<string,unknown>>={...(this.profile.trainerSaves||{})};
   for(const trainer of TRAINERS){
     const local=parse(read(trainer.saveKey));
     const prior=snapshots[trainer.id];
     if(isObj(local)&&(!isObj(prior)||safe(local['xp'])>=safe(prior['xp'])))snapshots[trainer.id]=local;
   }
   this.profile.trainerSaves=snapshots;
   if(isObj(snapshots['nawi-test-01']))this.profile.chemverseSave=snapshots['nawi-test-01'];
   this.save();
   const blob=new Blob([JSON.stringify(this.profile,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);const link=document.createElement('a');
   link.href=url;link.download='studyverse-backup.json';link.click();
   URL.revokeObjectURL(url);
 }
 openChemverse(){this.openTrainer('nawi-test-01');}
 openTrainer(id:string,mode?:'quiz'|'boss'){
   const trainer=TRAINERS.find(t=>t.id===id);if(!trainer){this.alert('Diese Lernwelt ist noch nicht verfügbar.');return;}
   const oldRaw=parse(read(trainer.saveKey));
   const old:Record<string,unknown>=isObj(oldRaw)?{...oldRaw}:isObj(this.profile.trainerSaves?.[id])?{...this.profile.trainerSaves![id]}:id==='nawi-test-01'&&validChem(this.profile.chemverseSave)?{...this.profile.chemverseSave}:{xp:0,coins:0,purchased:{},earned:{},solved:{},learned:{}};
   const purchased=isObj(old['purchased'])?old['purchased']:{};
   for(const item of this.profile.inventory)purchased[item]=true;
   old['purchased']=purchased;old['coins']=this.profile.tokens;old['theme']=this.currentTheme;
   old['loadout']={...(isObj(old['loadout'])?old['loadout']:{}),...this.profile.equipped};
   write(trainer.saveKey,JSON.stringify(old));
   write(BRIDGE,JSON.stringify({id:trainer.id,saveKey:trainer.saveKey,xp:safe(old['xp'])}));
   const link=new URL(trainer.path,document.baseURI);if(mode)link.hash=mode;
   window.location.assign(link.href);
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
  this.checkRewardUnlocks();
  const achievementBonus=this.grantAchievementTokens();
   if(gained||levelBonus||achievementBonus)this.alert('Willkommen zurück! '+(gained?'+'+gained+' XP ':'')+(levelBonus?'· +'+levelBonus+' Level-TT':'')+(achievementBonus?' · 🏆 +'+achievementBonus+' Achievement-TT':'')+' synchronisiert.');
 }
}