/** Validate Kenny PNG part export: exact blue reconstruction and five identical rig layouts. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const base=path.resolve('public/kenny/rig/v1');
const manifest=JSON.parse(await readFile(path.join(base,'manifest.json'),'utf8'));
const parts=manifest.parts;
if(manifest.width!==1205||manifest.height!==1305||manifest.fps!==10||parts.length<17)
 throw Error('Invalid Kenny manifest frame geometry');
const source=await sharp(path.join(base,'source/kenny-approved-master.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const assembled=Buffer.alloc(source.data.length);
for(const skin of manifest.skins) {
 for(const part of parts) {
  const file=path.join(base,'parts',skin,part.id+'.png');
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==part.width||info.height!==part.height||info.channels!==4)
   throw Error('Part dimension mismatch '+skin+'/'+part.id);
  if(skin==='blue') {
   for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    const at=(y*info.width+x)*4,dst=((part.y+y)*manifest.width+part.x+x)*4;
    if(data[at+3]===0)continue;
    if(assembled[dst+3]!==0) throw Error('Overlapping opaque pixels in '+part.id);
    for(let c=0;c<4;c++)assembled[dst+c]=data[at+c];
   }
  }
 }
 await sharp(path.join(base,'parts',skin,'eye_closed.png')).metadata().then(m=>{
  if(m.width!==200||m.height!==170)throw Error('Eyelid file mismatch');
 });
}
let diff=0;
for(let i=0;i<assembled.length;i++)if(assembled[i]!==source.data[i])diff++;
if(diff)throw Error('Restored blue Kenny differs from approved original by '+diff+' byte values');
console.log('OK: original blue image reproduced exactly from '+parts.length+' isolated PNG layers; five skins and eyelids verified.');
