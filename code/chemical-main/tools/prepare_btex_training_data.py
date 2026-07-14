"""Prepare BTEX field tracer observations for model training/calibration.

Input data are expected under:
    datasets/raw/btex/pangaea/datasets/

The script joins measured SF6 concentrations with nearest source-side ground
weather observations and writes compact training-ready CSV files under:
    datasets/processed/btex/

The output is intentionally ignored by Git. Keep the raw and processed data
local unless license, size, and project policy are reviewed.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RAW_DIR = REPOSITORY_ROOT / "datasets" / "raw" / "btex" / "pangaea" / "datasets"
DEFAULT_OUTPUT_DIR = REPOSITORY_ROOT / "datasets" / "processed" / "btex"

SOURCE_LAT = 46.468345
SOURCE_LON = 11.308716
SOURCE_ELEVATION_M_ASL = 307.0

RELEASES = {
    "MSP": {
        "release_id": "btex_morning_2017_02_14",
        "release_start": "2017-02-14T07:00",
        "release_end": "2017-02-14T08:00",
        "release_duration_h": 1.0,
        "tracer_mass_kg": 150.0,
        "stability_note": "stable_light_northerly",
    },
    "ASP": {
        "release_id": "btex_afternoon_2017_02_14",
        "release_start": "2017-02-14T12:45",
        "release_end": "2017-02-14T14:15",
        "release_duration_h": 1.5,
        "tracer_mass_kg": 450.0,
        "stability_note": "weak_unstable_light_southerly",
    },
}


def repo_relative(path: Path) -> str:
    resolved_path = path.resolve()
    try:
        return resolved_path.relative_to(REPOSITORY_ROOT).as_posix()
    except ValueError:
        return resolved_path.as_posix()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-dir", type=Path, default=DEFAULT_RAW_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Actually write processed CSV and manifest files. Without this flag the script only reports planned outputs.",
    )
    args = parser.parse_args()

    raw_dir = args.raw_dir
    output_dir = args.output_dir

    sf6 = read_pangaea_tab(raw_dir / "BTEX_SF6.tab")
    weather = read_pangaea_tab(raw_dir / "BTEX_Import_weatherSt.tab")
    incinerator = read_pangaea_tab(raw_dir / "BTEX_incinerator.tab")

    rows = build_training_rows(sf6, weather, incinerator)
    all_observations = pd.DataFrame(rows)
    training = all_observations[all_observations["sf6_pptv"].notna()].copy()
    censored = all_observations[all_observations["sf6_pptv"].isna()].copy()

    training_path = output_dir / "btex_training_observations.csv"
    censored_path = output_dir / "btex_censored_observations.csv"
    manifest_path = output_dir / "manifest.txt"

    if args.write:
        output_dir.mkdir(parents=True, exist_ok=True)
        training.to_csv(training_path, index=False)
        censored.to_csv(censored_path, index=False)
        manifest_path.write_text(
            "\n".join(
                [
                    "BTEX processed training data",
                    "source=https://doi.org/10.1594/PANGAEA.898761",
                    "raw_expected=datasets/raw/btex/pangaea/datasets/*.tab",
                    f"training_rows={len(training)}",
                    f"censored_rows={len(censored)}",
                    "license=CC-BY-NC-4.0 for BTEX collection/SF6/incinerator, CC-BY-4.0 for some meteorology subsets",
                    "use_boundary=local research/calibration only; do not claim chemical-park field training without park-specific data",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

    print(
        {
            "trainingPath": repo_relative(training_path),
            "censoredPath": repo_relative(censored_path),
            "trainingRows": int(len(training)),
            "censoredRows": int(len(censored)),
            "sf6PptvMin": float(training["sf6_pptv"].min()),
            "sf6PptvMax": float(training["sf6_pptv"].max()),
            **(
                {}
                if args.write
                else {
                    "dryRun": True,
                    "writeCommand": "python tools/prepare_btex_training_data.py --write",
                    "message": "dry-run: would write BTEX processed CSV and manifest",
                }
            ),
        }
    )


def read_pangaea_tab(path: Path) -> pd.DataFrame:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    header_idx = next(
        i
        for i, line in enumerate(lines)
        if line.startswith("Event\t") or line.startswith("Latitude\t")
    )
    return pd.read_csv(path, sep="\t", skiprows=header_idx, na_values=["", "NaN"])


def build_training_rows(
    sf6: pd.DataFrame,
    weather: pd.DataFrame,
    incinerator: pd.DataFrame,
) -> list[dict]:
    weather = weather.copy()
    weather["Date/Time"] = pd.to_datetime(weather["Date/Time"])
    weather["source_distance_m"] = weather.apply(
        lambda row: haversine_m(SOURCE_LAT, SOURCE_LON, row["Latitude"], row["Longitude"]),
        axis=1,
    )

    incinerator = incinerator.copy()
    incinerator["Date/Time (UTC+1)"] = pd.to_datetime(incinerator["Date/Time (UTC+1)"])

    rows: list[dict] = []
    for _, sample in sf6.iterrows():
        sample_id = str(sample["Sample ID"])
        prefix = sample_id[:3]
        release = RELEASES.get(prefix)
        if not release:
            continue

        start = pd.to_datetime(sample["Date/Time (sampling start)"])
        end = pd.to_datetime(sample["Date/Time (sampling end)"])
        mid = start + (end - start) / 2
        release_start = pd.to_datetime(release["release_start"])
        release_duration_s = float(release["release_duration_h"]) * 3600.0
        tracer_source_rate_g_s = float(release["tracer_mass_kg"]) * 1000.0 / release_duration_s
        wx = nearest_source_weather(weather, mid)
        inc = nearest_incinerator_row(incinerator, mid)

        x_east, y_north = local_xy_m(
            SOURCE_LAT,
            SOURCE_LON,
            float(sample["Latitude"]),
            float(sample["Longitude"]),
        )
        wind_from = optional_float(wx.get("dd [deg]"))
        wind_to = (wind_from + 180.0) % 360.0 if wind_from is not None else None
        along, cross = along_cross_wind(x_east, y_north, wind_to)
        sf6_pptv = optional_float(sample.get("SF6 [pptv]"))

        rows.append(
            {
                "dataset": "BTEX",
                "release_id": release["release_id"],
                "stability_note": release["stability_note"],
                "release_start": release["release_start"],
                "release_end": release["release_end"],
                "release_duration_h": release["release_duration_h"],
                "tracer_mass_kg": release["tracer_mass_kg"],
                "tracer_source_rate_g_s": tracer_source_rate_g_s,
                "sample_id": sample_id,
                "sample_start": start.isoformat(),
                "sample_end": end.isoformat(),
                "sample_mid": mid.isoformat(),
                "time_since_release_min": (mid - release_start).total_seconds() / 60.0,
                "sample_duration_min": optional_float(sample.get("Obs duration [min] (of sampling)")),
                "source_lat": SOURCE_LAT,
                "source_lon": SOURCE_LON,
                "source_elevation_m_asl": SOURCE_ELEVATION_M_ASL,
                "receptor_lat": optional_float(sample.get("Latitude")),
                "receptor_lon": optional_float(sample.get("Longitude")),
                "receptor_elevation_m_asl": optional_float(sample.get("Elevation [m a.s.l.]")),
                "x_east_m": x_east,
                "y_north_m": y_north,
                "distance_m": math.hypot(x_east, y_north),
                "bearing_deg": bearing_deg(x_east, y_north),
                "wind_station_id": wx.get("Event"),
                "wind_station_distance_to_source_m": optional_float(wx.get("source_distance_m")),
                "weather_time": pd.to_datetime(wx["Date/Time"]).isoformat(),
                "weather_time_delta_min": abs((pd.to_datetime(wx["Date/Time"]) - mid).total_seconds()) / 60.0,
                "wind_speed_m_s": optional_float(wx.get("ff [m/s]")),
                "wind_dir_deg_from": wind_from,
                "wind_dir_deg_to": wind_to,
                "along_wind_m": along,
                "cross_wind_m": cross,
                "air_temp_c": first_matching(wx, ["TTT"]),
                "relative_humidity_pct": optional_float(wx.get("RH [%]")),
                "pressure_hpa": optional_float(wx.get("PPPP [hPa]")),
                "smoke_discharge_nm3_h": optional_float(inc.get("Q smoke [Nm**3/h]")),
                "smoke_temp_c": first_matching(inc, ["T smoke"]),
                "sf6_pptv": sf6_pptv,
                "log1p_sf6_pptv": math.log1p(sf6_pptv) if sf6_pptv is not None else None,
                "method": sample.get("Method comm (VB: vacuum-filled glass bottl...)"),
            }
        )
    return rows


def nearest_source_weather(weather: pd.DataFrame, timestamp: pd.Timestamp) -> pd.Series:
    score = (
        (weather["Date/Time"] - timestamp).abs().dt.total_seconds() / 60.0
        + weather["source_distance_m"] / 1000.0
    )
    return weather.loc[score.idxmin()]


def nearest_incinerator_row(incinerator: pd.DataFrame, timestamp: pd.Timestamp) -> pd.Series:
    delta = (incinerator["Date/Time (UTC+1)"] - timestamp).abs()
    return incinerator.loc[delta.idxmin()]


def local_xy_m(source_lat: float, source_lon: float, lat: float, lon: float) -> tuple[float, float]:
    mean_lat_rad = math.radians((source_lat + lat) / 2.0)
    x = math.radians(lon - source_lon) * 6371000.0 * math.cos(mean_lat_rad)
    y = math.radians(lat - source_lat) * 6371000.0
    return x, y


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return 2 * 6371000.0 * math.asin(math.sqrt(a))


def bearing_deg(x_east_m: float, y_north_m: float) -> float:
    return (math.degrees(math.atan2(x_east_m, y_north_m)) + 360.0) % 360.0


def along_cross_wind(
    x_east_m: float,
    y_north_m: float,
    wind_to_deg: float | None,
) -> tuple[float | None, float | None]:
    if wind_to_deg is None:
        return None, None
    theta = math.radians(wind_to_deg)
    ux = math.sin(theta)
    uy = math.cos(theta)
    along = x_east_m * ux + y_north_m * uy
    cross = -x_east_m * uy + y_north_m * ux
    return along, cross


def optional_float(value: object) -> float | None:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def first_matching(row: pd.Series, needles: Iterable[str]) -> float | None:
    for column in row.index:
        if all(needle in str(column) for needle in needles):
            value = optional_float(row.get(column))
            if value is not None:
                return value
    return None


if __name__ == "__main__":
    main()
