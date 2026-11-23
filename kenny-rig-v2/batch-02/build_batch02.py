#!/usr/bin/env python3
"""Kenny 2D cutout v2 batch 02 – body & limbs.
Original 1205x1305 Kenny pixels, spline-masked surfaces and backpainted hidden sockets.
No new stripes/scales, no changes to the runtime assets.  Outputs exactly ten PNG parts.
"""
from pathlib import Path
import os, json, hashlib, sys
import numpy as np
import cv2
from PIL import Image,ImageDraw,ImageFont
from scipy.interpolate import splprep,splev

ROOT=Path(__file__).resolve().parent
SOURCE=Path(os.environ.get('KENNY_MASTER_PATH', str(ROOT.parents[1]/'public/kenny/rig/v1/source/kenny-approved-master.png')))
if not SOURCE.exists(): SOURCE=Path('/mnt/data/kenny_rig_assets_v1/source/kenny-approved-master.png')
BATCH1=ROOT.parent/'batch-01'
master=np.array(Image.open(SOURCE).convert('RGBA'))
H,W=master.shape[:2];assert (W,H)==(1205,1305)
A=master[:,:,3].astype(np.float32)/255

# Curve-based outlines; control points measured against approved source drawing.
# Adjacent sections overlap IN THE BLUE FILL, never through duplicated ink strokes.
# The system uses RGBA PNGs, not polygon-shaped sprite bounding rectangles.
paths={
 'torso_core':[(445,694),(474,661),(517,643),(577,621),(635,598),(669,603),(722,615),(788,650),(840,708),(852,779),(842,824),(803,869),(746,909),(702,930),(638,928),(565,905),(506,878),(462,839),(440,788)],
 'neck':[(634,456),(667,429),(710,430),(773,465),(800,518),(811,584),(846,646),(861,713),(837,765),(798,769),(763,731),(718,659),(661,614),(631,556)],
 'arm_near_upper':[(716,609),(727,616),(745,647),(741,677),(717,706),(690,727),(654,752),(626,774),(604,760),(594,739),(606,707),(634,672),(665,632),(698,615)],
 'arm_near_forearm':[(622,726),(646,711),(679,709),(708,704),(738,701),(769,713),(796,742),(795,773),(761,793),(719,783),(673,782),(642,796),(614,782),(607,759)],
 'hand_near':[(712,734),(735,704),(770,694),(805,716),(828,740),(846,767),(860,798),(858,830),(839,851),(811,854),(779,858),(745,859),(717,839),(711,811),(720,791)],
 'arm_far_upper':[(815,666),(844,668),(882,682),(916,695),(933,728),(913,753),(891,774),(851,777),(828,748),(804,724),(801,690)],
 'arm_far_forearm':[(847,706),(869,702),(888,697),(919,702),(944,721),(959,752),(946,779),(915,788),(886,775),(862,768),(836,748)],
 'hand_far':[(884,711),(903,686),(933,678),(969,690),(1003,708),(1023,739),(1038,768),(1041,804),(1033,827),(1009,841),(987,847),(957,855),(923,858),(898,848),(884,820),(889,782),(875,746)],
 'thigh_near':[(479,709),(515,707),(557,719),(597,746),(625,787),(637,833),(624,876),(593,919),(554,954),(502,979),(449,997),(401,1004),(379,985),(378,959),(406,927),(432,901),(435,858),(433,811),(446,758)],
 'thigh_far':[(745,792),(786,789),(830,802),(855,824),(877,861),(878,893),(855,924),(824,949),(801,966),(772,982),(738,994),(689,978),(665,965),(651,938),(672,912),(687,872),(696,835)],
}
# Anatomic joint centers (not sprite bounding corners).
pivots={
 'torso_core':(632,757),'neck':(730,620),
 'arm_near_upper':(703,648),'arm_near_forearm':(626,748),'hand_near':(732,739),
 'arm_far_upper':(845,699),'arm_far_forearm':(885,745),'hand_far':(897,739),
 'thigh_near':(486,770),'thigh_far':(757,828),
}
parents={
 'torso_core':'root','neck':'torso_core',
 'arm_near_upper':'torso_core','arm_near_forearm':'arm_near_upper','hand_near':'arm_near_forearm',
 'arm_far_upper':'torso_core','arm_far_forearm':'arm_far_upper','hand_far':'arm_far_forearm',
 'thigh_near':'torso_core','thigh_far':'torso_core',
}
attachments={
 'torso_core':{'back':(535,655),'belly':(727,853),'hips':[(486,770),(757,828)]},
 'neck':{'head':(690,433),'torso':(730,620)},
 'arm_near_upper':{'shoulder':(703,648),'elbow':(626,748)},
 'arm_near_forearm':{'elbow':(626,748),'wrist':(732,739)},
 'hand_near':{'wrist':(732,739),'fingers':3},
 'arm_far_upper':{'shoulder':(845,699),'elbow':(885,745)},
 'arm_far_forearm':{'elbow':(885,745),'wrist':(897,739)},
 'hand_far':{'wrist':(897,739),'fingers':3},
 'thigh_near':{'hip':(486,770),'knee':(408,982)},
 'thigh_far':{'hip':(757,828),'knee':(745,975)}
}

