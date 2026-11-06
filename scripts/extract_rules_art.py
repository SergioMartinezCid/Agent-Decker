#!/usr/bin/env python3
"""Crop the diagrams out of the Agent Decker rulebook for the in-app rules.

Agent Decker by Manuel Correia, CC BY-NC 4.0. Diagrams are cropped and
rasterised without other changes.

usage: extract_rules_art.py <rules.pdf> <out_dir>
"""
import sys
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image

# (page, x0, y0, x1, y1) in PDF points (the rulebook is A4 landscape).
CROPS = {
    "card-anatomy": (0, 258, 350, 393, 442),
    "line": (0, 613, 302, 806, 356),
    "setup": (1, 34, 90, 230, 222),
    "scroll": (1, 229, 503, 415, 538),
}


def main() -> None:
    pdf, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(pdf)
    for name, (pg, x0, y0, x1, y1) in CROPS.items():
        clip = pymupdf.Rect(x0, y0, x1, y1)
        zoom = 1200 / clip.width
        pix = doc[pg].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip)
        img = Image.open(BytesIO(pix.tobytes("png"))).convert("RGB")
        img.save(out / f"{name}.webp", "WEBP", quality=82, method=6)
    print(f"{len(CROPS)} diagrams -> {out}")


if __name__ == "__main__":
    main()
