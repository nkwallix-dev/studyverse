"""Standardize zebra Kenny fusion atlas (8x8) without changing pose silhouettes.

The original fusion artist left the zebra skin cold grey and eyes white. This
operation whitens only neutral coat shading and recolors each separate white
iris to the yellow used on the unfused zebra. Horns, frills, stripes and
all 64 sprite poses are preserved, as are the 1254x1254 dimensions.
"""
from collections import deque
from pathlib import Path
from PIL import Image

ROOT=Path("public/kenny/animations/fusions")
EYE_HINTS=((90,32),(90,32),(90,32),(82,20),(94,61),(90,44),(95,91),(101,67))

def white(r,g,b,a):
    return a>210 and min(r,g,b)>177 and max(r,g,b)-min(r,g,b)<31

def fix():
    path=ROOT/"zebra.png"
    im=Image.open(path).convert("RGBA")
    if im.size!=(1254,1254):
        raise ValueError("Unexpected zebra atlas dimensions: "+repr(im.size))
    p=im.load()
    # Keep dark/black stripes, facial outlines, nails, ivory horns and frill.
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=p[x,y]
            if a<175 or max(r,g,b)-min(r,g,b)>17:
                continue
            v=(r+g+b)//3
            if v>=157:
                bright=min(255,round(246+(v-157)*9/98))
                p[x,y]=(bright,bright,bright,a)

    corrected=0
    for row in range(8):
        for col in range(8):
            unit=im.width/8
            ox,oy=round(col*unit),round(row*unit)
            ww=round((col+1)*unit)-ox
            hh=round((row+1)*unit)-oy
            ex,ey=EYE_HINTS[col]
            left,right=max(0,ex-27),min(ww,ex+44)
            top,bottom=max(0,ey-28),min(hh,ey+42)
            seen=set()
            choices=[]
            for y in range(top,bottom):
                for x in range(left,right):
                    if (x,y) in seen:
                        continue
                    seen.add((x,y))
                    if not white(*p[ox+x,oy+y]):
                        continue
                    queue=deque([(x,y)])
                    component=[]
                    while queue:
                        u,v=queue.popleft()
                        component.append((u,v))
                        for nu,nv in ((u-1,v),(u+1,v),(u,v-1),(u,v+1)):
                            if (nu,nv) in seen or not (left<=nu<right and top<=nv<bottom):
                                continue
                            seen.add((nu,nv))
                            if white(*p[ox+nu,oy+nv]):
                                queue.append((nu,nv))
                    if not 66<=len(component)<=345:
                        continue
                    minx,maxx=min(t[0] for t in component),max(t[0] for t in component)
                    miny,maxy=min(t[1] for t in component),max(t[1] for t in component)
                    w,h=maxx-minx+1,maxy-miny+1
                    if not (13<=w<=32 and 12<=h<=31):
                        continue
                    cx,cy=(minx+maxx)/2,(miny+maxy)/2
                    score=((cx-ex-12)/1.1)**2+(cy-ey-10)**2+abs(len(component)-218)/13
                    choices.append((score,component))
            if not choices:
                continue
            component=min(choices,key=lambda group:group[0])[1]
            for x,y in component:
                r,g,b,a=p[ox+x,oy+y]
                brightness=(r+g+b)/3
                p[ox+x,oy+y]=(255,round(190+brightness/255*40),round(25+brightness/255*36),a)
            corrected+=1
    if corrected<60:
        raise RuntimeError(f"Iris identification incomplete: {corrected}/64. Not saving any asset.")
    im.save(path,optimize=True)
    print(f"Zebra atlas: {corrected}/64 golden irises, white coat, black stripes; all poses kept.")

if __name__=="__main__":
    fix()
