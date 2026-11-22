"""Rebuild five Kenny fusion atlases into 192px, bleed-free animation cells.

Original 1254px 8x8 PNGs are retained for rollback. 1536px polished PNGs
preserve all 64 authentic sprite poses and their equipment, restore the
missing muzzle / eyes / frill in tail swings, equalize apparent character
size, and remove yellow tail spike artifacts.
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np

SOURCE_SIZE=1254
SOURCE_CELL=SOURCE_SIZE/8
OUT_CELL=192
SKINS=['blue','green','pink','red','zebra']
OUT_SUFFIX='-polished.png'

def source_cell(sheet: Image.Image, row:int, col:int) -> Image.Image:
    bounds=(round(col*SOURCE_CELL),round(row*SOURCE_CELL),
        round((col+1)*SOURCE_CELL),round((row+1)*SOURCE_CELL))
    return sheet.crop(bounds).convert('RGBA')

def ivory_tail(sprite:Image.Image, row:int, col:int) -> Image.Image:
    """Fix inappropriate golden spikes; keep yellow pupils and orange plates."""
    arr=np.asarray(sprite.convert('RGBA')).copy()
    h,w=arr.shape[:2]
    yy,xx=np.indices((h,w))
    yellow=((arr[:,:,0]>=180)&(arr[:,:,1]>=142)&(arr[:,:,2]<=197)&
        (arr[:,:,0]>arr[:,:,2]+30)&(arr[:,:,3]>40))
    if col==7:
        region=(xx>int(w*.66)) & (yy>int(h*.25))
    elif row in (3,6,7):
        region=(xx<int(w*.29)) & (yy>int(h*.27))
    else:
        return sprite
    bad=yellow & region
    if bad.any():
        bright=np.clip((arr[:,:,0].astype(float)+arr[:,:,1])/2,170,243)
        arr[:,:,0][bad]=np.minimum(255,bright[bad]+7).astype('uint8')
        arr[:,:,1][bad]=np.maximum(198,bright[bad]-5).astype('uint8')
        arr[:,:,2][bad]=np.maximum(166,bright[bad]-21).astype('uint8')
    return Image.fromarray(arr,'RGBA')

def tail_attack_from_canonical_idle(sheet:Image.Image, row:int) -> Image.Image:
    """Real rightward tail attack, with intact, mirror-facing pose0 skull/arms.

    Original col7 loses the snout at the *preceding* cell boundary and its eye
    becomes white. Row6 additionally omits the frill. Mirror the complete
    pose0 upper body + legs, preserve frill and plates, then attach the real
    horizontal striking tail and four ivory spikes from source col7. This is
    a new full sprite, not a loose item PNG overlaid on Kenny.
    """
    neutral=source_cell(sheet,row,0)
    strike=ivory_tail(source_cell(sheet,row,7),row,7)
    keep=Image.new('L',neutral.size,0)
    painter=ImageDraw.Draw(keep)
    painter.polygon([(67,0),(157,0),(157,157),(0,157),
        (0,109),(55,105),(66,87)],fill=255)
    if row in (1,2,4,5,6,7):
        a=np.asarray(neutral).copy()
        yy,xx=np.indices(a.shape[:2])
        orange=((a[:,:,0]>135)&(a[:,:,1]>65)&(a[:,:,2]<143)&
            (a[:,:,0]>a[:,:,2]+65)&(a[:,:,3]>125)&(xx<100)&(yy<115))
        k=9 if row in (1,4,6) else 5
        expanded=(np.asarray(Image.fromarray(orange.astype('uint8')*255)
            .filter(ImageFilter.MaxFilter(2*k+1)))>0)
        old=np.asarray(keep).copy()
        old[expanded]=255
        keep=Image.fromarray(old,'L')
    keep=keep.filter(ImageFilter.GaussianBlur(.6))
    neutral.putalpha(ImageChops.multiply(neutral.getchannel('A'),keep))
    complete=neutral.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    tailmask=Image.new('L',strike.size,0)
    painter=ImageDraw.Draw(tailmask)
    painter.polygon([(79,93),(89,85),(101,56),(129,42),(157,44),
        (157,143),(97,133),(81,117)],fill=255)
    tailmask=tailmask.filter(ImageFilter.GaussianBlur(.85))
    strike.putalpha(ImageChops.multiply(strike.getchannel('A'),tailmask))
    complete.alpha_composite(strike,(-1,0))
    return complete

def remove_neighbor_pixel(sprite:Image.Image,col:int)->Image.Image:
    """Remove disconnected 1-8 px pose7 fragments from the edge of pose6."""
    if col!=6:return sprite
    arr=np.asarray(sprite).copy()
    core=arr[:,:,3]>95
    h,w=core.shape
    seen=set()
    for sy in range(0,96):
        for sx in range(w-12,w):
            if not core[sy,sx] or (sx,sy) in seen:continue
            queue=[(sx,sy)]
            seen.add((sx,sy))
            coords=[]
            while queue:
                x,y=queue.pop()
                coords.append((x,y))
                for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                    if 0<=nx<w and 0<=ny<h and core[ny,nx] and (nx,ny) not in seen:
                        seen.add((nx,ny))
                        queue.append((nx,ny))
            if coords and min(x for x,y in coords)>=w-12 and len(coords)<320:
                for x,y in coords:
                    arr[max(0,y-1):min(h,y+2),max(0,x-1):min(w,x+2),3]=0
    return Image.fromarray(arr,'RGBA')

def reframe(sprite:Image.Image,factor:float)->Image.Image:
    """Same scale for each outfit row; 181px world-foot baseline for all poses."""
    bbox=sprite.getchannel('A').getbbox()
    canvas=Image.new('RGBA',(OUT_CELL,OUT_CELL))
    if not bbox:return canvas
    ink=sprite.crop(bbox)
    sw,sh=ink.size
    factor=min(factor,180/sw,179/sh)
    new=(max(1,round(sw*factor)),max(1,round(sh*factor)))
    ink=ink.resize(new,Image.Resampling.LANCZOS)
    canvas.alpha_composite(ink,(round((OUT_CELL-new[0])/2),181-new[1]))
    return canvas

def polished_atlas(src:Path,dst:Path):
    sheet=Image.open(src).convert('RGBA')
    if sheet.size!=(SOURCE_SIZE,SOURCE_SIZE):
        raise ValueError(f'{src}: expected {SOURCE_SIZE}² source, got {sheet.size}')
    out=Image.new('RGBA',(8*OUT_CELL,8*OUT_CELL))
    for row in range(8):
        reference=source_cell(sheet,row,0)
        bounds=reference.getchannel('A').getbbox()
        if not bounds:raise ValueError(f'{src} missing row {row}')
        factor=min(1.20,168/(bounds[3]-bounds[1]))
        for col in range(8):
            if col==7 and row in (3,6,7):
                frame=tail_attack_from_canonical_idle(sheet,row)
            else:
                frame=source_cell(sheet,row,col)
                frame=remove_neighbor_pixel(frame,col)
                frame=ivory_tail(frame,row,col)
            out.alpha_composite(reframe(frame,factor),
                (col*OUT_CELL,row*OUT_CELL))
    dst.parent.mkdir(parents=True,exist_ok=True)
    out.save(dst,optimize=True)
    print(f'Polished {dst.name}: {out.width} x {out.height}; {dst.stat().st_size} bytes')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--input',default='public/kenny/animations/fusions')
    parser.add_argument('--output',default='public/kenny/animations/fusions')
    args=parser.parse_args()
    for skin in SKINS:
        polished_atlas(Path(args.input)/f'{skin}.png',
            Path(args.output)/f'{skin}{OUT_SUFFIX}')

if __name__=='__main__':main()
