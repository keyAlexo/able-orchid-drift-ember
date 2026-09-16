#!/usr/bin/env python3
"""Create a macOS .icns from the cream-and-ink cross mark."""
from __future__ import annotations

import struct
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path("/workspace/desktop/icon.icns")
CREAM = (247, 244, 238, 255)
INK = (28, 25, 23, 255)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.22)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=CREAM)
    # Cross of Lorraine-style serif cross, matching favicon.svg proportions (32px viewBox)
    s = size / 32.0

    def rect(x, y, w, h):
        draw.rectangle(
            (round(x * s), round(y * s), round((x + w) * s) - 1, round((y + h) * s) - 1),
            fill=INK,
        )

    rect(14, 6, 4, 20)
    rect(8, 10, 16, 4)
    rect(12, 6, 8, 2)
    rect(12, 24, 8, 2)
    rect(8, 8, 2, 8)
    rect(22, 8, 2, 8)
    return img


def png_bytes(img: Image.Image) -> bytes:
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# type, pixel size
ICONS = [
    (b"icp4", 16),
    (b"icp5", 32),
    (b"icp6", 64),
    (b"ic07", 128),
    (b"ic08", 256),
    (b"ic09", 512),
    (b"ic10", 1024),
    (b"ic11", 32),   # 16@2x
    (b"ic12", 64),   # 32@2x
    (b"ic13", 256),  # 128@2x
    (b"ic14", 512),  # 256@2x
]


def main() -> None:
    chunks = []
    for ostype, px in ICONS:
        data = png_bytes(draw_icon(px))
        chunks.append(ostype + struct.pack(">I", len(data) + 8) + data)
    body = b"".join(chunks)
    OUT.write_bytes(b"icns" + struct.pack(">I", len(body) + 8) + body)
    print("wrote", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
