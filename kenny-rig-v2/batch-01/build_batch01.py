#!/usr/bin/env python3
"""Reproducible Kenny head/face ten-layer cutout from approved master.
Source canvas: 1205x1305 RGBA, all part coordinates retained globally.
"""
from pathlib import Path
import json, hashlib, os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import splprep,splev

ROOT=Path(__file__).resolve().parent
SOURCE=Path(os.getenv('KENNY_MASTER_PATH', str(ROOT.parents[1] / 'public/kenny/rig/v1/source/kenny-approved-master.png')))
if not SOURCE.exists():
  SOURCE=Path('/mnt/data/kenny_rig_assets_v1/source/kenny-approved-master.png')
arr=np.asarray(Image.open(SOURCE).convert('RGBA')).copy()
H,W=arr.shape[:2]; assert (W,H)==(1205,1305)
R,G,B,A=[arr[:,:,i].astype(np.int16) for i in range(4)]

# Smooth object silhouette, no coarse angular polygon around the pupils or eye lines.
def smooth_mask(coords, closed=True):
  pts=np.array(coords, dtype=float)
  tck,_=splprep([pts[:,0],pts[:,1]],s=0,per=int(closed),k=min(3,len(pts)-1))
  res=splev(np.linspace(0,1,max(250,len(pts)*22)),tck)
  contour=np.round(np.stack(res,axis=1)).astype(np.int32)
  mask=np.zeros((H,W),np.uint8)
  cv2.fillPoly(mask,[contour],255,lineType=cv2.LINE_AA)
  return mask

def select_components(mask,roi,n=1,area=40):
  x0,y0,x1,y1=roi
  roi_mask=np.zeros((H,W),np.uint8);roi_mask[y0:y1,x0:x1]=mask[y0:y1,x0:x1]
  ct,labels,stats,cents=cv2.connectedComponentsWithStats(roi_mask,connectivity=8)
  ids=sorted((i for i in range(1,ct) if stats[i,cv2.CC_STAT_AREA]>=area),key=lambda i:stats[i,cv2.CC_STAT_AREA],reverse=True)[:n]
  out=np.zeros((H,W),np.uint8)
  for i in ids:out[labels==i]=255
  return out

def fill_contours(mask):
  cnt,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
  filled=np.zeros(mask.shape,np.uint8)
  for c in cnt: cv2.drawContours(filled,[c],-1,255,-1,lineType=cv2.LINE_AA)
  return filled

def dilate(m,r):
  return cv2.dilate(m,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1)))

