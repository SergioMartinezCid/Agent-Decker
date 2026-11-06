#!/usr/bin/env python3
"""Draw the PWA icons and favicon: an "AD" monogram on the card back's split.

The design follows the Agent Decker card back (Manuel Correia, CC BY-NC 4.0):
grey above a rising diagonal, black below, "A" dark on the grey and "D" white on
the black, like AGENT / DECKER in the logo. The letters stay upright so they
remain sharp at favicon sizes. Font: Saira Semi Condensed Bold (SIL OFL 1.1,
see scripts/fonts/OFL.txt).

usage: make_icons.py <public_dir>
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT = Path(__file__).parent / "fonts" / "SairaSemiCondensed-Bold.ttf"
S = 2048  # master size; every output is downscaled from it
ANGLE = 16.0  # slope of the split, as on the card back
GREY_TOP, GREY_LINE = (138, 139, 141), (160, 161, 163)
BLACK, DARK, WHITE = (5, 6, 7), (18, 19, 20), (242, 242, 242)


def split_y(x: float) -> float:
    """y of the diagonal at x; it rises to the right through the centre."""
    return S / 2 - math.tan(math.radians(ANGLE)) * (x - S / 2)


def background() -> Image.Image:
    grad = Image.new("RGB", (1, S))
    for y in range(S):
        k = min(1.0, y / (S * 0.62))
        grad.putpixel((0, y), tuple(round(a + (b - a) * k) for a, b in zip(GREY_TOP, GREY_LINE)))
    img = Image.new("RGB", (S, S), BLACK)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (S, 0), (S, split_y(S)), (0, split_y(0))], fill=255)
    img.paste(grad.resize((S, S)), (0, 0), mask)
    return img


def monogram(scale: float) -> Image.Image:
    """Master icon with letters `scale` × the full-size layout (1.0 = regular icon)."""
    img = background()
    cap = -ImageFont.truetype(str(FONT), 1000).getbbox("H", anchor="ls")[1]
    h = S * 0.41 * scale  # cap height of each letter
    font = ImageFont.truetype(str(FONT), round(1000 * h / cap))
    ba, bd = font.getbbox("A", anchor="ls"), font.getbbox("D", anchor="ls")
    wa, wd = ba[2] - ba[0], bd[2] - bd[0]
    space, gap = S * 0.04 * scale, S * 0.03 * scale
    xa = S / 2 - (wa + space + wd) / 2
    xd = xa + wa + space
    d = ImageDraw.Draw(img)
    # "A" sits just above the line, "D" hangs just below it.
    d.text((xa - ba[0], split_y(xa + wa) - gap), "A", font=font, fill=DARK, anchor="ls")
    d.text((xd - bd[0], split_y(xd) + gap + h), "D", font=font, fill=WHITE, anchor="ls")
    return img


def save(img: Image.Image, size: int, path: Path) -> None:
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)


def main() -> None:
    out = Path(sys.argv[1])
    icons = out / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    full = monogram(1.0)
    save(full, 192, icons / "icon-192.png")
    save(full, 512, icons / "icon-512.png")
    save(full, 180, out / "apple-touch-icon.png")
    save(full, 64, out / "favicon.png")
    # Maskable: same art, letters shrunk into the central safe zone.
    save(monogram(0.78), 512, icons / "icon-maskable-512.png")
    print("icons ->", out)


if __name__ == "__main__":
    main()
