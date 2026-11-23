#!/usr/bin/env python3
"""Rig v2 Batch 02: exact 10 RGBA sources; fixed pivots; finger counts; joint coverage."""
from pathlib import Path
import json,hashlib,cv2,numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=Path('/mnt/data/kenny_rig_assets_v1/source/kenny-approved-master.png')
if not SOURCE.exists():
 SOURCE=Path('public/kenny/rig/v1/source/kenny-approved-master.png')
BATCH1=Path('/mnt/data/kenny-rig-v2/batch-01/manifest.json')
if not BATCH1.exists():BATCH1=Path('kenny-rig-v2/batch-01/manifest.json')
m=json.loads((ROOT/'manifest.json').read_text())
original=np.asarray(Image.open(SOURCE).convert('RGBA'))
assert original.shape==(1305,1205,4)
assert m['sourceSHA256']==hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert m['sourceSHA256']==json.loads(BATCH1.read_text())['sourceSHA256']
expected=['torso_core','neck','arm_near_upper','arm_near_forearm','hand_near',
          'arm_far_upper','arm_far_forearm','hand_far','thigh_near','thigh_far']
assert [e['id'] for e in m['files']]==expected
assert sorted(p.stem for p in ROOT.glob('*.png'))==sorted(expected)
assert m['canvas']['width']==1205 and m['canvas']['height']==1305
assert m['referenceHeadPivot']['global']==[690,433]
entries={e['id']:e for e in m['files']}
parts={}
for e in m['files']:
 f=ROOT/e['file'];i=Image.open(f);assert i.mode=='RGBA',(f,i.mode)
 assert i.size==(e['width'],e['height']) and f.stat().st_size>1000
 assert 0<=e['x']<1205 and e['x']+e['width']<=1205
 assert 0<=e['y']<1305 and e['y']+e['height']<=1305
 assert e['pivot']['local']==[e['pivot']['global'][0]-e['x'],e['pivot']['global'][1]-e['y']]
 assert hashlib.sha256(f.read_bytes()).hexdigest()==e['pngSHA256']
 arr=np.asarray(i).copy();assert arr[:,:,3].min()==0 and arr[:,:,3].max()>240
 assert ((arr[:,:,3]>240).sum()>300)
 parts[e['id']]=arr

def gray_claw_clusters(a):
 r,g,b,alpha=[a[:,:,k].astype(np.int32) for k in range(4)]
 gray=((r>65)&(r<190)&(abs(r-g)<23)&(abs(r-b)<26)&(alpha>170)).astype('uint8')*255
 k,l,stats,cent=cv2.connectedComponentsWithStats(gray,8)
 return [int(st[4]) for st in stats[1:] if st[4]>250]
for hand in ('hand_near','hand_far'):
 claws=gray_claw_clusters(parts[hand]);assert len(claws)==3,(hand,claws)

# Reconstruct layer stack in the same 1205x1305 global coordinates, using only
# actual exported PNGs + exported batch01 face pieces. No full-original image behind it.
def paste(dest,name):
 e=entries[name];l=Image.new('RGBA',(1205,1305))
 l.alpha_composite(Image.fromarray(parts[name],'RGBA'),(e['x'],e['y']))
 dest.alpha_composite(l)

skin=Image.new('RGBA',(1205,1305))
for name in m['drawOrder']:paste(skin,name)
head_meta=json.loads(BATCH1.read_text())
head_root=BATCH1.parent
for name in head_meta['poses']['open']:
 e=next(a for a in head_meta['files'] if a['id']==name)
 img=Image.open(head_root/e['file']).convert('RGBA')
 skin.alpha_composite(img,(e['x'],e['y']))

# Pivots at body parts must be non-transparent at rest; for small rotations,
# deep joint coverage is checked by the deterministic build preview as well.
alpha=np.asarray(skin)[:,:,3]
Y,X=np.ogrid[:1305,:1205]
checks={
 'near_shoulder':(703,648,15),'near_elbow':(626,748,14),'near_wrist':(732,739,12),
 'far_shoulder':(845,699,12),'far_elbow':(885,745,11),'far_wrist':(897,739,10),
 'near_hip':(486,770,23),'far_hip':(757,828,22),'neck_base':(730,620,17),
}
ratios={}
for n,(x,y,r) in checks.items():
 pix=(X-x)**2+(Y-y)**2<=r*r
 ratio=float((alpha[pix]>200).mean());ratios[n]=ratio
 assert ratio>=0.985,(n,ratio)

print('PASS: ten distinct RGBA PNGs, native geometry, manifest hashes, exactly 3 original claws/hand, 9 intact joint centers; source SHA matches Batch 01.')
for n,r in ratios.items():print(n,round(r,4))
