/**
 * Kenny master artwork -> transparent, individually cropped PNG layers.
 * One approved master, one set of regions, deterministic five-skin export.
 * Does not modify the source images, Firestore, shop, physics, or other verses.
 * Run: node scripts/kenny/build-parts-from-master.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const base = path.resolve('public/kenny/rig/v1');
const input = path.join(base, 'source/kenny-approved-master.png');
const sourceSheet = path.join(base, 'source/kenny-part1-source.png');
const { data: master, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
if (W !== 1205 || H !== 1305 || info.channels !== 4)
  throw new Error('Master dimension/alpha mismatch; do not crop by guessed coordinates');

const regions = [
  { id:'eye_open', pivot:[800,268], poly:[[706,220],[761,198],[823,199],[876,231],[885,295],[860,339],[799,355],[729,335],[700,281]] },
  { id:'jaw_lower', pivot:[756,380], poly:[[654,355],[750,360],[802,380],[904,387],[978,384],[999,415],[996,457],[1017,528],[1008,571],[957,579],[880,541],[776,494],[694,439],[646,391]] },
  { id:'head_upper', pivot:[699,437], poly:[[535,512],[546,298],[603,194],[697,119],[780,105],[881,132],[1017,129],[1135,266],[1151,338],[1123,385],[1057,404],[972,395],[884,384],[797,373],[734,357],[669,395],[625,471]] },
  { id:'hand_far', pivot:[896,716], poly:[[866,680],[938,678],[994,711],[1039,741],[1053,799],[1023,838],[905,846],[870,804]] },
  { id:'arm_far', pivot:[849,690], poly:[[806,668],[891,661],[948,687],[967,736],[927,772],[852,772],[813,744]] },
  { id:'hand_near', pivot:[724,723], poly:[[695,690],[768,684],[833,721],[869,753],[863,842],[743,868],[708,821],[682,772]] },
  { id:'arm_near', pivot:[631,682], poly:[[591,603],[695,604],[743,659],[766,721],[718,766],[648,787],[580,735]] },
  { id:'foot_near', pivot:[396,1086], poly:[[272,1076],[353,1062],[428,1070],[507,1091],[545,1146],[539,1206],[280,1214],[269,1144]] },
  { id:'shin_near', pivot:[397,955], poly:[[331,915],[460,915],[497,996],[475,1090],[437,1140],[313,1112],[295,1055]] },
  { id:'thigh_near', pivot:[495,842], poly:[[407,700],[595,700],[650,794],[647,885],[568,965],[441,1010],[397,963],[420,862]] },
  { id:'foot_far', pivot:[777,1069], poly:[[676,1053],[820,1048],[943,1054],[992,1112],[981,1194],[705,1186],[687,1123]] },
  { id:'shin_far', pivot:[734,958], poly:[[651,930],[798,916],[842,981],[821,1081],[695,1126],[654,1028]] },
  { id:'thigh_far', pivot:[778,853], poly:[[688,785],[851,781],[890,870],[866,954],[801,995],[659,982],[664,870]] },
  { id:'neck', pivot:[729,623], poly:[[624,435],[703,422],[756,471],[784,556],[820,613],[851,650],[884,734],[860,781],[811,806],[740,722],[691,620],[633,537]] },
  { id:'tail_tip', pivot:[197,552], poly:[[10,469],[214,483],[226,589],[93,575],[10,546]] },
  { id:'tail_mid', pivot:[396,658], poly:[[184,480],[417,532],[458,722],[277,711],[196,610]] },
  { id:'tail_base', pivot:[584,704], poly:[[390,565],[671,574],[686,795],[507,897],[408,840],[378,703]] },
];

function pointInside(x,y,points) {
  let inside = false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i],b=points[j];
    if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) inside=!inside;
  }
  return inside;
}
const owner = new Uint8Array(W*H).fill(255);
const boxes = [];
for(let k=0;k<regions.length;k++) {
  const pts=regions[k].poly;
  const minX=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[0]))));
  const maxX=Math.min(W-1,Math.ceil(Math.max(...pts.map(p=>p[0]))));
  const minY=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1]))));
  const maxY=Math.min(H-1,Math.ceil(Math.max(...pts.map(p=>p[1]))));
  for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++){
    const p=y*W+x;
    if(owner[p]===255 && master[p*4+3] && pointInside(x+.5,y+.5,pts)) owner[p]=k;
  }
}
const coreIndex = regions.length;
for(let p=0;p<owner.length;p++) if(owner[p]===255 && master[p*4+3]) owner[p]=coreIndex;
const allRegions=[...regions,{id:'torso_core',pivot:[613,756],poly:null}];
for(let k=0;k<allRegions.length;k++) {
  let x0=W,y0=H,x1=-1,y1=-1;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
    if(owner[y*W+x]===k) {
      if(x<x0)x0=x;if(x>x1)x1=x;
      if(y<y0)y0=y;if(y>y1)y1=y;
    }
  }
  if(x1<0) throw Error('Empty layer '+allRegions[k].id);
  x0=Math.max(0,x0-6);y0=Math.max(0,y0-6);
  x1=Math.min(W-1,x1+6);y1=Math.min(H-1,y1+6);
  boxes[k]={ x:x0,y:y0,width:x1-x0+1,height:y1-y0+1 };
}
function toHSV(r,g,b) {
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),dif=max-min;
  let h=0;
  if(dif) {
    if(max===r)h=((g-b)/dif+6)%6;
    else if(max===g)h=(b-r)/dif+2;
    else h=(r-g)/dif+4;
    h*=60;
  }
  return {h,s:max?dif/max:0,v:max};
}
function fromHSV(h,s,v) {
  const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
  let a,b,d;
  if(h<60)[a,b,d]=[c,x,0];
  else if(h<120)[a,b,d]=[x,c,0];
  else if(h<180)[a,b,d]=[0,c,x];
  else if(h<240)[a,b,d]=[0,x,c];
  else if(h<300)[a,b,d]=[x,0,c];
  else [a,b,d]=[c,0,x];
  return [Math.round((a+m)*255),Math.round((b+m)*255),Math.round((d+m)*255)];
}
const presets={
  blue:null,
  green:{body:145,belly:141},
  red:{body:0,belly:11},
  pink:{body:318,belly:319},
  white:{body:null,belly:null},
};
function recolor(skin) {
  if(skin==='blue')return Buffer.from(master);
  const output=Buffer.from(master);
  for(let p=0;p<W*H;p++){
    const at=p*4;
    if(!output[at+3])continue;
    const r=master[at],g=master[at+1],b=master[at+2];
    const {h,s,v}=toHSV(r,g,b);
    const blue=(h>=204.7&&h<=230.1&&s>135/255&&v>60/255);
    const cyan=(h>=177.8&&h<204.7&&s>=30/255&&s<150/255&&v>140/255);
    if(!blue&&!cyan)continue;
    const stripe=blue&&v<165/255&&r<60&&g<155;
    let rgb;
    if(skin==='white'){
      if(stripe){const grey=Math.max(7,Math.min(34,10+(v*255-80)*.05));rgb=[grey,grey,grey];}
      else if(blue){const value=Math.max(190,Math.min(255,227+(v*255-160)*.23));rgb=[value,value,value];}
      else {const value=Math.max(224,Math.min(255,248+(v*255-180)*.1));rgb=[value,value,value];}
    } else if(blue){
      rgb=fromHSV(presets[skin].body,stripe?Math.max(s,170/255):s*.98,v);
    } else {
      rgb=fromHSV(presets[skin].belly,60/255,Math.min(1,v*1.01));
    }
    output[at]=Math.round(rgb[0]);output[at+1]=Math.round(rgb[1]);output[at+2]=Math.round(rgb[2]);
  }
  return output;
}
const skinIds=Object.keys(presets);
for(const skin of skinIds) {
  const color=recolor(skin);
  const outDir=path.join(base,'parts',skin);
  await mkdir(outDir,{recursive:true});
  for(let k=0;k<allRegions.length;k++){
    const b=boxes[k],buf=Buffer.alloc(b.width*b.height*4);
    for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){
      const source=(b.y+y)*W+b.x+x;
      if(owner[source]!==k)continue;
      const from=source*4,to=(y*b.width+x)*4;
      buf[to]=color[from];buf[to+1]=color[from+1];buf[to+2]=color[from+2];buf[to+3]=color[from+3];
    }
    await sharp(buf,{raw:{width:b.width,height:b.height,channels:4}}).png({compressionLevel:9}).toFile(path.join(outDir,allRegions[k].id+'.png'));
  }
  // Narrow backpaint around the articulated joints. Only revealed by tiny rotations,
  // never replaces the 18 exclusive, pixel-exact base layers.
  const seams=[
    [699,437,87],[756,380,62],[729,623,78],
    [584,704,74],[396,658,68],[197,552,49],
    [631,682,72],[724,723,62],[849,690,65],[896,716,58]
  ];
  const backing=Buffer.alloc(W*H*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    let coverage=0;
    for(const [cx,cy,radius] of seams){
      const dist=Math.hypot(x-cx,y-cy);
      if(dist<=radius){
        coverage=Math.max(coverage,Math.min(1,(radius-dist)/7));
      }
    }
    if(!coverage)continue;
    const at=(y*W+x)*4;
    backing[at]=color[at];backing[at+1]=color[at+1];backing[at+2]=color[at+2];
    backing[at+3]=Math.round(color[at+3]*coverage);
  }
  await sharp(backing,{raw:{width:W,height:H,channels:4}}).png({compressionLevel:9}).toFile(path.join(outDir,'seam_underlay.png'));
  // Dedicated eyelid sprite: always covers the eye, no old eye remaining underneath.
  const blue=presets[skin]?.body;
  const lidColor=skin==='blue'?'#187bf0':skin==='green'?'#31ba69':skin==='red'?'#ec4553':skin==='pink'?'#fa5cbd':'#f7f7fb';
  const lidSvg='<svg width="200" height="170" xmlns="http://www.w3.org/2000/svg"><path d="M11 94 Q22 20 106 19 Q179 22 190 92 Q154 145 98 148 Q39 142 11 94Z" fill="'+lidColor+'" stroke="#0b111a" stroke-width="7"/><path d="M25 97 Q96 139 174 96" fill="none" stroke="#0b111a" stroke-width="9" stroke-linecap="round"/><path d="M35 80 Q102 99 165 75" fill="none" stroke="#1260a0" stroke-width="3" opacity=".26"/></svg>';
  await sharp(Buffer.from(lidSvg)).png().toFile(path.join(outDir,'eye_closed.png'));
}
const manifest={
  version:1,source:'approved-kenny-master',width:W,height:H,fps:10,
  skins:skinIds,skinAlias:{zebra:'white'},
  parts:allRegions.map((region,index)=>({id:region.id,...boxes[index],pivotX:region.pivot[0],pivotY:region.pivot[1]})),
  extraParts:[{id:'eye_closed',x:694,y:192,width:200,height:170,pivotX:800,pivotY:268}],
  note:'All parts originate from one approved master PNG; generated Part 1 source remains reference-only. At rest the non-overlapping layers reconstruct the original pixels.'
};
await writeFile(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');

// Preserve the experimental image-generated pieces as separate optional reference assets.
const generatedNames=['torso','neck','head_upper','lower_jaw','tail_base','tail_mid','tail_tip','hip_patch'];
const sheet=await sharp(sourceSheet).ensureAlpha().metadata();
const sheetOut=path.join(base,'part1-generated');
await mkdir(sheetOut,{recursive:true});
for(let index=0;index<8;index++){
  const col=index%4,row=Math.floor(index/4),x0=Math.round(col*sheet.width/4),
    x1=Math.round((col+1)*sheet.width/4),y0=Math.round(row*sheet.height/2),
    y1=Math.round((row+1)*sheet.height/2);
  await sharp(sourceSheet).extract({left:x0,top:y0,width:x1-x0,height:y1-y0}).png().toFile(path.join(sheetOut,generatedNames[index]+'.png'));
}
console.log('Kenny rig PNG parts built: '+skinIds.length+' skins × '+(allRegions.length+1)+' files; '+generatedNames.length+' generated art references');
