"""Rasterise the landing preview PDFs (page 1) to WebP for public/landing/.

Usage: python scripts/landing-previews.py <pdf-dir> <out-dir>
Run through `pnpm run landing:previews`. Needs PyMuPDF and Pillow (dev only; the app does not use them).
"""
import io
import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

WIDTHS = {"hero": 900}  # px; everything else uses DEFAULT_WIDTH
DEFAULT_WIDTH = 520


def main(pdf_dir: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    # A renamed or removed template must not leave a stale image behind.
    for stale in out_dir.glob("template-*.webp"):
        stale.unlink()
    for pdf in sorted(pdf_dir.glob("*.pdf")):
        page = fitz.open(pdf)[0]
        width = WIDTHS.get(pdf.stem, DEFAULT_WIDTH)
        zoom = width / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        target = out_dir / f"{pdf.stem}.webp"
        image.save(target, "WEBP", quality=82, method=6)
        print(f"{target.name}: {image.width}x{image.height}, {target.stat().st_size // 1024} kB")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
