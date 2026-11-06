#!/usr/bin/env python3
"""Build the PWA icons and favicon from the Agent Decker card back.

Agent Decker by Manuel Correia, CC BY-NC 4.0. The logo is cropped from the
card back in the print-and-play PDF.

usage: make_icons.py <cards.pdf> <public_dir>
"""
import sys
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image

# Card back = first card on the last page (see extract_cards.py for the grid).
X0, X1 = 28.30, 206.88
Y0 = 43.86


def main() -> None:
    pdf, out = Path(sys.argv[1]), Path(sys.argv[2])
    page = pymupdf.open(pdf)[6]
    w = X1 - X0
    # Square around the diagonal "AGENT DECKER" logo.
    side = w * 0.80
    cx, cy = X0 + w * 0.51, Y0 + 252.29 * 0.42
    clip = pymupdf.Rect(cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2)
    zoom = 1024 / side
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip)
    logo = Image.open(BytesIO(pix.tobytes("png"))).convert("RGB")

    icons = out / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        logo.resize((size, size), Image.LANCZOS).save(icons / f"icon-{size}.png", optimize=True)
    # Maskable: keep the logo inside the 80% safe zone on the card's black.
    bg = Image.new("RGB", (512, 512), (5, 6, 7))
    inner = logo.resize((410, 410), Image.LANCZOS)
    bg.paste(inner, (51, 51))
    bg.save(icons / "icon-maskable-512.png", optimize=True)
    logo.resize((180, 180), Image.LANCZOS).save(out / "apple-touch-icon.png", optimize=True)
    logo.resize((64, 64), Image.LANCZOS).save(out / "favicon.png", optimize=True)
    print("icons ->", out)


if __name__ == "__main__":
    main()
