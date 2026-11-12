/**
 * Studyverse cloud accounts (Firebase Authentication + Firestore REST).
 * No user PINs, private keys, or passwords are stored in this repository or in Firestore.
 * The published Firebase WEB apiKey is a public project identifier, not an admin credential.
 */
export const CLOUD_SESSION_KEY='studyverse_cloud_session_v1';
export const CLOUD_DAILY_KEY='studyverse_shared_daily_v1';
export interface CloudSnapshot{
  version:number;
  profile:Record<string,unknown>;
  trainers:Record<string,Record<string,unknown>>;
  daily?:unknown;
  bridge?:unknown;
}
export interface PublicPlayer {uid:string;nickname:string;avatar:string;title:string}
/** Moderator-controlled notice. No client can write or choose who gets one. */
export interface AccountNotice {id:string;kind:'fairplay-warning'}

interface CloudConfig{apiKey:string;projectId:string}
export interface CloudSession{uid:string;username:string;idToken:string;refreshToken:string;expiresAt:number}
interface AuthResult{localId:string;idToken:string;refreshToken:string;expiresIn:string}
interface FirestoreDocument{fields?:{profile?:{stringValue?:string}}}
async function fetchCloud(url:string,init:RequestInit={},timeoutMs=16000):Promise<Response>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...init,signal:controller.signal});}
  catch(error){
    if(controller.signal.aborted)throw Error('CLOUD_TIMEOUT');
    throw error;
  }finally{clearTimeout(timeout);}
}
const SESSION_KEY=CLOUD_SESSION_KEY;
function parseJson<T>(value:string|null):T|null{try{return value?JSON.parse(value) as T:null}catch{return null}}
function usernameOk(value:string){return /^[a-z0-9][a-z0-9_-]{2,19}$/.test(value);}
function publicUsername(name:string){return name.trim().toLowerCase();}
function loginEmail(name:string){return name+'@accounts.studyverse.example.com';}
export function cloudError(error:unknown):string{
  const raw=error instanceof Error?error.message:String(error);
  if(/WALLET_MIGRATION_PENDING/.test(raw))return 'Dein bisheriger Spielstand benötigt eine Admin-Prüfung. Deine Tokens werden nicht gelöscht; der Online-Sync bleibt bis zur Migration pausiert.';
  if(/EMAIL_EXISTS/.test(raw))return 'Benutzername schon vergeben. Versuch einen anderen.';
  if(/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_EMAIL/.test(raw))return 'Benutzername oder PIN stimmt nicht.';
  if(/WEAK_PASSWORD|PASSWORD_DOES_NOT_MEET_REQUIREMENTS/.test(raw))return 'Die PIN erfüllt die Passwortregeln des Projekts nicht.';
  if(/TOO_MANY_ATTEMPTS|TOO_MANY_REQUESTS/.test(raw))return 'Zu viele Versuche. Versuch es später nochmal.';
  if(/OPERATION_NOT_ALLOWED/.test(raw))return 'Firebase: E-Mail/Passwort-Anmeldung muss noch aktiviert werden.';
  if(/PERMISSION_DENIED|Missing or insufficient permissions|403/.test(raw))return 'Firestore-Zugriff blockiert. Bitte die Besitzer-Regeln veröffentlichen.';
  if(/CLOUD_TIMEOUT|AbortError/i.test(raw))return 'Firebase antwortet nicht rechtzeitig. Bitte Internet und Browser-Erweiterungen prüfen. Möglicherweise wurde der Account bereits erstellt.';
  if(/Failed to fetch|NetworkError|network/i.test(raw))return 'Keine Verbindung zur Cloud. Bitte Internet prüfen.';
  return raw.length>190?raw.slice(0,190)+'…':raw;
}
/** Public directory needs moderation. A client-side filter is only a first layer.
 * Restrict obvious offensive/impersonating display names but never rely on
 * this filter to establish server-authoritative scores. */
