export interface AchievementDef {
  id: string; icon: string; title: string; description: string;
  metric: 'quiz'|'draw'|'reaction'|'flash'|'learn'|'combo'|'boss'|'purchase'|'sorter'|'pipeline'|'forecast';
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
    id:'maths-hw-02',subjectId:'mat',title:'MathsVerse · 2. Hausübungswiederholung',
    subtitle:'18 Buchteilaufgaben · 4 ausführliche Lernkapitel · erklärte Musterlösungen',
    path:'maths/hw-02/index.html',saveKey:'mathsverse_hw02_v1',examDate:'2026-11-12',
    achievements:[
      {id:'academy',icon:'📚',title:'Alle Mathekapitel durchgearbeitet',description:'Alle vier ausführlichen Lernkapitel gelesen',metric:'learn',target:4,reward:250}
    ]
  },
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
  },
  {
    id:'dsai-test-01',subjectId:'dsai',title:'Dsaiverse 1. Test',
    subtitle:'Data Science & AI · 16 Lektionen, 106 Fragen, Code-Detective, Data-Sorter & Boss',
    path:'dsai/test-01/index.html',saveKey:'dsai_studyverse_v1',
    achievements:[
      {id:'first',icon:'🤖',title:'Boot Sequence',description:'Erste Quizfrage richtig beantwortet',metric:'quiz',target:1,reward:170},
      {id:'quiz20',icon:'⚡',title:'Data Explorer',description:'20 Quizfragen gemeistert',metric:'quiz',target:20,reward:300},
      {id:'quiz60',icon:'🧠',title:'Neural Overdrive',description:'60 Quizfragen gemeistert',metric:'quiz',target:60,reward:450},
      {id:'code1',icon:'🧩',title:'Hello, Output!',description:'Ersten Code-Schnipsel verstanden',metric:'draw',target:1,reward:180},
      {id:'code12',icon:'🐍',title:'Python Whisperer',description:'12 Code-Schnipsel verstanden',metric:'draw',target:12,reward:380},
      {id:'sorter12',icon:'🗂️',title:'Data Curator',description:'12 Datensortierungen gemeistert',metric:'sorter',target:12,reward:300},
      {id:'pipeline3',icon:'🧭',title:'Process Architect',description:'Alle Prozess-Puzzles abgeschlossen',metric:'pipeline',target:3,reward:360},
      {id:'forecast6',icon:'📈',title:'Predictive Mind',description:'6 Festival-Prognosen gelöst',metric:'forecast',target:6,reward:300},
      {id:'learn8',icon:'📚',title:'Halfway to AI',description:'8 Lektionen abgeschlossen',metric:'learn',target:8,reward:350},
      {id:'learn16',icon:'🎓',title:'DSAI Scholar',description:'Alle 16 Lektionen abgeschlossen',metric:'learn',target:16,reward:650},
      {id:'combo8',icon:'🔥',title:'No Miss Streak',description:'8 richtige Antworten in Folge',metric:'combo',target:8,reward:240},
      {id:'boss',icon:'👑',title:'Artificial Legend',description:'Mindestens 80 % im AI-Bosskampf',metric:'boss',target:80,reward:800}
    ]
  },
  {
    id:'pos-pa-01',subjectId:'pos',title:'Sharpverse 1. PA',
    subtitle:'C# · 20 Lektionen · 44 Code- und Transferfragen · 8 Schreibaufgaben · Threading-Labor & Boss',
    path:'pos/pa-01/index.html',saveKey:'sharpverse_pa01_v1',
    achievements:[
      {id:'hello',icon:'♯',title:'Hello, Sharpverse!',description:'Erste praktische Codefrage gemeistert',metric:'draw',target:1,reward:180},
      {id:'code10',icon:'🧩',title:'Syntax-Tamer',description:'10 Code-/Transferaufgaben gemeistert',metric:'draw',target:10,reward:280},
      {id:'code25',icon:'🧠',title:'Concurrency Mind',description:'25 Code-/Transferaufgaben gemeistert',metric:'draw',target:25,reward:430},
      {id:'code44',icon:'🚀',title:'PA-Vorbereitungsmaschine',description:'Alle 44 Code-/Transferaufgaben gemeistert',metric:'draw',target:44,reward:700},
      {id:'write1',icon:'✍️',title:'Erster echter C#-Satz',description:'Erste C#-Schreibübung geschafft',metric:'pipeline',target:1,reward:180},
      {id:'write8',icon:'⌨️',title:'Schreibmaschinen-Modus',description:'Alle acht C#-Schreibaufgaben gemeistert',metric:'pipeline',target:8,reward:400},
      {id:'learn5',icon:'📘',title:'Fundament gegossen',description:'Fünf Grundlagenlektionen abgeschlossen',metric:'learn',target:5,reward:240},
      {id:'learn12',icon:'🧵',title:'Thread-Flüsterer',description:'Zwölf Lektionen abgeschlossen',metric:'learn',target:12,reward:430},
      {id:'learn20',icon:'🎓',title:'Sharp Scholar',description:'Alle 20 Lernlektionen abgeschlossen',metric:'learn',target:20,reward:710},
      {id:'combo6',icon:'🔥',title:'No Data Race',description:'Sechs richtige Antworten in Folge',metric:'combo',target:6,reward:260},
      {id:'boss80',icon:'👾',title:'PA überlebt',description:'Mindestens 80 % im PA-Bosskampf',metric:'boss',target:80,reward:680},
      {id:'boss100',icon:'👑',title:'Spermanns Albtraum',description:'100 % im PA-Bosskampf',metric:'boss',target:100,reward:1100}
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
  case 'sorter':return Object.keys(solved).filter(k=>k.startsWith('s')).length;
  case 'pipeline':return Object.keys(solved).filter(k=>k.startsWith('p')).length;
  case 'forecast':return Object.keys(solved).filter(k=>k.startsWith('f')).length;
  case 'flash':return Object.values(object(s['cards'])).filter(v=>number(v)>=1).length;
  case 'learn':return Object.keys(object(s['learned'])).filter(k=>k!=='orb').length;
  case 'combo':return number(s['maxCombo']);
  case 'boss':return number(s['bestBoss']);
  case 'purchase':return Object.keys(object(s['purchased'])).length;
 }
}