def smooth_mask(points, blur=0.55):
 p=np.array(points,float)
 tck,_=splprep([p[:,0],p[:,1]],s=0,per=True,k=3)
 v=np.stack(splev(np.linspace(0,1,len(p)*45),tck),axis=1)
 m=np.zeros((H,W),np.uint8)
 cv2.fillPoly(m,[np.round(v*2).astype(np.int32)//2],255,lineType=cv2.LINE_AA)
 if blur: m=cv2.GaussianBlur(m,(3,3),blur)
 return m

masks={name:smooth_mask(p) for name,p in paths.items()}

# Prevent creation of a disconnected head, tail, or shin as part of the torso.
# Inside this crop, only original pixels are retained; all other new pixels are hidden-surface completions.
# Areas where visible limbs are physically in FRONT of the trunk are removed / repainted.

# Pixel colors from visible paint. The full body behind arms/hips wasn't drawn,
# so use smooth interpolated solid color material ONLY under previously occluded contours.
Y,X=np.mgrid[:H,:W].astype(np.float32)
# Master cyan belly / blue body: sampled from nearby real unoccluded regions.
base_blue=np.stack((
    27+0.010*(X-650)+0.002*(Y-765),
    122-0.012*(Y-765)-0.002*(X-650),
    234-0.006*(Y-765)
),axis=2)
base_cyan=np.stack((
    147+0.010*(X-700),
    213+0.006*(X-700),
    250+0.005*(X-700)
),axis=2)
# Smooth blue->cyan transition following original belly across the rear hip.
seam=(Y-(625+0.30*(650-X)))/26
wt=np.clip(0.5+0.5*np.tanh(seam),0,1)
wt=np.where(X<565, np.clip((X-514)/85,0,1)*wt,wt)
# back is blue. Belly under hand/thigh is light cyan.
wt=np.where(X<660,np.minimum(wt, np.clip((X-565)/130,0,1)), wt)
fill_belly=np.clip(base_blue*(1-wt[:,:,None])+base_cyan*wt[:,:,None],0,255).astype(np.uint8)

# Mask for painted original contours that MUST NOT remain on a freestanding torso.
# In visible areas outside removed limb silhouettes, preserve original pixels untouched.
limb_ids=['arm_near_upper','arm_near_forearm','hand_near','arm_far_upper','arm_far_forearm','hand_far','thigh_near','thigh_far']
limb_union=np.zeros((H,W),np.uint8)
for name in limb_ids:limb_union=np.maximum(limb_union,masks[name])
# Hide the ink that belongs to the movable pieces, including a narrow seam inside them.
limb_erase=cv2.dilate((limb_union>35).astype(np.uint8)*255,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13)))

# The tail surface isn't part of this batch; keep the left back filled for connection to later separate tail.
# Backpaint torso under limbs as one clean torso surface.
from PIL import ImageDraw

def apply_alpha(rgba,mask):
 im=rgba.copy()
 im[:,:,3]=np.minimum(im[:,:,3].astype(np.uint16),mask.astype(np.uint16)).astype(np.uint8)
 return im

