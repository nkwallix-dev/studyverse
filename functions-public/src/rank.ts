/** Legacy XP is client-editable, so this is a provisional display level only. */
export function provisionalXp(data:unknown):number|null{
  if(!data||typeof data!=='object')return null;
  const raw=(data as Record<string,unknown>)['profile'];
  if(typeof raw!=='string')return null;
  try{
    const xp=JSON.parse(raw)?.profile?.xp;
    return Number.isSafeInteger(xp)&&xp>=0?xp:null;
  }catch{return null;}
}
export function levelFor(xp:number):number{
  return 1+Math.floor(Math.sqrt(xp/110));
}