export function isAllowedNickname(value:string):boolean{
  const name=value.trim();
  if(name.length<2||name.length>24||/[\u0000-\u001f\u007f]/.test(name))return false;
  if(!/^[\p{L}\p{N} _.-]+$/u.test(name))return false;
  const normalized=name.normalize('NFKD').toLowerCase()
    .replace(/[4@]/g,'a').replace(/3/g,'e').replace(/[1!|]/g,'i')
    .replace(/0/g,'o').replace(/9/g,'g').replace(/[^a-z]/g,'');
  if(/n(?:i)?gg(?:a|e|er|ers)/.test(normalized))return false;
  if(/^(admin|administrator|moderator|support|studyverse)$/.test(normalized))return false;
  return true;
}
export class StudyverseCloud{
  private config:CloudConfig|null=null;
  session:CloudSession|null=null;
  get configured(){return this.config!==null;}
  async initialize():Promise<void>{
    try{
      const response=await fetch(new URL('cloud-config.json',document.baseURI).href,{cache:'no-store'});
      if(!response.ok)return;
      const raw=await response.json() as Partial<CloudConfig>;
      if(typeof raw.apiKey!=='string'||raw.apiKey.length<15||typeof raw.projectId!=='string'||!/^[a-z][a-z0-9-]{4,60}$/.test(raw.projectId))return;
      this.config={apiKey:raw.apiKey,projectId:raw.projectId};
    }catch{return;}
    const saved=parseJson<CloudSession>(localStorage.getItem(SESSION_KEY));
    if(!saved||!saved.uid||!saved.refreshToken||!saved.username)return;
    this.session=saved;
    try{await this.token();}
    catch(e){
      // Invalid/revoked token means a fresh login is needed. Network errors keep the local session.
      if(/INVALID_REFRESH_TOKEN|TOKEN_EXPIRED|USER_DISABLED|USER_NOT_FOUND|INVALID_GRANT|PROJECT_NUMBER_MISMATCH/.test(String(e)))this.signOut();
      else throw e;
    }
  }
  private get settings():CloudConfig{
    if(!this.config)throw Error('Der Cloud-Server ist noch nicht eingerichtet.');
    return this.config;
  }
  private persist(){if(this.session)localStorage.setItem(SESSION_KEY,JSON.stringify(this.session));}
  private applyAuth(username:string,response:AuthResult){
    this.session={uid:response.localId,username,idToken:response.idToken,refreshToken:response.refreshToken,
      expiresAt:Date.now()+Math.max(60,Number(response.expiresIn)||3600)*1000};
    this.persist();
  }
  private async authRequest(endpoint:'signUp'|'signInWithPassword',username:string,pin:string):Promise<void>{
    const normalized=publicUsername(username);
    if(!usernameOk(normalized))throw Error('Benutzername: 3–20 Zeichen, nur a–z, 0–9, _ und -; muss mit einem Buchstaben oder einer Zahl beginnen.');
    if(!/^\d{6}$/.test(pin))throw Error('Bitte genau sechs Ziffern als PIN eingeben.');
    const response=await fetchCloud('https://identitytoolkit.googleapis.com/v1/accounts:'+endpoint+'?key='+encodeURIComponent(this.settings.apiKey),{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:loginEmail(normalized),password:pin,returnSecureToken:true})
    });
    const payload=await response.json() as AuthResult&{error?:{message?:string}};
    if(!response.ok)throw Error(payload.error?.message||'Anmeldung fehlgeschlagen ('+response.status+').');
    this.applyAuth(normalized,payload);
  }
  async register(username:string,pin:string){await this.authRequest('signUp',username,pin);}
  async login(username:string,pin:string){await this.authRequest('signInWithPassword',username,pin);}
  signOut(){this.session=null;localStorage.removeItem(SESSION_KEY);}
  async token():Promise<string>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    if(this.session.expiresAt>Date.now()+60_000&&this.session.idToken)return this.session.idToken;
    const response=await fetchCloud('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(this.settings.apiKey),{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:this.session.refreshToken})
    });
    const result=await response.json() as {id_token?:string;refresh_token?:string;expires_in?:string;error?:{message?:string}};
    if(!response.ok||!result.id_token)throw Error(result.error?.message||'Sitzung konnte nicht erneuert werden.');
    this.session={...this.session,idToken:result.id_token,refreshToken:result.refresh_token||this.session.refreshToken,
      expiresAt:Date.now()+Math.max(60,Number(result.expires_in)||3600)*1000};
    this.persist();
    return this.session.idToken;
  }
  private endpoint():string{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    return 'https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(this.settings.projectId)+
      '/databases/(default)/documents/users/'+encodeURIComponent(this.session.uid);
  }
  /** Canonical, read-only balance. Untrusted practice save never overrides it. */
  async readWallet():Promise<{tokens:number;xp:number;inventory:string[]}>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    const url=this.endpoint()+'/wallet/tokens';
    const response=await fetchCloud(url,{headers:{Authorization:'Bearer '+await this.token()}});
    if(response.status===404)throw Error('WALLET_MIGRATION_PENDING: Vorhandenes Konto muss zuerst vom Admin migriert werden.');
    const body=await response.json() as {fields?:{
      migrationApproved?:{booleanValue?:boolean};tokens?:{integerValue?:string};
      xp?:{integerValue?:string};inventory?:{arrayValue?:{values?:Array<{stringValue?:string}>}};
    };error?:{message?:string}};
    if(!response.ok)throw Error(body.error?.message||'Wallet nicht lesbar ('+response.status+').');
    if(body.fields?.migrationApproved?.booleanValue!==true)throw Error('WALLET_MIGRATION_PENDING: Wallet noch nicht freigegeben.');
    const num=(value?:string)=>{const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:0;};
    return {
      tokens:num(body.fields.tokens?.integerValue),
      xp:num(body.fields.xp?.integerValue),
      inventory:(body.fields.inventory?.arrayValue?.values||[]).map(x=>x.stringValue||'').filter(Boolean)
    };
  }
  /** Callable Firebase Functions; uses the Firebase Authentication idToken. */
  private async callable<T>(name:string,data:unknown):Promise<T>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    const url='https://europe-west1-'+this.settings.projectId+'.cloudfunctions.net/'+name;
    const response=await fetchCloud(url,{method:'POST',headers:{
      'Content-Type':'application/json',Authorization:'Bearer '+await this.token()},
      body:JSON.stringify({data})});
    const body=await response.json() as {result?:T;error?:{message?:string;status?:string}};
    if(!response.ok||!('result' in body))throw Error(body.error?.message||'Cloud Function '+name+' fehlgeschlagen ('+response.status+').');
    return body.result as T;
  }
  async initializeWallet():Promise<void>{
    const result=await this.callable<{ready:boolean}>('initializeWallet',{});
    if(!result.ready)throw Error('WALLET_MIGRATION_PENDING: Wallet noch nicht freigegeben.');
  }
  async purchaseItem(itemId:string):Promise<{tokens:number;inventory:string[]}>{
    return this.callable<{tokens:number;inventory:string[]}>('purchaseItem',{itemId});
  }
  async load():Promise<CloudSnapshot|null>{
    const wallet=await this.readWallet();
    const base=this.documentBase(),uid=encodeURIComponent(this.session!.uid);
    let response=await fetchCloud(base+'/clientStates/'+uid,{headers:{Authorization:'Bearer '+await this.token()}});
    let payload=await response.json() as {fields?:{practice?:{stringValue?:string}};error?:{message?:string}};
    let stored=payload.fields?.practice?.stringValue||'';
    if(response.status===404){
      // One-time fallback only: legacy document remains readable but is never
      // written again and never trusted for tokens, XP or inventory.
      response=await fetchCloud(this.endpoint(),{headers:{Authorization:'Bearer '+await this.token()}});
      if(response.status!==404){
        payload=await response.json();
        stored=(payload as {fields?:{profile?:{stringValue?:string}}}).fields?.profile?.stringValue||'';
      }
    }
    if(!response.ok&&response.status!==404)throw Error(payload.error?.message||'Übungsstand konnte nicht geladen werden.');
    const snapshot=parseJson<CloudSnapshot>(stored);
    const profile=Object.assign({nickname:this.session?.username||'Explorer',equipped:{},claimedLevels:{},
      activity:[],trainerSaves:{}},snapshot?.profile||{},wallet);
    return {version:1,profile,trainers:snapshot?.trainers||{},
      ...(snapshot?.daily===undefined?{}:{daily:snapshot.daily}),
      ...(snapshot?.bridge===undefined?{}:{bridge:snapshot.bridge})};
  }
  async save(snapshot:CloudSnapshot):Promise<void>{
    // All economy fields are explicitly excluded. Practice JSON is UNSIGNED
    // and never consumed by server rewards or any competitive rank.
    const practiceProfile={...snapshot.profile};
    for(const key of ['tokens','xp','inventory','claimedLevels','achievementTokenClaims','shopDropMigrationV1'])
      delete practiceProfile[key];
    const text=JSON.stringify({...snapshot,profile:practiceProfile});
    if(text.length>700000)throw Error('Lernstand zu groß. Exportiere zuerst ein JSON-Backup.');
    const nickname=String(snapshot.profile['nickname']||this.session?.username||'Spieler').slice(0,24);
    const url=this.documentBase()+'/clientStates/'+encodeURIComponent(this.session!.uid)+
      '?updateMask.fieldPaths=practice&updateMask.fieldPaths=nickname&updateMask.fieldPaths=updatedAt';
    const response=await fetchCloud(url,{
      method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await this.token()},
      body:JSON.stringify({fields:{practice:{stringValue:text},nickname:{stringValue:nickname},
        updatedAt:{timestampValue:new Date().toISOString()}}})
    });
    if(!response.ok){
      const result=await response.json() as {error?:{message?:string}};
      throw Error(result.error?.message||'Lernstand konnte nicht gespeichert werden ('+response.status+').');
    }
  }
  /** Read ONLY this authenticated user's moderator-assigned notice.
   * The string contents of the notice are deliberately fixed in the UI.
   */
  async readAccountNotice():Promise<AccountNotice|null>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    const url=this.documentBase()+'/accountNotices/'+encodeURIComponent(this.session.uid);
    const response=await fetchCloud(url,{headers:{Authorization:'Bearer '+await this.token()}});
    if(response.status===404)return null;
    const body=await response.json() as {
      fields?:{id?:{stringValue?:string};kind?:{stringValue?:string};active?:{booleanValue?:boolean}};
      error?:{message?:string}
    };
    if(!response.ok)throw Error(body.error?.message||'Verwarnung konnte nicht geladen werden ('+response.status+').');
    const id=body.fields?.id?.stringValue||'';
    if(body.fields?.active?.booleanValue!==true||body.fields?.kind?.stringValue!=='fairplay-warning'||
      !/^[a-z0-9][a-z0-9-]{4,79}$/.test(id))return null;
    return {id,kind:'fairplay-warning'};
  }
  /** The acknowledgement is a display preference, NOT tamperproof evidence
   * that the user actually read the warning. All enforcement is manual.
   */
  async noticeAcknowledged(id:string):Promise<boolean>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    const url=this.documentBase()+'/accountNoticeAcks/'+encodeURIComponent(this.session.uid);
    const response=await fetchCloud(url,{headers:{Authorization:'Bearer '+await this.token()}});
    if(response.status===404)return false;
    const body=await response.json() as {
      fields?:{noticeId?:{stringValue?:string}};error?:{message?:string}
    };
    if(!response.ok)throw Error(body.error?.message||'Verwarnungsstatus konnte nicht gelesen werden ('+response.status+').');
    return body.fields?.noticeId?.stringValue===id;
  }
  async acknowledgeNotice(id:string):Promise<void>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    if(!/^[a-z0-9][a-z0-9-]{4,79}$/.test(id))throw Error('Ungültige Verwarnung.');
    const url=this.documentBase()+'/accountNoticeAcks/'+encodeURIComponent(this.session.uid)+
      '?updateMask.fieldPaths=noticeId&updateMask.fieldPaths=acknowledgedAt';
    const response=await fetchCloud(url,{
      method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await this.token()},
      body:JSON.stringify({fields:{noticeId:{stringValue:id},
        acknowledgedAt:{timestampValue:new Date().toISOString()}}})
    });
    if(!response.ok){
      const body=await response.json() as {error?:{message?:string}};
      throw Error(body.error?.message||'Verwarnung konnte nicht bestätigt werden ('+response.status+').');
    }
  }
  private documentBase():string{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    return 'https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(this.settings.projectId)+
      '/databases/(default)/documents';
  }
  // The friendly players directory is NOT a ranking. No XP, coins, level,
  // total solved or numeric achievements are ever published or read here.
  // Existing /publicProfiles docs may still contain old unverified "level" fields:
  // ignore them completely and NEVER write them again.
  private friendDirectoryEndpoint():string{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    return 'https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(this.settings.projectId)+
      '/databases/(default)/documents/publicProfiles';
  }
  /** Create a missing public card or update ONLY safe social fields.
   * The default sync does not overwrite an admin-corrected public nickname.
   * Renaming intentionally via "Mein Profil" permits updating the nickname.
   */
  async publishFriendProfile(nickname:string,avatar:string,title:string,rename=false):Promise<void>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    if(!isAllowedNickname(nickname))return;
    if(!avatar||avatar.length>20||/[\u0000-\u001f\u007f]/.test(avatar))throw Error('Avatar ungültig.');
    if(!title||title.length>80||/[\u0000-\u001f\u007f]/.test(title))throw Error('Titel ungültig.');
    const url=this.friendDirectoryEndpoint()+'/'+encodeURIComponent(this.session.uid);
    const token=await this.token();
    const check=await fetchCloud(url,{headers:{Authorization:'Bearer '+token}});
    if(!check.ok&&check.status!==404){
      const error=await check.json() as {error?:{message?:string}};
      throw Error(error.error?.message||'Freundesprofil konnte nicht geprüft werden ('+check.status+').');
    }
    // With old entries, keep administrator-corrected names and custom titles.
    // Client-supplied numeric ranks never enter this document.
    const create=check.status===404;
    const fields:Record<string,{stringValue?:string;timestampValue?:string}>={
      avatar:{stringValue:avatar},
      selectedTitle:{stringValue:title},
      updatedAt:{timestampValue:new Date().toISOString()}
    };
    if(create||rename)fields['nickname']={stringValue:nickname};
    const mask=Object.keys(fields).map(key=>'updateMask.fieldPaths='+encodeURIComponent(key)).join('&');
    const response=await fetchCloud(url+'?'+mask,{
      method:'PATCH',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+await this.token()},
      body:JSON.stringify({fields})
    });
    if(!response.ok){
      const error=await response.json() as {error?:{message?:string}};
      throw Error(error.error?.message||'Freundesprofil konnte nicht gespeichert werden ('+response.status+').');
    }
  }
  async listPublicProfiles():Promise<PublicPlayer[]>{
    if(!this.session)throw Error('Bitte zuerst anmelden.');
    const players:PublicPlayer[]=[];
    let next='';
    for(let page=0;page<50;page++){
      const url=this.friendDirectoryEndpoint()+'?pageSize=100'+(next?'&pageToken='+encodeURIComponent(next):'');
      const response=await fetchCloud(url,{headers:{Authorization:'Bearer '+await this.token()}});
      const body=await response.json() as {documents?:Array<{name?:string;fields?:{
        nickname?:{stringValue?:string};avatar?:{stringValue?:string};
        title?:{stringValue?:string};selectedTitle?:{stringValue?:string};
        moderatorTitle?:{stringValue?:string}}}>;nextPageToken?:string;error?:{message?:string}};
      if(!response.ok)throw Error(body.error?.message||'Freundesliste konnte nicht geladen werden ('+response.status+').');
      for(const doc of body.documents||[]){
        const uid=doc.name?.split('/').pop()||'';
        const nickname=doc.fields?.nickname?.stringValue?.trim()||'';
        const avatar=doc.fields?.avatar?.stringValue||'🧪';
        const oldTitle=doc.fields?.title?.stringValue||'';
        const selectedTitle=doc.fields?.selectedTitle?.stringValue||'';
        const moderatorTitle=doc.fields?.moderatorTitle?.stringValue||'';
        // Preserve existing hand-assigned titles, e.g. the classmate's
        // exclusive "Cheater" title, without letting owner edits overwrite it.
        const customLegacy=oldTitle&&oldTitle.toLowerCase()==='cheater'?oldTitle:'';
        const title=moderatorTitle||customLegacy||selectedTitle||oldTitle||'Weltenentdecker';
        if(uid&&isAllowedNickname(nickname)){
          players.push({uid,nickname,avatar:avatar.length<=20?avatar:'🧪',
            title:title.length<=80?title:'Weltenentdecker'});
        }
      }
      next=body.nextPageToken||'';
      if(!next)break;
      if(page===49)throw Error('Spielerliste zu groß. Bitte erneut versuchen.');
    }
    return players.sort((a,b)=>a.nickname.localeCompare(b.nickname,'de'));
  }

}