def rgba_body(name):
 m=masks[name];out=master.copy()
 if name=='torso_core':
  # Inpaint blue/cyan under visible limbs; no replacement of original external contours.
  repaired=(limb_erase>0)&(m>0)
  # Feather boundary 8 px, while replacing completely hidden ink at the center.
  feather=cv2.GaussianBlur((limb_erase>0).astype(np.uint8)*255,(0,0),5.0).astype(np.float32)/255.0
  feather=np.clip(feather*1.25,0,1)
  rgba_mix=(out[:,:,:3].astype(np.float32)*(1-feather[:,:,None])+fill_belly.astype(np.float32)*feather[:,:,None]).astype(np.uint8)
  out[repaired,:3]=rgba_mix[repaired]
  # Complete the deep shoulder socket: the black upper-arm contour does not
  # belong to the central torso PNG. This region is hidden by the near arm.
  upper_socket=(X>660)&(X<773)&(Y>617)&(Y<751)&(m>0)
  upper_socket_erased=upper_socket&((limb_erase>0)|((Y<714)&(X>701)))
  out[upper_socket_erased,:3]=np.clip(fill_belly[upper_socket_erased],0,255).astype(np.uint8)
  # Remove the near-thigh outline from the *torso* base. Its black perimeter
  # must travel only with the thigh, never remain as a ghost when the hip turns.
  hip_socket=cv2.dilate((masks['thigh_near']>70).astype(np.uint8)*255,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(29,29)))
  hip_backing=(hip_socket>0)&(X>424)&(Y>707)&(m>0)
  out[hip_backing,:3]=np.clip(fill_belly[hip_backing],0,255).astype(np.uint8)
  # Hide neck outline crossing the torso top; head/neck are behind torso and cover root join.
  # Softly heal originally transparent interior where joints may expose a tiny gap.
  missing=(A<0.6)&(m>65)
  out[missing,:3]=fill_belly[missing]
  out[missing,3]=255
 elif name=='neck':
  # Preserve all visible original neck pixels, rebuilding the region hidden by skull/arm/torso.
  # The top head and lower trunk are overdrawn by their own layers in the full rig.
  removed=(limb_erase>0)&(m>0)
  out[removed,:3]=fill_belly[removed]
  # Do not preserve the skull's black cheek rim on the independently-moving
  # neck: it is already on batch-01's head_upper layer.
  hidden_head=(X>654)&(X<846)&(Y<585)&(m>0)
  cut=740+0.20*(Y-470)
  transition=np.clip((X-cut)/26+0.5,0,1)
  skin_rgb=base_blue*(1-transition[:,:,None])+base_cyan*transition[:,:,None]
  out[hidden_head,:3]=np.clip(skin_rgb[hidden_head],0,255).astype(np.uint8)
  missing=(A<0.6)&(m>65)
  out[missing,:3]=fill_belly[missing];out[missing,3]=255
 else:
  # Preserve all genuine visible pixels on the actual limb (including the three
  # claws). Remove overprinted *other* body areas from the independent cutout.
  # This avoids e.g. cyan belly slivers in hands or gray claws in rear thigh.
  R=out[:,:,0];G=out[:,:,1];B=out[:,:,2]
  cyan_bg=(R.astype(np.int16)>82)&(G.astype(np.int16)>169)&(B.astype(np.int16)>190)&(B.astype(np.int16)>R.astype(np.int16)+35)
  if name in ('hand_near','hand_far'):
   # Cyan glimpsed between claws belongs to the belly, not to either hand.
   out[cyan_bg,3]=0
  if name=='arm_far_upper':
   # The almost-hidden far shoulder overlaps the cyan neck in the source. That
   # region is now reconstructed as unpatterned original-blue underpaint.
   x_mask=(X<874)&(Y<746)
   occluded=x_mask&(m>0)
   out[occluded,:3]=[31,123,234]
   out[occluded,3]=255
  if name=='arm_far_forearm':
   occluded=(X<884)&(Y<731)&(m>0)
   out[occluded,:3]=[31,123,234]
   out[occluded,3]=255
  if name=='thigh_far':
   # Erase the foreground near-hand claws and belly that fall over the upper
   # far hip. Keep the original distal blue leg and real stripe untouched.
   occluded=(X<802)&(Y<936)&(m>0)
   out[occluded,:3]=np.clip(base_blue[occluded],0,255).astype(np.uint8)
   out[occluded,3]=255
   gray=(R.astype(np.int16)>64)&(R.astype(np.int16)<185)&(np.abs(R.astype(np.int16)-G.astype(np.int16))<22)&(np.abs(R.astype(np.int16)-B.astype(np.int16))<25)
   claws=gray&(X<854)&(Y<875)&(m>0)
   out[claws,:3]=np.clip(base_blue[claws],0,255).astype(np.uint8)
   # Remove the *outline* of the foreground claws, not just their gray fill.
   # This whole hidden hip cap will be overdrawn by the actual hand layer.
   foreign_ink=(X>792)&(X<853)&(Y>786)&(Y<868)&(m>0)
   out[foreign_ink,:3]=np.clip(base_blue[foreign_ink],0,255).astype(np.uint8)
   # Belly-colored material visible in the source is a foreground overlap,
   # not a feature painted on the independent leg.
   stray_cyan=cyan_bg&(m>0)
   out[stray_cyan,:3]=np.clip(base_blue[stray_cyan],0,255).astype(np.uint8)
  # Original source is transparent behind many joints. Recover flat material
  # ONLY there, where the next, overlapping part will cover it at rest.
  missing=(A<0.6)&(m>65)
  col=(31,124,237)
  out[missing,:3]=col
  out[missing,3]=255
 # For outer edges of the real illustration, keep real original alpha where present;
 # none of the masks can leak a region outside an alpha==0 source, except concealed joints.
 im=apply_alpha(out,m)
 return im