def alpha_mask(mask):
  return (arr[:,:,3].astype(np.uint16)*mask.astype(np.uint16)//255).astype(np.uint8)

# Visible yellow/orange eye exactly as drawn in the approved source.
yellow=((R>150)&(G>70)&(G>B*1.25)&(B<140)&(A>30)).astype(np.uint8)*255
near_gold=select_components(yellow,(685,170,940,362),1,1500)
far_gold=select_components(yellow,(992,155,1085,270),1,120)
assert np.count_nonzero(near_gold)>8000 and np.count_nonzero(far_gold)>400
def eye_full_shape(comp, radius):
  # A pupil may touch the rim and split the yellow area into a C-shape.
  # Recover a full, smooth oval from the ACTUAL colored-eye contour, not an angular polygon.
  contours,_=cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
  pts=np.concatenate(contours,axis=0)
  hull=cv2.convexHull(pts)
  filled=np.zeros(comp.shape,np.uint8)
  cv2.fillConvexPoly(filled,hull,255,lineType=cv2.LINE_AA)
  filled=cv2.morphologyEx(filled,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
  return dilate(filled,radius)
near_eye=eye_full_shape(near_gold,15)
far_eye=eye_full_shape(far_gold,15)
# Avoid absorbing the eyebrow above the large near eye. Every eye mask is a real curved contour.
near_eye[:202,:]=0
far_eye[:180,:]=0

white=((R>190)&(G>188)&(B>185)&((np.maximum.reduce([R,G,B])-np.minimum.reduce([R,G,B]))<35)&(A>40)).astype(np.uint8)*255
upper_core=select_components(white,(922,375,1125,454),3,200)
lower_core=select_components(white,(897,466,1040,557),2,180)
assert np.count_nonzero(upper_core)>1900 and np.count_nonzero(lower_core)>900
upper_teeth=dilate(fill_contours(upper_core),5)
lower_teeth=dilate(fill_contours(lower_core),5)
# Mouth: component of contiguous burgundy/pink; keep original tongue color, no color re-prompt.
red=((R>50)&(R>G*1.25)&(R>B*1.15)&(G<165)&(B<185)&(A>35)).astype(np.uint8)*255
mouth_core=select_components(red,(774,360,1024,559),1,1500)
assert np.count_nonzero(mouth_core)>3500
mouth=dilate(fill_contours(mouth_core),3)
# Jaw: the closed, smooth real contour of the light-cyan cheek and lower lip; no guessed polygon cut.
cyan=((B>170)&(G>125)&(R>50)&(R<195)&(B>R*1.15)&(A>20)).astype(np.uint8)*255
jaw_core=select_components(cyan,(640,335,1045,575),1,6000)
assert np.count_nonzero(jaw_core)>18000
jaw=dilate(fill_contours(jaw_core),5)
# Skull follows the ACTUAL alpha silhouette of the master everywhere except the
# lower seam (head and jaw are the only two overlapping large facial surfaces).
# Smooth interpolated lower boundary is deliberately beneath the original eye rim.
cut_pts=np.array([
(530,409),(552,450),(580,488),(617,524),(651,549),
(668,553),(683,557),(705,552),(731,535),(759,504),
(783,416),(815,388),(870,399),(924,405),(969,402),(1020,396),
(1068,386),(1116,385),(1164,391),(1204,371)],dtype=float)
from scipy.interpolate import PchipInterpolator
lower_boundary=PchipInterpolator(cut_pts[:,0],cut_pts[:,1],extrapolate=True)(np.arange(W))
skull=np.zeros((H,W),np.uint8)
for x in range(530,W):
    ylimit=int(np.clip(lower_boundary[x],0,H))
    skull[:ylimit,x]=255
# The skull mask trims to real artwork transparency. Remove lower-jaw/pink/tooth surfaces
# from the skull, then backpaint only *hidden* skin under swapable eyes.
skull=cv2.bitwise_and(skull, np.where(A>5,255,0).astype(np.uint8))
# Keep skull separate from the mouth and jaw artwork. Mouth edge is preserved through cavity/teeth overlays.
# Explicit eye removal: independently swap all eye artwork.
skull[near_eye>0]=0
skull[far_eye>0]=0
# No teeth baked into skull; subtract remaining teeth, including black outlines.
skull[upper_teeth>0]=0
skull[lower_teeth>0]=0
# No red mouth integrated into upper shell.
skull[mouth>0]=0
# No jaw ink integrated into skull; preserve overlap only at the high cheek junction.
skull[(jaw>0)&(np.indices((H,W))[0]>=367)]=0

# Preserve natural original artwork and contour stroke for separate artwork files.
items={
 'head_upper':(arr,skull),
 'eye_near_open':(arr,near_eye),
 'eye_far_open':(arr,far_eye),
 'jaw_lower_open':(arr,jaw),
 'mouth_cavity':(arr,mouth),
 'upper_teeth':(arr,upper_teeth),
 'lower_teeth':(arr,lower_teeth),
}

# Inpaint only the hidden surface beneath swappable eyes. Unlike a flat blue
# fill, edge-color propagation matches the real subtle color gradient and avoids
# round seams around a blink.
eye_hidden=cv2.bitwise_or(near_eye,far_eye)
inpaint_rgb=cv2.inpaint(arr[:,:,:3],eye_hidden,12,cv2.INPAINT_TELEA)
# Rebuild the natural blue skin under eyelids without leaving holes when eyes swap.
# Do not blur or otherwise repaint the approved visible pixels.
yy,xx=np.mgrid[:H,:W]
skin=np.empty((H,W,4),dtype=np.uint8)
skin[:,:,:3]=np.clip(np.stack((32+0.020*(xx-800)-0.016*(yy-290),
                          126+0.020*(xx-800)-0.010*(yy-290),
                          236+0.008*(xx-800)-0.006*(yy-290)),axis=2),0,255).astype(np.uint8)
skin[:,:,3]=253
# Each eye is filled under the real round/original outline, except its open variant supplies true eye pixels.
base_skull=np.array(items['head_upper'][0],copy=True)
base_mask=items['head_upper'][1].copy()
for eye in (near_eye,far_eye):
  # Fill the entire oval with skin, including black rim/pupil: closed-eye switching
  # must leave no residual pupil or see-through ring behind the lid sprite.
  base_skull[eye>0,:3]=inpaint_rgb[eye>0]
  base_skull[eye>0,3]=253
  # Solid support under the feathered eyelid boundary prevents a translucent halo.
  base_mask[eye>0]=255
# Narrow underlying skin only at the true cheek/hinge region. Constrain this to
# the original jaw footprint, so no artificial blue lobe is visible underneath.
underjaw=jaw.copy()
underjaw[:,804:]=0
underjaw[505:,:]=0
for y in range(344,505):
  for x in range(659,804):
    if underjaw[y,x] and not base_mask[y,x]:
      base_skull[y,x]=skin[y,x]
      base_mask[y,x]=underjaw[y,x]
items['head_upper']=(base_skull,base_mask)

# Closed lids use the same precise alpha footprint as open, with skin shading and curved black creases.
# The skull under each eye is blue and never contains the original pupil/eyeball.
def closed_eye(mask, near):
  out=skin.copy()
  out[:,:,:3]=inpaint_rgb
  alpha=mask.copy()
  out[:,:,3]=255
  # Anti-aliased curved eyelid ink anchored to the actual selected eye geometry.
  if near:
    curve=[(736,278),(757,292),(792,298),(826,295),(851,278),(869,257)]
    accent=[(750,282),(773,290),(807,291),(840,280)]
  else:
    curve=[(1024,209),(1037,220),(1044,233),(1048,241)]
    accent=[(1027,206),(1039,220),(1045,227)]
  for pts,thickness,color in [(curve,7,(9,13,24,255)),(accent,2,(10,73,143,255))]:
    xy=np.array(pts,dtype=float)
    tck,_=splprep([xy[:,0],xy[:,1]],s=0,k=min(3,len(xy)-1))
    smooth=np.round(np.stack(splev(np.linspace(0,1,80),tck),axis=1)).astype(np.int32)
    temp=np.zeros((H,W,4),np.uint8)
    cv2.polylines(temp,[smooth],False,color,thickness,lineType=cv2.LINE_AA)
    where=temp[:,:,3]>0
    out[where,:3]=temp[where,:3]
  return out,alpha
items['eye_near_closed']=closed_eye(near_eye,True)
items['eye_far_closed']=closed_eye(far_eye,False)

# Jaw closure geometry: rotate actual lip/cheek artwork about a fixed left jaw hinge.
# No visible teeth, tongue or pink pixels are present in closed-jaw source.
JAW_PIVOT=(771,376)
def rotate_image_and_mask(img,mask,angle,pivot):
  matrix=cv2.getRotationMatrix2D(pivot,angle,1.0)
  # Warp premultiplied channels to avoid dark halos on antialiased cutout edges.
  pre=(img[:,:,:3].astype(np.float32)*((img[:,:,3].astype(np.float32)*mask/255)/255)[:,:,None]).astype(np.float32)
  rgba=np.zeros((H,W,4),np.uint8)
  prem=cv2.warpAffine(pre,matrix,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0))
  alp=cv2.warpAffine(alpha_mask(mask),matrix,(W,H),flags=cv2.INTER_LINEAR,borderValue=0)
  wv=np.maximum(alp.astype(np.float32)/255,1e-6)
  rgba[:,:,:3]=np.clip(prem/wv[:,:,None],0,255).astype(np.uint8)
  rgba[:,:,3]=alp
  return rgba
closed_jaw=rotate_image_and_mask(arr,jaw,+27,JAW_PIVOT) # pillow/cv2 positive = visual up-right
# Fill the formerly exposed gap between muzzle and the rotated lip, with the same
# cyan skin as the natural jaw (never red/pink or teeth). No plastic/LEGO geometry.
bridge_mask=smooth_mask([(784,372),(839,373),(902,390),(982,395),(1040,389),
                         (1110,382),(1160,381),(1153,405),(1094,435),
                         (1033,447),(970,449),(908,440),(850,421),(796,397)])
bridge=np.zeros((H,W,4),np.uint8)
bridge[:,:,:3]=np.clip(np.stack((152+0.01*(xx-900),215+0.012*(xx-900),248+0.002*(xx-900)),axis=2),0,255).astype(np.uint8)
bridge[:,:,3]=bridge_mask
# The closed jaw base is composited under the bridge, retaining the original shape.
closed_canvas=Image.fromarray(closed_jaw,'RGBA')
closed_canvas.alpha_composite(Image.fromarray(bridge,'RGBA'))
closed_jaw=np.array(closed_canvas)
# Thin, natural upper-lip crease defines closure with no teeth or red mouth cavity.
crease=np.array([(803,380),(847,392),(904,403),(957,409),
                 (1016,402),(1075,389),(1141,384)],float)
tck,_=splprep([crease[:,0],crease[:,1]],s=0,k=3)
points=np.round(np.stack(splev(np.linspace(0,1,160),tck),axis=1)).astype(np.int32)
cv2.polylines(closed_jaw,[points],False,(11,15,23,255),5,lineType=cv2.LINE_AA)


# The jaw itself has no pink (from the color selection), and its closed-tip has no teeth.
items['jaw_lower_closed']=(closed_jaw,None)

# Output: exact ten transparent individual PNGs, original master-space positions in manifest.
order=['head_upper','eye_near_open','eye_near_closed','eye_far_open','eye_far_closed',
       'jaw_lower_open','jaw_lower_closed','mouth_cavity','upper_teeth','lower_teeth']
pivots={'head_upper':(690,433),'eye_near_open':(801,274),'eye_near_closed':(801,274),
'eye_far_open':(1035,224),'eye_far_closed':(1035,224),'jaw_lower_open':JAW_PIVOT,
'jaw_lower_closed':JAW_PIVOT,'mouth_cavity':JAW_PIVOT,'upper_teeth':(1020,393),
'lower_teeth':(965,501)}
render={}
entries=[]
for name in order:
  rgba,mask=items[name]
  if mask is not None:
    aout=alpha_mask(mask)
    rendered=rgba.copy()
    rendered[:,:,3]=aout
  else:rendered=rgba.copy()
  ys,xs=np.where(rendered[:,:,3]>3)
  if not len(xs):raise RuntimeError('empty part '+name)
  margin=3
  x0=max(0,int(xs.min())-margin);y0=max(0,int(ys.min())-margin)
  x1=min(W,int(xs.max())+margin+1);y1=min(H,int(ys.max())+margin+1)
  # Tight crop; document precise master offset, cutout is independent PNG file.
  crop=rendered[y0:y1,x0:x1].copy()
  im=Image.fromarray(crop,'RGBA');im.save(ROOT/(name+'.png'),optimize=True)
  render[name]=(rendered,(x0,y0,x1,y1))
  entries.append({'file':name+'.png','id':name,'x':x0,'y':y0,'width':x1-x0,'height':y1-y0,
       'pivot':{'global':list(pivots[name]),'local':[pivots[name][0]-x0,pivots[name][1]-y0]},
       'pngSHA256':hashlib.sha256((ROOT/(name+'.png')).read_bytes()).hexdigest(),
       'source':'approved-master pixel cutout' if name in ['eye_near_open','eye_far_open','jaw_lower_open','mouth_cavity','upper_teeth','lower_teeth'] else
                ('closed-jaw transformed original + occluded-area correction' if name=='jaw_lower_closed' else 'original pixels + hidden blue skin/eyelid completion')})

# Composite separate image files at native coordinates. This is a render test, not game runtime.
def composite(names):
  canvas=Image.new('RGBA',(W,H),(0,0,0,0))
  for n in names:
    layer=Image.open(ROOT/(n+'.png')).convert('RGBA')
    info=next(e for e in entries if e['id']==n)
    canvas.alpha_composite(layer, (info['x'],info['y']))
  return canvas
open_order=['head_upper','mouth_cavity','jaw_lower_open','upper_teeth','lower_teeth','eye_far_open','eye_near_open']
closed_order=['head_upper','jaw_lower_closed','eye_far_open','eye_near_closed']
open_img=composite(open_order);closed_img=composite(closed_order)

# Never alter the source reference. For control, present the original master alongside both compositions.
ref=Image.open(SOURCE).convert('RGBA')
rx0,ry0,rx1,ry1=520,94,1185,613
new_size=(620,485)
def reference_panel(image):
  tile=Image.new('RGBA',(rx1-rx0,ry1-ry0),(240,240,240,255))
  tile.alpha_composite(image.crop((rx0,ry0,rx1,ry1)))
  return tile.resize(new_size,Image.Resampling.LANCZOS)
panels=[reference_panel(ref),reference_panel(open_img),reference_panel(closed_img)]
view=Image.new('RGB',(new_size[0]*3, new_size[1]+70),(249,249,251))
for i,panel in enumerate(panels):view.paste(panel.convert('RGB'),(i*new_size[0],58))
D=ImageDraw.Draw(view)
labels=['ORIGINAL MASTER', '10-LAYER COMPOSITE - OPEN', 'CLOSED MOUTH + BLINK']
for i,label in enumerate(labels): D.text((i*new_size[0]+20,23),label,fill=(28,30,40))
view.save(ROOT/'preview-comparison.png')

# In-context visual comparison. The neutral neck/torso reference is NOT part of
# the ten head layers, and we discard the entire old face above its neck seam;
# this does not fake restoration using the original face behind new artwork.
neck_curve=PchipInterpolator(
  np.array([0,520,590,640,680,728,774,825,870,1020,1204],float),
  np.array([700,530,508,510,527,543,557,566,575,585,585],float),
  extrapolate=True)(np.arange(W))
context_rgba=np.array(ref.copy())
for x in range(W):
  stop=int(np.clip(neck_curve[x],0,H))
  context_rgba[:stop,x,3]=0
context=Image.fromarray(context_rgba,'RGBA')
open_context=context.copy(); open_context.alpha_composite(open_img)
closed_context=context.copy(); closed_context.alpha_composite(closed_img)
context_panels=[reference_panel(ref),reference_panel(open_context),reference_panel(closed_context)]
view_context=Image.new('RGB',(new_size[0]*3, new_size[1]+70),(249,249,251))
for i,panel in enumerate(context_panels):view_context.paste(panel.convert('RGB'),(i*new_size[0],58))
dc=ImageDraw.Draw(view_context)
for i,label in enumerate(['ORIGINAL 1205x1305', 'OFFEN: 7 GESICHTSLAYER + NECK REFERENZ', 'GESCHLOSSEN: 4 LAYER + NECK REFERENZ']):
  dc.text((i*new_size[0]+15,23),label,fill=(28,30,40))
view_context.save(ROOT/'preview-in-context.png')

# Solo thumbnails: each piece is physically separate; checkerboard shows alpha.
thumb=Image.new('RGB',(5*260,2*250),(232,232,236));t=ImageDraw.Draw(thumb)
for n,name in enumerate(order):
  im=Image.open(ROOT/(name+'.png')).convert('RGBA')
  im.thumbnail((238,196),Image.Resampling.LANCZOS)
  x=n%5*260+(260-im.width)//2;y=n//5*250+12+(196-im.height)//2
  thumb.paste(im,(x,y),im)
  t.text((n%5*260+12,n//5*250+214),name,fill=(23,26,35))
thumb.save(ROOT/'preview-10-parts.png')

manifest={'version':2,'batch':'01-head-face','sourceRepo':'nkwallix-dev/studyverse',
'sourcePath':'public/kenny/rig/v1/source/kenny-approved-master.png','sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
'canvas':{'width':W,'height':H,'coordinateSystem':'pixels, top-left origin'},
'joint':{'id':'jaw-hinge','pivotGlobal':list(JAW_PIVOT),'closedJawRotationDegrees':27},
'files':entries,'poses':{'open':open_order,'closed':closed_order},
'notes':['Each PNG keeps a transparent alpha channel and a cropped file offset into the original 1205x1305 canvas.',
'Jaw closure rotates the actual cyan lower-jaw artwork around the documented hinge; teeth and cavity are visible only in the open pose.',
'Behind-eye skin and closed lids are completed artwork, not pixels present in the source.',
'No gameplay or runtime references to these proof-of-concept files.']}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('OUTPUT',[(e['id'],e['width'],e['height'],e['x'],e['y']) for e in entries])
print('PNG Files',len(list(ROOT.glob('*.png'))),'source SHA',manifest['sourceSHA256'])
