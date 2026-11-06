#!/usr/bin/env python3
"""Cut the individual card faces out of AgentDecker_cards_full_art.pdf.

Agent Decker by Manuel Correia, CC BY-NC 4.0. The art is unchanged,
only cropped and rasterised.

usage: extract_cards.py <cards.pdf> <out_dir> [width_px ...]
Writes <out_dir>/<width>/<card-id>.webp for each requested width (default 400).
"""
import sys
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image

# Cut lines measured from the PDF's crop marks (points). Cards are 63 x 89 mm.
XS = [28.30, 206.88, 385.46, 564.04]
YS = [43.86, 296.14, 548.43, 800.72]
INSET = 0.6  # trims the hairline cut line drawn on the card edge

# Sheet layout, row-major, one entry per page (pages 0-6).
SHEETS = [
    ["hide", "hide", "hide", "punch", "punch", "punch", "punch", "punch", "alarm"],
    ["guard", "guard", "guard", "patrolling-guard", "patrolling-guard",
     "motion-sensor-hall", "waste-room", "waste-room", "guard-dog"],
    ["guard-dog", "sentry-gun", "security-camera", "security-camera", "security-camera",
     "security-camera", "security-camera", "gym-door", "sleeping-guard"],
    ["infirmary", "yard-door", "yard-door", "radio-tower", "mission-1", "siren",
     "locker-room", "inspector", "mission-2"],
    ["archive-door", "dormitory", "engineering-bay", "cctv-room-door", "mission-3",
     "sniper", "watchtower", "prison-door", "flammable-barrel"],
    ["guard-with-bazooka", "mission-4", "tech-container", "chain-link-fence",
     "laser-hall", "clumsy-guard", "armored-guard", "hawk", "mission-5"],
    ["back"] + [None] * 8,
]


def main() -> None:
    pdf, out = Path(sys.argv[1]), Path(sys.argv[2])
    widths = [int(w) for w in sys.argv[3:]] or [400]
    doc = pymupdf.open(pdf)
    done: set[str] = set()
    for page_no, names in enumerate(SHEETS):
        page = doc[page_no]
        for i, name in enumerate(names):
            if name is None or name in done:
                continue
            done.add(name)
            r, c = divmod(i, 3)
            clip = pymupdf.Rect(XS[c] + INSET, YS[r] + INSET, XS[c + 1] - INSET, YS[r + 1] - INSET)
            # Render once at the largest size, then downscale for the rest.
            zoom = max(widths) * 1.5 / clip.width
            pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip)
            img = Image.open(BytesIO(pix.tobytes("png"))).convert("RGB")
            for w in widths:
                h = round(w * clip.height / clip.width)
                d = out / str(w)
                d.mkdir(parents=True, exist_ok=True)
                img.resize((w, h), Image.LANCZOS).save(d / f"{name}.webp", "WEBP", quality=82, method=6)
    print(f"{len(done)} cards x {len(widths)} sizes -> {out}")


if __name__ == "__main__":
    main()