# NOTE: No generated teeth, toes or claws; all displayed limb shapes are original source pixels.
render={name:rgba_body(name) for name in paths}

# Export native tight crops with coordinate offsets and global/local fixed pivots.
manifest_entries=[]
for name in paths:
 rgba=render[name]
 ys,xs=np.where(rgba[:,:,3]>5)
 x0=max(0,int(xs.min())-5);y0=max(0,int(ys.min())-5)
 x1=min(W,int(xs.max())+6);y1=min(H,int(ys.max())+6)
 Image.fromarray(rgba[y0:y1,x0:x1].copy(),'RGBA').save(ROOT/f'{name}.png',optimize=True)
 manifest_entries.append({'file':f'{name}.png','id':name,'x':x0,'y':y0,'width':x1-x0,'height':y1-y0,
    'pivot':{'global':list(pivots[name]),'local':[pivots[name][0]-x0,pivots[name][1]-y0]},
    'parent':parents[name], 'attachments':attachments[name],
    'pngSHA256':hashlib.sha256((ROOT/f'{name}.png').read_bytes()).hexdigest(),
    'artwork':'original pixels with hidden joint-surface reconstruction' if name not in ['torso_core','neck'] else 'original visible colors plus obscured-area blue/cyan backpaint'})
manifest={'version':2,'batch':'02-body-limbs', 'sourcePath':'public/kenny/rig/v1/source/kenny-approved-master.png',
 'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'connectsBatch':'kenny-rig-v2/batch-01/manifest.json',
 'canvas':{'width':W,'height':H,'coordinateSystem':'pixels, top-left origin'},
 'files':manifest_entries,
 'drawOrder':['thigh_far','arm_far_upper','arm_far_forearm','hand_far','torso_core','neck','thigh_near','arm_near_upper','arm_near_forearm','hand_near'],
 'referenceHeadPivot':{'global':[690,433]},'referenceJawPivot':{'global':[771,376]},
 'limitations':['Only upper thighs were requested; the knees, shins, feet and tail are deliberately reserved for batch 03.',
 'Hidden geometry under upper arms/hips was reconstructed from real blue/cyan material gradients, not independently AI-generated.',
 'Spline borders and anatomical occlusion require human review before animation or merge.',
 'No runtime renderer changed.'],
 }
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

# Preview helper: compose actual separate exported PNGs, no source pixels as a hidden full-body backup.
def reconstruct(name):
 m=next(e for e in manifest_entries if e['id']==name)
 layer=Image.new('RGBA',(W,H),(0,0,0,0))
 layer.alpha_composite(Image.open(ROOT/m['file']).convert('RGBA'),(m['x'],m['y']))
 return layer

