"""Download BTEX public field tracer data into the ignored raw-data folder."""

from __future__ import annotations

import argparse
from pathlib import Path
from urllib.request import Request, urlopen


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = REPOSITORY_ROOT / "datasets" / "raw" / "btex"

DOWNLOADS = {
    "PANGAEA.898761.zip": "https://doi.pangaea.de/10.1594/PANGAEA.898761?format=zip",
    "BTEX_OriginalFiles.zip": "https://store.pangaea.de/Publications/Falocchi-etal_2019/BTEX_OriginalFiles.zip",
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for filename, url in DOWNLOADS.items():
        destination = args.output_dir / filename
        if destination.exists() and not args.force:
            print({"status": "exists", "path": str(destination), "bytes": destination.stat().st_size})
            continue
        download(url, destination)
        print({"status": "downloaded", "path": str(destination), "bytes": destination.stat().st_size})


def download(url: str, destination: Path) -> None:
    request = Request(url, headers={"User-Agent": "Codex BTEX dataset downloader"})
    with urlopen(request, timeout=120) as response:
        with destination.open("wb") as handle:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)


if __name__ == "__main__":
    main()
