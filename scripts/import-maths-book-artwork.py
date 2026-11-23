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
        # Exercise 1.80 spans two screenshots. The two original parts are
        # cropped, not redrawn, to preserve all printed math and diagrams.
        with Image.open(BytesIO(archive.read(files[9]))) as im:
            im.crop((0, 246, im.width, im.height)).convert("RGB").save(output / "book-1-80-a.webp", "WEBP", quality=93, method=6)
        with Image.open(BytesIO(archive.read(files[10]))) as im:
            im.crop((0, 0, im.width, 185)).convert("RGB").save(output / "book-1-80-b.webp", "WEBP", quality=93, method=6)
        with Image.open(BytesIO(archive.read(files[12]))) as im:
            im.crop((0, 366, im.width, 572)).convert("RGB").save(output / "book-1-100.webp", "WEBP", quality=93, method=6)
    print("Imported all 15 original pages and 3 targeted word-problem crops.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: import-maths-book-artwork.py original.zip public/maths/sa-01/original-figures/")
    main(Path(sys.argv[1]), Path(sys.argv[2]))