# Preview large list of actual part files.
def checker(w,h,s=16):
 yy,xx=np.indices((h,w));a=((xx//s+yy//s)%2)*17+230
 return Image.fromarray(np.dstack([a,a,a,np.full((h,w),255)]).astype('uint8'),'RGBA')

T=Image.new('RGB',(1800,1050),(245,247,252));d=ImageDraw.Draw(T)
for i,name in enumerate(paths):
 x=i%5*360;y=i//5*520
 c=Image.open(ROOT/f'{name}.png').convert('RGBA')
 cw,ch=c.size
 scale=min(324/cw,438/ch)
 display=c.resize((max(1,round(cw*scale)),max(1,round(ch*scale))),Image.Resampling.LANCZOS)
 back=checker(340,445)
 back.alpha_composite(display,((340-display.width)//2,(445-display.height)//2))
 T.paste(back.convert('RGB'),(x+10,y+36))
 d.text((x+12,y+12),f'{i+1:02d}  {name}',(29,40,65))
T.save(ROOT/'previews/parts-contact-sheet.png')

# At-rest cutout composition: Head from batch 01; tail/shins are clearly marked reference-only.
head_meta=json.loads((BATCH1/'manifest.json').read_text())
def head_layer(name):
 e=next(z for z in head_meta['files'] if z['id']==name)
 im=Image.new('RGBA',(W,H))
 im.alpha_composite(Image.open(BATCH1/e['file']).convert('RGBA'),(e['x'],e['y']))
 return im

# Direct composition with independent art. No full-body source picture underneath.
stack=['thigh_far','arm_far_upper','arm_far_forearm','hand_far','torso_core','neck','thigh_near','arm_near_upper','arm_near_forearm','hand_near']

# alpha composite aligned to master canvas; head composited last for natural neck occlusion.
def compose_parts(pose=None):
 stage=Image.new('RGBA',(W,H),(0,0,0,0))
 for name in stack:
  piece=reconstruct(name)
  if pose and name in pose:
   angle=pose[name];piv=pivots[name]
   import cv2
   src=np.asarray(piece);mat=cv2.getRotationMatrix2D(piv,angle,1)
   alpha=cv2.warpAffine(src[:,:,3],mat,(W,H),flags=cv2.INTER_LINEAR)
   b=cv2.warpAffine((src[:,:,:3].astype(np.float32)*src[:,:,3:4].astype(np.float32)/255),mat,(W,H),flags=cv2.INTER_LINEAR)
   val=np.zeros_like(src);val[:,:,3]=alpha
   where=alpha>0;val[where,:3]=np.clip(b[where]*255/alpha[where,None],0,255).astype(np.uint8)
   piece=Image.fromarray(val,'RGBA')
  stage.alpha_composite(piece)
 # Face from previous batch 01 (documented original coordinates), separate items.
 for name in head_meta['poses']['open']:
  stage.alpha_composite(head_layer(name))
 return stage

def single_ref():
 # Draw reference ONLY where batch-03 assets are intentionally missing.
 mask=np.zeros((H,W),np.uint8)
 mask[958:,:]=255
 mask[:,0:390]=255
 mask[485:675,25:610]=255   # exposed tail for interim review
 # exclude hips/torso under the future layers to avoid false validation.
 res=master.copy();res[:,:,3]=np.minimum(res[:,:,3],mask)
 return Image.fromarray(res,'RGBA')

origin=Image.fromarray(master,'RGBA')
frames=[('ORIGINAL',origin),('BATCH 01 + BATCH 02',compose_parts()),('JOINT TEST +/- 7°',compose_parts({'arm_near_upper':-7,'arm_near_forearm':5,'arm_far_upper':6,'arm_far_forearm':-4,'thigh_near':6,'thigh_far':-6,'neck':-4}))]
# Each frame is layered on a checker background; reference-only tail/shins are translucent and not mistaken for batch 2 output.
preview=Image.new('RGB',(1610,620),(246,248,251));pd=ImageDraw.Draw(preview)
for i,(lab,im) in enumerate(frames):
 x=10+i*530
 bg=checker(500,555,24)
 if i>0:
  r=single_ref();r.putalpha(r.getchannel('A').point(lambda v: int(v*.37)))
  # Reference tail/feet should be behind ALL newly generated layers.
  ref=Image.new('RGBA',(W,H));ref.alpha_composite(r);ref.alpha_composite(im)
  im=ref
 factor=min(497/W,532/H)
 sc=im.resize((round(W*factor),round(H*factor)),Image.Resampling.LANCZOS)
 bg.alpha_composite(sc,((500-sc.width)//2,7))
 preview.paste(bg.convert('RGB'),(x,45));pd.text((x+8,16),lab,fill=(22,35,66))
preview.save(ROOT/'previews/comparison-original-rest-movement.png')

# Joint zoom previews showing shoulder, elbow, hip seams at rest and moderate test pose.
outs=[]
for lab,im in frames[1:]:
 for region,(l,t,r,b) in {'shoulder-elbow':(566,592,1036,852),'hip-knee':(385,700,875,1022),'neck-head':(589,375,873,775)}.items():
  tile=checker(r-l,b-t);crop=im.crop((l,t,r,b));tile.alpha_composite(crop)
  tw=round(tile.width*0.95);th=round(tile.height*0.95)
  outs.append((f'{lab} · {region}',tile.resize((tw,th),Image.Resampling.LANCZOS)))
cwidth=1520;cheight=1130;panel=Image.new('RGB',(cwidth,cheight),(246,247,250));pp=ImageDraw.Draw(panel)
coords=[(10,45),(514,45),(1018,45),(10,570),(514,570),(1018,570)]
for (label,im),(xx,yy) in zip(outs,coords):
 im.thumbnail((490,465));panel.paste(im.convert('RGB'),(xx,yy));pp.text((xx,yy-22),label,fill=(30,41,64))
panel.save(ROOT/'previews/joint-check-moderate-rotation.png')

print('Created',len(manifest_entries),'real independent RGBA PNGs at',ROOT)
