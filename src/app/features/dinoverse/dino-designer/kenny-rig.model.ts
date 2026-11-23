/** Kenny rig test: data-driven bones and 10 FPS poses. No game/season state is touched. */
export const KENNY_RIG_FPS = 10;
export const KENNY_RIG_BONES = [
  { id: 'root', parent: null, x: 0, y: 0 },
  { id: 'tail-base', parent: 'root', x: 252, y: 378 },
  { id: 'tail-tip', parent: 'tail-base', x: 100, y: 0 },
  { id: 'torso', parent: 'root', x: 0, y: 0 },
  { id: 'neck', parent: 'torso', x: 423, y: 323 },
  { id: 'head', parent: 'neck', x: 6, y: -127 },
  { id: 'lower-jaw', parent: 'head', x: 63, y: 37 },
  { id: 'eye', parent: 'head', x: 48, y: -42 },
  { id: 'far-arm', parent: 'torso', x: 465, y: 342 },
  { id: 'near-arm', parent: 'torso', x: 393, y: 335 },
  { id: 'far-leg', parent: 'torso', x: 417, y: 425 },
  { id: 'far-foot', parent: 'far-leg', x: 39, y: 108 },
  { id: 'near-leg', parent: 'torso', x: 307, y: 425 },
  { id: 'near-foot', parent: 'near-leg', x: -19, y: 112 },
] as const;

export type KennyRigBone = (typeof KENNY_RIG_BONES)[number]['id'];
export type KennyRigSkin = 'blue' | 'green' | 'red' | 'pink' | 'zebra';
export interface KennyRigPalette {
  body: string;
  lit: string;
  shadow: string;
  stripes: string;
  belly: string;
  bellyShadow: string;
  nail: string;
}
const PALETTES: Record<KennyRigSkin, KennyRigPalette> = {
  blue: { body:'#1678f0',lit:'#3397ff',shadow:'#1157bd',stripes:'#0a408e',belly:'#a9e9ff',bellyShadow:'#5bbce9',nail:'#52525b' },
  green: { body:'#26b963',lit:'#58e684',shadow:'#168849',stripes:'#14623f',belly:'#c2f8cc',bellyShadow:'#82dcb0',nail:'#52525b' },
  red: { body:'#ed4352',lit:'#ff7680',shadow:'#b82a3c',stripes:'#791e30',belly:'#ffe0c8',bellyShadow:'#e9a6a0',nail:'#52525b' },
  pink: { body:'#f85bb6',lit:'#ff96d7',shadow:'#cc3292',stripes:'#9c1a70',belly:'#ffe0f5',bellyShadow:'#f5a4d6',nail:'#52525b' },
  zebra: { body:'#fbfbff',lit:'#ffffff',shadow:'#c9cedc',stripes:'#101019',belly:'#f2f3f7',bellyShadow:'#cdd3dd',nail:'#565660' },
};
export const paletteForSkin = (skin: string): KennyRigPalette =>
  PALETTES[skin as KennyRigSkin] ?? PALETTES.blue;

export interface KennyRigPose {
  frame: number;
  head: number;
  jaw: number;
  tail: number;
  tailTip: number;
  nearArm: number;
  farArm: number;
  nearLeg: number;
  farLeg: number;
  neckLift: number;
  breath: number;
  blink: number;
}
export function kennyIdlePose(frame: number): KennyRigPose {
  const index = Number.isFinite(frame) ? Math.max(0, Math.floor(frame)) % 64 : 0;
  const t = index / KENNY_RIG_FPS;
  // Changes are measured in degrees or relative pixels, always around fixed bone pivots.
  const sniff = index >= 24 && index < 35 ? Math.sin(((index-24)/11)*Math.PI) : 0;
  const look = index >= 39 && index < 53 ? Math.sin(((index-39)/14)*Math.PI) : 0;
  const blink = (index >= 15 && index <= 16) || (index >= 58 && index <= 59) ? .12 : 1;
  return {
    frame:index,head: Math.sin(t*1.1)*1.8 + look*7 - sniff*4,
    jaw: Math.max(0, sniff*4),
    tail:Math.sin(t*1.8)*5,tailTip:Math.sin(t*2.1+.9)*9,
    nearArm:Math.sin(t*1.35)*3 + sniff*6,
    farArm:Math.sin(t*1.35+1.4)*2,
    nearLeg:look*2,farLeg:-look*2,
    neckLift:sniff*5 + look*3,
    breath:Math.sin(t*2.1)*2,
    blink
  };
}
export const rotateBone = (x:number,y:number,degrees:number): string =>
  `rotate(${degrees.toFixed(2)} ${x} ${y})`;
export const rigFrames = Array.from({length:64},(_,i)=>`frame-${String(i).padStart(3,'0')}.png`);
