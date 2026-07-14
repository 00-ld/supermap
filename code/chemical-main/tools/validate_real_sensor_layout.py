from __future__ import annotations

import argparse
import re
from pathlib import Path


MAP_WIDTH_METERS = 1587.2
MAP_HEIGHT_METERS = 947.2
CANONICAL_SENSOR_SQL = "deploy/mysql/init.sql"
LEGACY_SENSOR_SQL = "deploy/mysql/sensor_data.sql"

FACILITY_RECTS = [
    ("pa-west-north", 248, 252, 334, 176),
    ("pa-west-south", 248, 430, 334, 242),
    ("pa-center-north", 588, 252, 168, 176),
    ("pa-center-south", 588, 430, 168, 242),
    ("tw-center", 856, 252, 90, 420),
    ("ut-center", 760, 252, 88, 420),
    ("pb-north-tank", 956, 252, 260, 170),
    ("pb-mid-process", 956, 420, 260, 116),
    ("wh-logistics", 1076, 536, 140, 126),
    ("fs-east-yard", 984, 536, 92, 126),
]


INSERT_RE = re.compile(
    r"VALUES\s*\('(?P<id>[^']+)',\s*(?P<x>[\d.]+),\s*(?P<y>[\d.]+),\s*"
    r"(?P<h>[\d.]+),\s*(?P<r>[\d.]+),\s*'(?P<gas>[^']+)',\s*'(?P<remark>[^']*)',\s*"
    r"(?P<priority>\d+),\s*(?P<risk>[\d.]+),\s*'(?P<type>[^']+)',\s*'(?P<mode>[^']+)'\)"
    r"(?:\s+ON\s+DUPLICATE\s+KEY\s+UPDATE\s+.*)?;"
)


def load_sensors(path: Path) -> list[dict]:
    sensors = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("INSERT INTO sensor "):
            continue
        match = INSERT_RE.search(line)
        if not match:
            raise AssertionError(f"could not parse sensor row: {line}")
        row = match.groupdict()
        row["x"] = float(row["x"])
        row["y"] = float(row["y"])
        row["h"] = float(row["h"])
        row["r"] = float(row["r"])
        sensors.append(row)
    return sensors


def containing_facilities(x: float, y: float) -> list[str]:
    hits = []
    for name, rx, ry, rw, rh in FACILITY_RECTS:
        if rx <= x <= rx + rw and ry <= y <= ry + rh:
            hits.append(name)
    return hits


def validate(path: Path) -> None:
    sensors = load_sensors(path)
    if not sensors:
        raise AssertionError("no sensor rows found")

    ids = set()
    same_height_points = set()
    errors = []
    for sensor in sensors:
        sid = sensor["id"]
        x = sensor["x"]
        y = sensor["y"]
        h = sensor["h"]
        if sid in ids:
            errors.append(f"duplicate id: {sid}")
        ids.add(sid)
        if not (0 <= x <= MAP_WIDTH_METERS and 0 <= y <= MAP_HEIGHT_METERS):
            errors.append(f"{sid} outside map boundary: ({x}, {y})")
        hits = containing_facilities(x, y)
        if len(hits) != 1:
            errors.append(f"{sid} belongs to {len(hits)} facilities {hits}: ({x}, {y})")
        point_key = (round(x, 2), round(y, 2), round(h, 2))
        if point_key in same_height_points:
            errors.append(f"{sid} duplicates exact point and height: {point_key}")
        same_height_points.add(point_key)
        if "GB/T 50493-2019" not in sensor["remark"]:
            errors.append(f"{sid} missing standard basis remark")

    if errors:
        raise AssertionError("\n".join(errors))
    print(f"validated {len(sensors)} sensors in {path}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate the canonical real-DOM sensor layout seed."
    )
    parser.add_argument(
        "--include-legacy-sensor-data",
        action="store_true",
        help=(
            "Also validate deploy/mysql/sensor_data.sql. This file is a legacy "
            "reference and is not part of the default canonical seed check."
        ),
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    root = Path(__file__).resolve().parents[1]
    targets = [CANONICAL_SENSOR_SQL]
    if args.include_legacy_sensor_data:
        targets.append(LEGACY_SENSOR_SQL)
    for rel in targets:
        validate(root / rel)


if __name__ == "__main__":
    main()
