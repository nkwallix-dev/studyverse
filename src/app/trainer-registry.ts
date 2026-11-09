export interface AchievementDef {
  id: string; icon: string; title: string; description: string;
  metric: 'quiz'|'draw'|'reaction'|'flash'|'learn'|'combo'|'boss'|'purchase';
  target: number; reward: number;
}
export interface TrainerDef {
  id: string; subjectId: string; title: string; subtitle: string;
  path: string; saveKey: string; examDate?: string;
  achievements: AchievementDef[];
}
/** Add one entry for each new test. XP/coins are synced per trainer, not per subject. */
export const TRAINERS: TrainerDef[] = [
  {
    id:'nawi-test-01',subjectId:'nawi',title:'Chemverse 1. Test',
    subtitle:'Chemie · Lernakademie, Quiz, Formeln & Bosskampf',
    path:'nawi/test-01/index.html',saveKey:'chemverse_niklas_v1',examDate:'2026-11-10',
    achievements:[
      {id:'first',icon:'🧪',title:'Erste Reaktion',description:'Erste richtige Quizantwort',metric:'quiz',target:1,reward:250},
      {id:'quiz10',icon:'🧠',title:'Neuronendetonation',description:'10 verschiedene Quizfragen gemeistert',metric:'quiz',target:10,reward:320},
      {id:'quiz30',icon:'⚡',title:'Wissensmaschine',description:'30 verschiedene Quizfragen gemeistert',metric:'quiz',target:30,reward:480},
      {id:'combo5',icon:'🔥',title:'Auf einem Lauf',description:'5 Antworten hintereinander korrekt',metric:'combo',target:5,reward:250},
      {id:'draw1',icon:'✍️',title:'Kohlenstoffartist',description:'Erste Zeichenaufgabe gelöst',metric:'draw',target:1,reward:180},
      {id:'draw5',icon:'🎨',title:'Struktur-Zauberer',description:'5 Zeichenaufgaben gelöst',metric:'draw',target:5,reward:320},
      {id:'react5',icon:'💥',title:'Reaktionsmeister',description:'5 Reaktionsaufgaben gelöst',metric:'reaction',target:5,reward:350},
      {id:'flash10',icon:'📇',title:'Kartei-King',description:'10 Karten gewusst',metric:'flash',target:10,reward:300},
      {id:'learn7',icon:'📘',title:'Halbzeit',description:'7 Stoffkapitel abgeschlossen',metric:'learn',target:7,reward:420},
      {id:'learn14',icon:'🎓',title:'Alles gesehen',description:'13 Pflichtkapitel abgeschlossen',metric:'learn',target:13,reward:800},
      {id:'boss',icon:'👑',title:'Boss zerlegt',description:'Mindestens 80 % im Bosskampf',metric:'boss',target:80,reward:1000}
    ]
  }
];

function object(v:unknown):Record<string,unknown>{return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};}
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,v):0;
export function achievementValue(a:AchievementDef,save:unknown):number{
 const s=object(save),solved=object(s['solved']);
 switch(a.metric){
  case 'quiz':return Object.keys(solved).filter(k=>k.startsWith('q')).length;
  case 'draw':return Object.keys(solved).filter(k=>k.startsWith('d')).length;
  case 'reaction':return Object.keys(solved).filter(k=>k.startsWith('r')).length;
  case 'flash':return Object.values(object(s['cards'])).filter(v=>number(v)>=1).length;
  case 'learn':return Object.keys(object(s['learned'])).filter(k=>k!=='orb').length;
  case 'combo':return number(s['maxCombo']);
  case 'boss':return number(s['bestBoss']);
  case 'purchase':return Object.keys(object(s['purchased'])).length;
 }
}
