import type {ShopItem} from './shop-items';

export const KENNY_SEASON={
  id:'kenny-2026',name:'Kenny',price:300,
  start:Date.parse('2026-11-14T00:00:00+01:00'),
  end:Date.parse('2027-01-14T00:00:00+01:00')
} as const;
export const KENNY_THRESHOLDS=[0,3,8,15,25] as const;
export type DinoTier='small'|'medium'|'large'|'event'|'token250'|'token500'|'token1000';
export const KENNY_ODDS:ReadonlyArray<Readonly<Record<DinoTier,number>>>=[
  {small:32,medium:22,large:5,event:5,token250:22,token500:10,token1000:4},
  {small:30,medium:23,large:6,event:6,token250:21,token500:10,token1000:4},
  {small:28,medium:24,large:7,event:7,token250:20,token500:10,token1000:4},
  {small:25,medium:25,large:8,event:8,token250:19,token500:10,token1000:5},
  {small:23,medium:26,large:9,event:9,token250:18,token500:10,token1000:5}
];
export const KENNY_EVENT_ITEMS:ShopItem[]=[
  {id:'kenny_volcano_banner',kind:'banner',icon:'🌋',name:'Kennys Urzeit',cost:0,desc:'Vulkan und Urzeitlandschaft – nur in Kennys Season.',group:'banner',equip:'kenny_volcano',drop:KENNY_SEASON.id},
  {id:'kenny_avatar',kind:'avatar',icon:'🦖',name:'Kenny',cost:0,desc:'Der blaue Raptor als dein Avatar.',group:'avatar',drop:KENNY_SEASON.id},
  {id:'kenny_pangea_title',kind:'title',icon:'🦕',name:'Hat Pangea überlebt',cost:0,desc:'Kennys exklusiver Titel. Pangea hatte keine Chance.',group:'title',drop:KENNY_SEASON.id},
  {id:'kenny_skin_pink',kind:'dinoSkin',icon:'🩷',name:'Kenny Pink',cost:0,desc:'Rosa Look für Kenny.',group:'dinoSkin',equip:'pink',drop:KENNY_SEASON.id},
  {id:'kenny_skin_green',kind:'dinoSkin',icon:'💚',name:'Kenny Grün',cost:0,desc:'Grüner Look für Kenny.',group:'dinoSkin',equip:'green',drop:KENNY_SEASON.id},
  {id:'kenny_skin_red',kind:'dinoSkin',icon:'❤️',name:'Kenny Rot',cost:0,desc:'Roter Look für Kenny.',group:'dinoSkin',equip:'red',drop:KENNY_SEASON.id}
];
export const KENNY_FINALE_ITEM:ShopItem={
  id:'kenny_fossil_frame',kind:'frame',icon:'🦴',name:'Urzeit-Fossilrahmen',cost:0,
  desc:'Exklusiv für Kenny auf Level 5 bis zum Saisonende.',group:'frame',equip:'kenny_fossil',drop:KENNY_SEASON.id
};
export const KENNY_ITEMS=[...KENNY_EVENT_ITEMS,KENNY_FINALE_ITEM];

