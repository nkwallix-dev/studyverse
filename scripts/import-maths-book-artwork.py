#!/usr/bin/env python3
"""Import the user's provided original screenshot ZIP as faithful reference art.

Does not hallucinate diagrams or recreate colors/labels. Converts each supplied
image losslessly in geometry (WebP) and keeps the correct screenshot ordering.
"""
from io import BytesIO
from pathlib import Path
import re
import sys
from zipfile import ZipFile
from PIL import Image

def main(zip_path, output):
    output.mkdir(parents=True, exist_ok=True)
    with ZipFile(zip_path) as archive:
        files = sorted(name for name in archive.namelist() if name.lower().endswith(".png"))
        if len(files) != 15:
            raise ValueError(f"Expected 15 source screenshots, found {len(files)}")
        for page, name in enumerate(files, 1):
            with Image.open(BytesIO(archive.read(name))) as im:
                im.convert("RGB").save(output / f"book-page-{page}.webp", "WEBP", quality=91, method=6)
                print(f"Original {page:02d}: {im.width}x{im.height} {name}")
        # Exact problem boundaries from ORIGINAL screenshot 11, not guessed
        # from the neighboring page. Preserve printed diagram colors/labels.
        with Image.open(BytesIO(archive.read(files[10]))) as im:
            for number,rect in {
                "1-79": (0, 110, im.width, 243),
                "1-80": (0, 242, im.width, 420),
                "1-81": (0, 417, im.width, 588),
            }.items():
                im.crop(rect).convert("RGB").save(output / f"book-{number}.webp", "WEBP", quality=94, method=6)
        # Drone example is on screenshot 13; source includes all four parts.
        with Image.open(BytesIO(archive.read(files[12]))) as im:
            im.crop((0, 365, im.width, 567)).convert("RGB").save(output / "book-1-100.webp", "WEBP", quality=94, method=6)
    print("Imported 15 original pages and four exact word-problem crops.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: import-maths-book-artwork.py original.zip public/maths/sa-01/original-figures/")
    main(Path(sys.argv[1]), Path(sys.argv[2]))
