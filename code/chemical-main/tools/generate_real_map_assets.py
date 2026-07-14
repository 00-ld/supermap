from __future__ import annotations

import argparse
import json
from pathlib import Path


def downsample_tiled_tiff(src: Path, dst: Path, factor: int, quality: int, write: bool) -> dict:
    import numpy as np
    import tifffile
    from PIL import Image

    if factor <= 0:
        raise ValueError("factor must be greater than 0")

    with tifffile.TiffFile(str(src)) as tif:
        page = tif.pages[0]
        if not page.is_tiled:
            raise ValueError("expected a tiled TIFF")

        height, width, samples = page.shape
        tile_w = page.tilewidth
        tile_h = page.tilelength
        out_w = width // factor
        out_h = height // factor
        out = np.zeros((out_h, out_w, 3), dtype=np.uint8)

        tiles_x = (width + tile_w - 1) // tile_w

        with src.open("rb") as fh:
            for index, (offset, bytecount) in enumerate(zip(page.dataoffsets, page.databytecounts)):
                tile_x = index % tiles_x
                tile_y = index // tiles_x
                x0 = tile_x * tile_w
                y0 = tile_y * tile_h
                x1 = min(x0 + tile_w, width)
                y1 = min(y0 + tile_h, height)
                valid_w = x1 - x0
                valid_h = y1 - y0

                fh.seek(offset)
                buf = fh.read(bytecount)

                tile = np.frombuffer(buf, dtype=page.dtype)
                tile = tile.reshape(tile_h, tile_w, samples)[:valid_h, :valid_w, :3]

                ox0 = x0 // factor
                oy0 = y0 // factor
                sample = tile[::factor, ::factor]
                oy1 = min(oy0 + sample.shape[0], out_h)
                ox1 = min(ox0 + sample.shape[1], out_w)
                out[oy0:oy1, ox0:ox1] = sample[: oy1 - oy0, : ox1 - ox0]

        if write:
            dst.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(out, mode="RGB").save(dst, quality=quality, optimize=True)

        pixel_scale = page.tags["ModelPixelScaleTag"].value
        tiepoint = page.tags["ModelTiepointTag"].value

    return {
        "source": str(src),
        "asset": str(dst),
        "sourceWidthPx": width,
        "sourceHeightPx": height,
        "assetWidthPx": out_w,
        "assetHeightPx": out_h,
        "downsampleFactor": factor,
        "metersPerSourcePixel": 0.05,
        "mapWidthMeters": round(width * 0.05, 3),
        "mapHeightMeters": round(height * 0.05, 3),
        "geoPixelScale": pixel_scale,
        "geoTiepoint": tiepoint,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate browser-safe map assets from the real DOM TIFF.")
    parser.add_argument("--src", required=True, type=Path)
    parser.add_argument("--dst", default=Path("frontend/public/maps/real-park-dom.jpg"), type=Path)
    parser.add_argument("--meta", default=Path("frontend/public/maps/real-park-dom.meta.json"), type=Path)
    parser.add_argument("--factor", default=8, type=int)
    parser.add_argument("--quality", default=90, type=int)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Actually write the JPEG and metadata files. Without this flag the script only reports the target metadata.",
    )
    args = parser.parse_args()

    if not args.src.exists():
        raise SystemExit(f"source TIFF not found: {args.src}")

    meta = downsample_tiled_tiff(args.src, args.dst, args.factor, args.quality, write=args.write)
    if args.write:
        args.meta.parent.mkdir(parents=True, exist_ok=True)
        args.meta.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        print(f"dry-run: would write map asset to {args.dst} and metadata to {args.meta}")
        print("pass --write to update the files")
    print(json.dumps(meta, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
