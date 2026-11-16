#!/usr/bin/env python3
"""Build five genuine Kenny skin spritesheets, each with idle + feeding frames.

Keep the ORIGINAL four-frame animation geometry and outlines intact; recolor
only the cobalt/cyan body pixels. The pink mouth, teeth and claws retain their
original colors. Zebra uses real body-color pixels, never a CSS overlay.
"""
from pathlib import Path
import numpy as np
from PIL import Image

SKINS = ("blue", "pink", "green", "red", "zebra")
# Pillow HSV format: hue/saturation/value all range 0..255.
PALETTES = {
    "pink":  {"body": (234,224,1.10), "belly": (230,95,1.0), "eyes": (110,228,1.0)},
    "green": {"body": (67,218,.92), "belly": (32,130,1.05), "eyes": (200,170,1.0)},
    "red":   {"body": (245,232,1.04), "belly": (228,112,1.02), "eyes": (112,226,1.0)},
}

def recolor(frame, skin):
    frame = frame.convert("RGBA")
    if skin == "blue":
        return frame.copy()
    rgba = np.asarray(frame).copy()
    hsv = np.asarray(frame.convert("RGB").convert("HSV"), dtype=np.uint8).copy()
    h,s,v = [hsv[:,:,i] for i in range(3)]
    active = rgba[:,:,3] > 10
    # Recolor only original cobalt body/stripes and light cyan belly.
    # Mouth, pink tongue, eyes, black outlines and gray claws are excluded.
    body = active & (h >= 146) & (h <= 181) & (s >= 65) & (v >= 45)
    belly = active & (h >= 118) & (h < 146) & (s >= 48) & (v >= 95)
    if skin == "zebra":
        # Original dark-blue markings become black zebra markings. The skin
        # becomes ivory-white, with the original black line art untouched.
        dark = body & (v < 190)
        light = body & ~dark
        vv=v.astype(np.int16)
        white=np.clip(209+(vv-150)*.24,170,250).astype(np.uint8)
        dark_color=np.clip(18+(vv-45)*.12,13,42).astype(np.uint8)
        for channel in range(3):
            rgba[:,:,channel][light]=white[light]
            rgba[:,:,channel][dark]=dark_color[dark]
        rgba[:,:,:3][belly]=[244,240,237]
        return Image.fromarray(rgba,"RGBA")
    palette=PALETTES[skin]
    for mask,key in ((body,"body"),(belly,"belly")):
        hue,sat,gain=palette[key]
        hsv[:,:,0][mask]=hue
        hsv[:,:,1][mask]=np.uint8(np.clip(
            sat*(.62+.38*s[mask].astype(float)/255),0,255))
        hsv[:,:,2][mask]=np.uint8(np.clip(v[mask].astype(float)*gain,0,255))
    yy,xx=np.indices(h.shape);fh,fw=h.shape
    # Iris color only (no hue-rotation of the mouth or entire dinosaur).
    eye_region=(xx>=fw*.36)&(xx<=fw*.94)&(yy<=fh*.41)
    eye=active&eye_region&(h>=19)&(h<=57)&(s>95)&(v>100)
    eh,es,egain=palette["eyes"]
    hsv[:,:,0][eye]=eh
    hsv[:,:,1][eye]=es
    hsv[:,:,2][eye]=np.uint8(np.clip(v[eye].astype(float)*egain,0,255))
    recolored=np.asarray(Image.fromarray(hsv,"HSV").convert("RGB"))
    mask=body|belly|eye
    rgba[:,:,:3][mask]=recolored[mask]
    return Image.fromarray(rgba,"RGBA")

def portrait(frame,size=540):
    box=frame.getchannel("A").getbbox()
    if box is None:return Image.new("RGBA",(size,size))
    char=frame.crop(box)
    char.thumbnail((int(size*.90),int(size*.91)),Image.Resampling.LANCZOS)
    out=Image.new("RGBA",(size,size))
    out.alpha_composite(char,((size-char.width)//2,(size-char.height)//2))
    return out

def run():
    source=Path("src/assets/kenny")
    sprites=source/"skins"
    portraits=Path("public/kenny/skins")
    sprites.mkdir(parents=True,exist_ok=True)
    portraits.mkdir(parents=True,exist_ok=True)
    for anim in ("idle","feed"):
        image=Image.open(source/f"kenny-{anim}-strip.png").convert("RGBA")
        width,height=image.size
        if width%4:
            image=image.resize((round(width/4)*4,height),Image.Resampling.LANCZOS)
            width=image.width
        cell=width//4
        original=[image.crop((cell*i,0,cell*(i+1),height)) for i in range(4)]
        for skin in SKINS:
            frames=[recolor(f,skin) for f in original]
            sheet=Image.new("RGBA",(width,height))
            for i,f in enumerate(frames):
                sheet.alpha_composite(f,(i*cell,0))
            target=sprites/f"kenny-{skin}-{anim}-strip.png"
            sheet.save(target,optimize=True)
            if anim=="idle":
                portrait(frames[0]).save(portraits/f"kenny-{skin}-portrait.png",optimize=True)
            print(f"Created {target} ({width}x{height})")
    assert len(list(sprites.glob("kenny-*-strip.png")))==10
    assert len(list(portraits.glob("kenny-*-portrait.png")))==5
    print("Ready: 10 animated spritesheets + 5 skin portraits.")

if __name__=="__main__":
    run()