export interface DinoSeasonState {
  feeds:number;overfeeds:number;overTokenWins:number;skin:'blue'|'pink'|'green'|'red';
  settled:boolean;settlement:number;
}
export const freshDinoState=():DinoSeasonState=>({feeds:0,overfeeds:0,overTokenWins:0,skin:'blue',settled:false,settlement:0});
const count=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0?Number(value):0;
export function normalizeDinoState(value:unknown):DinoSeasonState{
  if(!value||typeof value!=='object'||Array.isArray(value))return freshDinoState();
  const data=value as Record<string,unknown>;
  const feeds=count(data['feeds']);
  const skin=['blue','pink','green','red'].includes(String(data['skin']))?data['skin'] as DinoSeasonState['skin']:'blue';
  return {feeds,overfeeds:Math.min(count(data['overfeeds']),Math.max(0,feeds-25)),
    overTokenWins:count(data['overTokenWins']),skin,settled:data['settled']===true,
    settlement:count(data['settlement'])};
}
export function dinoLevel(feeds:number):number{
  for(let level=5;level>=2;level--)if(feeds>=KENNY_THRESHOLDS[level-1])return level;
  return 1;
}
export function nextDinoLevel(feeds:number):number{return KENNY_THRESHOLDS[Math.min(4,dinoLevel(feeds))];}
export function isKennyActive(now:number):boolean{return now>=KENNY_SEASON.start&&now<KENNY_SEASON.end;}
export function cashbackDue(state:DinoSeasonState):number{
  return Math.floor(Math.max(0,state.overfeeds*KENNY_SEASON.price-state.overTokenWins)/2);
}
export function kennyCountdown(now:number):string{
  if(now>=KENNY_SEASON.end)return 'Season beendet';
  const minutes=Math.ceil((KENNY_SEASON.end-now)/60000);
  const days=Math.floor(minutes/1440),hours=Math.floor((minutes%1440)/60);
  return days?`${days} Tage · ${hours} Std.`:`${hours} Std. · ${minutes%60} Min.`;
}
export function eligibleDinoItems(items:ShopItem[],owned:Set<string>):Record<'small'|'medium'|'large'|'event',ShopItem[]>{
  const regular=items.filter(item=>item.drop!=='global'&&item.drop!==KENNY_SEASON.id
    &&!(item.group==='title'&&item.requirement?.metric==='boss'&&item.requirement.value===100));
  // Perfect-boss professor titles are deliberately never in Kenny's pool.
  const learn=regular.filter(item=>!owned.has(item.id));
  return {small:learn.filter(item=>item.cost<=300),
    medium:learn.filter(item=>item.cost>300&&item.cost<=800),
    large:learn.filter(item=>item.cost>800),
    event:KENNY_EVENT_ITEMS.filter(item=>!owned.has(item.id))};
}
export function actualDinoOdds(level:number,pools:ReturnType<typeof eligibleDinoItems>):Record<DinoTier,number>{
  const base=KENNY_ODDS[Math.max(0,Math.min(4,level-1))];
  const odds={...base};
  const itemTiers=['small','medium','large','event'] as const;
  const missing=itemTiers.reduce((n,tier)=>n+(pools[tier].length?0:odds[tier]),0);
  const available=itemTiers.reduce((n,tier)=>n+(pools[tier].length?odds[tier]:0),0);
  for(const tier of itemTiers){
    odds[tier]=pools[tier].length?odds[tier]+(available?missing*odds[tier]/available:0):0;
  }
  return odds;
}
export type DinoDrop={tier:DinoTier;tokens:number;item?:ShopItem};
/** Both draws use independent cryptographic random values supplied by the caller. */
export function drawDinoReward(level:number,pools:ReturnType<typeof eligibleDinoItems>,random:()=>number):DinoDrop{
  if(!Object.values(pools).some(items=>items.length))throw Error('Der Dino-Pool ist bereits komplett eingesammelt.');
  const odds=actualDinoOdds(level,pools);
  let roll=random()*100;
  for(const tier of Object.keys(odds) as DinoTier[]){
    roll-=odds[tier];
    if(roll>=0)continue;
    if(tier.startsWith('token'))return {tier,tokens:Number(tier.slice(5))};
    const choices=pools[tier as keyof typeof pools];
    return {tier,tokens:0,item:choices[Math.floor(random()*choices.length)]};
  }
  // Only floating-point rounding can reach this branch.
  return {tier:'token250',tokens:250};
}
export function settleDinoSeason(state:DinoSeasonState,now:number):{state:DinoSeasonState;tokens:number;item?:ShopItem}|null{
  if(now<KENNY_SEASON.end||state.settled)return null;
  const tokens=cashbackDue(state);
  return {state:{...state,settled:true,settlement:tokens},tokens,
    item:dinoLevel(state.feeds)===5?KENNY_FINALE_ITEM:undefined};
}
