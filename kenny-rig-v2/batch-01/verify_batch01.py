#!/usr/bin/env python3
"""Quality gate for Kenny 10 independent RGBA face assets, no game imports."""
import json, hashlib, os
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent
p=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
expected=['head_upper','eye_near_open','eye_near_closed','eye_far_open',
          'eye_far_closed','jaw_lower_open','jaw_lower_closed','mouth_cavity',
          'upper_teeth','lower_teeth']
assert p['canvas']=={'width':1205,'height':1305,'coordinateSystem':'pixels, top-left origin'}
assert [x['id'] for x in p['files']]==expected, 'Must have exactly ten named face layers'
assert p['joint']['pivotGlobal']==[771,376]
ref=Path(os.getenv('KENNY_MASTER_PATH',str(root.parents[1]/'public/kenny/rig/v1/source/kenny-approved-master.png')))
if not ref.exists(): ref=Path('/mnt/data/kenny_rig_assets_v1/source/kenny-approved-master.png')
assert hashlib.sha256(ref.read_bytes()).hexdigest()==p['sourceSHA256'], 'Wrong master reference'
source=np.array(Image.open(ref).convert('RGBA'),dtype=np.int16)
assert source.shape==(1305,1205,4)

def count(rgb,kind):
 r,g,b,a=[rgb[:,:,i].astype(np.int32) for i in range(4)]
 m=a>150
 if kind=='yellow':return int(((r>160)&(g>80)&(g>b*1.25)&(b<150)&m).sum())
 if kind=='pink':return int(((r>120)&(r>g*1.35)&(r>b*1.35)&m).sum())
 if kind=='white':return int(((r>190)&(g>190)&(b>182)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<40)&m).sum())
 raise ValueError(kind)

layers={}
for part in p['files']:
 path=root/part['file']
 assert path.is_file(),f'Missing independent asset: {path}'
 assert hashlib.sha256(path.read_bytes()).hexdigest()==part['pngSHA256']
 image=Image.open(path)
 assert image.format=='PNG' and image.mode=='RGBA' and image.size==(part['width'],part['height'])
 arr=np.array(image)
 assert arr[:,:,3].max()>200 and np.count_nonzero(arr[:,:,3]>150)>200
 assert np.count_nonzero(arr[:,:,3]==0)>0, f'Not transparent: {path}'
 assert 0<=part['x']<1205 and 0<=part['y']<1305
 assert part['x']+part['width']<=1205 and part['y']+part['height']<=1305
 assert part['pivot']['local']==[part['pivot']['global'][0]-part['x'],part['pivot']['global'][1]-part['y']]
 layers[part['id']]=image.convert('RGBA')

for name in ['head_upper','eye_near_closed','eye_far_closed','jaw_lower_closed']:
 assert count(np.array(layers[name]),'yellow')==0, f'Unwanted eye artwork baked into {name}'
for kind in ['pink','white']:
 assert count(np.array(layers['jaw_lower_closed']),kind)==0,f'Closed lower jaw contains {kind} pixels'
assert count(np.array(layers['mouth_cavity']),'pink')>5000
assert count(np.array(layers['upper_teeth']),'white')>1000
assert count(np.array(layers['lower_teeth']),'white')>500
assert count(np.array(layers['eye_near_open']),'yellow')>8000
assert count(np.array(layers['eye_far_open']),'yellow')>400

# Recompose from actual exported files (not from the in-memory masks).
def render(names):
 out=Image.new('RGBA',(1205,1305))
 for name in names:
  part=next(e for e in p['files'] if e['id']==name)
  out.alpha_composite(layers[name],(part['x'],part['y']))
 return np.asarray(out,dtype=np.int16)
opened=render(p['poses']['open']);closed=render(p['poses']['closed'])
for box,limit in [((700,180,930,360),2),((990,150,1090,270),2),((800,350,1130,560),3)]:
 x0,y0,x1,y1=box
 m=(source[y0:y1,x0:x1,3]>150)&(opened[y0:y1,x0:x1,3]>150)
 mae=np.abs(source[y0:y1,x0:x1,:3][m]-opened[y0:y1,x0:x1,:3][m]).mean()
 assert mae<limit,f'Open face no longer matches approved source in {box}: MAE {mae}'
# Closed mouth may have light blue/black but must not show tongue or original teeth.
reg=closed[365:550,800:1180]
assert count(reg,'pink')==0 and count(reg,'white')==0, 'Closed pose leaks teeth/tongue'
for img in ['preview-comparison.png','preview-in-context.png','preview-10-parts.png']:
 assert Image.open(root/img).size[0]>=1000
print(f'PASS – {len(expected)} independent RGBA PNGs, master SHA verified, face composited and both mouth states validated.')
