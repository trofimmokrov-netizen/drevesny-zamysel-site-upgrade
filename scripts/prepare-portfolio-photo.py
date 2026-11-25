"""Create branded WebP copies for the full view and gallery thumbnail.

Run with Python and Pillow. Use --help for the available options.
"""

import argparse
import io
import re
from functools import lru_cache
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image, ImageCms, ImageDraw, ImageFont, ImageOps

PORTFOLIO = Path(__file__).resolve().parents[1] / "assets" / "images" / "portfolio" / "branded"
BRAND = "Древесный Замысел"


@lru_cache
def watermark_font(size):
    for name in ("arialbd.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    raise RuntimeError("A Cyrillic font is required (Arial, DejaVu Sans or Liberation Sans).")


def read_photo(source):
    with Image.open(source) as original:
        photo = ImageOps.exif_transpose(original)
        icc_profile = original.info.get("icc_profile")
        if icc_profile:
            try:
                return ImageCms.profileToProfile(
                    photo, ImageCms.ImageCmsProfile(io.BytesIO(icc_profile)),
                    ImageCms.createProfile("sRGB"), outputMode="RGB"
                )
            except (ImageCms.PyCMSError, OSError, ValueError):
                pass
        return photo.convert("RGB")


def add_watermark(photo):
    width, height = photo.size
    short_side = min(photo.size)
    font = watermark_font(max(10, round(short_side * .027)))
    layer = Image.new("RGBA", photo.size)
    draw = ImageDraw.Draw(layer)
    left, top, right, bottom = draw.textbbox((0, 0), BRAND, font=font)
    padding = max(5, round(short_side * .012))
    margin = max(8, round(short_side * .021))
    box_width = right - left + 2 * padding
    box_height = bottom - top + 2 * padding
    x = width - margin - box_width
    y = height - margin - box_height
    draw.rounded_rectangle((x, y, width - margin, height - margin),
                           radius=padding, fill=(31, 47, 39, 158))
    draw.text((x + padding - left, y + padding - top), BRAND,
              fill=(255, 254, 250, 231), font=font)
    return Image.alpha_composite(photo.convert("RGBA"), layer).convert("RGB")


def prepare(source, name, output=PORTFOLIO):
    """Return the generated paths and their width/height pairs."""
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
        raise ValueError("Use a lower-case Latin name with digits and hyphens.")
    source = Path(source).resolve()
    output = Path(output).resolve()
    if source.is_relative_to(output):
        raise ValueError("Use an unmarked source outside the output directory.")
    photo = read_photo(source)
    if min(photo.size) < 160:
        raise ValueError("The source is too small for the portfolio.")

    output.mkdir(parents=True, exist_ok=True)
    staged = []
    with TemporaryDirectory(prefix=".prepare-", dir=output) as temporary:
        for folder, max_side, quality in ((output, 1920, 84), (output / "thumbs", 720, 79)):
            variant = photo.copy()
            variant.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
            branded = add_watermark(variant)
            target = folder / f"{name}.webp"
            staging_path = Path(temporary) / f"{max_side}.webp"
            # The rendered copy contains only pixels, with source EXIF/GPS omitted.
            branded.save(staging_path, format="WEBP", quality=quality, method=5)
            staged.append((staging_path, target, branded.size))
        for staging_path, target, _ in staged:
            target.parent.mkdir(parents=True, exist_ok=True)
            staging_path.replace(target)
    return [(target, size) for _, target, size in staged]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Unmarked original image")
    parser.add_argument("name", help="File name without extension")
    parser.add_argument("--output", type=Path, default=PORTFOLIO)
    args = parser.parse_args()
    for path, size in prepare(args.source, args.name, args.output):
        print(f"{path}  {size[0]}x{size[1]}")


if __name__ == "__main__":
    main()
