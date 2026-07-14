"""Prepare Prairie Grass D6589 arc observations for source-inversion validation.

The HARMO/ASTM D6589 archive stores Prairie Grass observations in two useful
forms:

* ``PGARCS.DAT`` keeps the original observed arc concentrations and the release
  rate in each arc header.
* ``PGSPLUS.DAT`` is the Design2 arc listing with wind-aligned geometry:
  experiment, arc, average distance, actual distance, angular offset,
  crosswind offset, and ``c/q``.

This script joins both files row-by-row per experiment/arc so validation can
use the processed wind-aligned coordinates while retaining the raw observation
and release-rate provenance.
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE_DIR = (
    REPOSITORY_ROOT / "datasets" / "raw" / "d6589" / "archive" / "D6589" / "PrairieGrass"
)
DEFAULT_OUTPUT_PATH = (
    REPOSITORY_ROOT
    / "datasets"
    / "processed"
    / "prairie_grass"
    / "prairie_grass_arc_observations.csv"
)
DEFAULT_MANIFEST_PATH = DEFAULT_OUTPUT_PATH.with_suffix(".manifest.json")


def repo_relative(path: Path) -> str:
    resolved_path = path.resolve()
    try:
        return resolved_path.relative_to(REPOSITORY_ROOT).as_posix()
    except ValueError:
        return resolved_path.as_posix()


@dataclass(frozen=True)
class ArcMeta:
    experiment_id: int
    arc_id: int
    date: str
    sample_time: str
    distance_m: float
    source_rate_archive_units: float
    release_height_m: float
    receptor_height_m: float
    raw_rows: tuple[dict, ...]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive-dir", type=Path, default=DEFAULT_ARCHIVE_DIR)
    parser.add_argument("--output-path", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--manifest-path", type=Path, default=DEFAULT_MANIFEST_PATH)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Actually write processed CSV and manifest files. Without this flag the script only reports planned outputs.",
    )
    args = parser.parse_args()

    pgarcs_path = args.archive_dir / "ASTMEvaluation" / "PGARCS.DAT"
    pgsplus_path = args.archive_dir / "ASTMEvaluation" / "PGSPLUS.DAT"
    arc_meta = parse_pgarcs(pgarcs_path)
    rows = join_pgsplus(pgsplus_path, arc_meta)

    manifest = {
        "dataset": "Prairie Grass field experiment, HARMO/ASTM D6589 archive",
        "sourceFiles": {
            "PGARCS.DAT": repo_relative(pgarcs_path),
            "PGSPLUS.DAT": repo_relative(pgsplus_path),
        },
        "outputPath": repo_relative(args.output_path),
        "rows": len(rows),
        "experiments": len({int(row["experiment_id"]) for row in rows}),
        "arcs": len({(int(row["experiment_id"]), int(row["arc_id"])) for row in rows}),
        "truth": {"source_x_m": 0.0, "source_y_m": 0.0},
        "fieldBoundary": (
            "Coordinates are Design2 wind-aligned local meters: x=downwind actual arc "
            "distance, y=crosswind receptor offset from plume center of mass."
        ),
    }

    if args.write:
        args.output_path.parent.mkdir(parents=True, exist_ok=True)
        with args.output_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        args.manifest_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    else:
        manifest["dryRun"] = True
        manifest["writeCommand"] = "python tools/prepare_prairie_grass_source_validation_data.py --write"
        manifest["message"] = "dry-run: would write Prairie Grass processed CSV and manifest"

    print(json.dumps(manifest, ensure_ascii=False, indent=2))


def parse_pgarcs(path: Path) -> dict[tuple[int, int], ArcMeta]:
    if not path.exists():
        raise FileNotFoundError(f"PGARCS.DAT not found: {path}")
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    arcs: dict[tuple[int, int], ArcMeta] = {}
    idx = 0
    while idx < len(lines):
        line = lines[idx]
        if "," not in line or "'" not in line:
            idx += 1
            continue
        try:
            header = [part.strip().strip("'") for part in line.split(",")]
            experiment_id = int(header[0])
            arc_id = int(header[1])
            date = header[2].strip()
            sample_time = header[3].strip()
            distance_m = float(header[4])

            meta = [part.strip() for part in lines[idx + 1].split(",")]
            row_count = int(meta[0])
            source_rate = float(meta[7])
            release_height = float(meta[8])
            receptor_height = float(meta[9])
        except (IndexError, ValueError):
            idx += 1
            continue

        raw_rows = []
        for offset in range(row_count):
            parts = lines[idx + 2 + offset].split()
            if len(parts) < 4:
                continue
            raw_rows.append(
                {
                    "raw_angle_deg": float(parts[0]),
                    "raw_sample_index": int(parts[1]),
                    "raw_distance_m": float(parts[2]),
                    "observed_concentration": float(parts[3]),
                }
            )

        arcs[(experiment_id, arc_id)] = ArcMeta(
            experiment_id=experiment_id,
            arc_id=arc_id,
            date=date,
            sample_time=sample_time,
            distance_m=distance_m,
            source_rate_archive_units=source_rate,
            release_height_m=release_height,
            receptor_height_m=receptor_height,
            raw_rows=tuple(raw_rows),
        )
        idx += 2 + row_count
    if not arcs:
        raise ValueError(f"No Prairie Grass arc blocks parsed from {path}")
    return arcs


def join_pgsplus(path: Path, arc_meta: dict[tuple[int, int], ArcMeta]) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"PGSPLUS.DAT not found: {path}")
    rows: list[dict] = []
    row_index_by_arc: dict[tuple[int, int], int] = {}
    for line_number, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), start=1):
        parts = line.split()
        if len(parts) != 7:
            continue
        try:
            experiment_id = int(float(parts[0]))
            arc_id = int(float(parts[1]))
            avg_distance_m = float(parts[2])
            actual_distance_m = float(parts[3])
            dphi_deg = float(parts[4])
            crosswind_m = float(parts[5])
            c_over_q = float(parts[6].replace("D", "E"))
        except ValueError:
            continue

        key = (experiment_id, arc_id)
        if key not in arc_meta:
            raise ValueError(f"PGSPLUS row {line_number} has no PGARCS metadata for {key}")
        meta = arc_meta[key]
        raw_idx = row_index_by_arc.get(key, 0)
        if raw_idx >= len(meta.raw_rows):
            raise ValueError(f"PGSPLUS row {line_number} exceeds PGARCS row count for {key}")
        raw = meta.raw_rows[raw_idx]
        row_index_by_arc[key] = raw_idx + 1

        expected = (
            raw["observed_concentration"] / meta.source_rate_archive_units
            if meta.source_rate_archive_units > 0
            else 0.0
        )
        rows.append(
            {
                "experiment_id": experiment_id,
                "arc_id": arc_id,
                "date": meta.date,
                "sample_time": meta.sample_time,
                "avg_distance_m": avg_distance_m,
                "actual_distance_m": actual_distance_m,
                "dphi_deg": dphi_deg,
                "crosswind_m": crosswind_m,
                "c_over_q": c_over_q,
                "source_rate_archive_units": meta.source_rate_archive_units,
                "release_height_m": meta.release_height_m,
                "receptor_height_m": meta.receptor_height_m,
                "observed_concentration": raw["observed_concentration"],
                "raw_angle_deg": raw["raw_angle_deg"],
                "raw_sample_index": raw["raw_sample_index"],
                "raw_distance_m": raw["raw_distance_m"],
                "c_over_q_recomputed": expected,
                "c_over_q_abs_error": abs(c_over_q - expected),
                "known_source_x_m": 0.0,
                "known_source_y_m": 0.0,
            }
        )
    if not rows:
        raise ValueError(f"No Prairie Grass Design2 rows parsed from {path}")
    return rows


if __name__ == "__main__":
    main()
