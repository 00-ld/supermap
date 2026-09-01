"""Evaluate the operational conditioned-advection model on Copenhagen SF6 data.

The evaluator consumes the unmodified HARMO meteorology and observations from
an external data directory.  It never fits a case-specific concentration
factor: each case uses its measured W115, SIGV, SIGW and mixing height.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path

import numpy as np

from .conditioned_advection import ConditionedAdvectionParams, GasCondition
from ..deep_learning.gas_surrogate import deep_sensor_response
from .gaussian_plume import R_GAS, STANDARD_PRESSURE_PA


SF6 = GasCondition(
    relative_density=5.11,
    diffusivity_m2_s=1.0e-5,
    diffusion_bias=1.0,
    molar_mass_g_mol=146.06,
)
TEMPERATURE_K = 293.15


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def load_meteorology(path: Path) -> dict[str, dict[str, float]]:
    records: dict[str, dict[str, float]] = {}
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines()[2:]:
        fields = line.split()
        if len(fields) < 20:
            continue
        year, month, day = (int(value) for value in fields[:3])
        records[f"CPH-{1900 + year:04d}{month:02d}{day:02d}"] = {
            "wind115_m_s": float(fields[7]),
            "sigv_m_s": float(fields[11]),
            "sigw_m_s": float(fields[12]),
            "mixing_height_m": float(fields[13]),
        }
    if not records:
        raise ValueError(f"No usable meteorology rows found in {path}")
    return records


def calculate_metrics(predicted: np.ndarray, observed: np.ndarray) -> dict[str, float]:
    ratio = predicted / observed
    mean_predicted = float(np.mean(predicted))
    mean_observed = float(np.mean(observed))
    return {
        "n": int(observed.size),
        "fac2": float(np.mean((ratio >= 0.5) & (ratio <= 2.0))),
        "median_predicted_over_observed": float(np.median(ratio)),
        "fb_positive_means_overprediction": float(
            2.0 * (mean_predicted - mean_observed) / (mean_predicted + mean_observed)
        ),
        "nmse": float(np.mean((predicted - observed) ** 2) / (mean_predicted * mean_observed)),
    }


def ppm_to_ug_m3(ppm: np.ndarray) -> np.ndarray:
    return ppm * SF6.molar_mass_g_mol * STANDARD_PRESSURE_PA / (R_GAS * TEMPERATURE_K)


def evaluate_arc(
    distance_m: float,
    emission_rate_g_s: float,
    release_height_m: float,
    meteorology: dict[str, float],
    turbulence_timescale_fraction: float = 0.1,
) -> tuple[float, float, float]:
    params = ConditionedAdvectionParams(
        source_rate_g_s=emission_rate_g_s,
        release_duration_s=3600.0,
        wind_speed_10m=meteorology["wind115_m_s"],
        wind_direction_deg=0.0,
        stability_class="C",
        release_height_m=release_height_m,
        wind_reference_height_m=10.0,
        ambient_temperature_k=TEMPERATURE_K,
        pressure_pa=STANDARD_PRESSURE_PA,
        cell_size_px=20.0,
        map_meters_per_unit=1.0,
        mixing_height_m=meteorology["mixing_height_m"],
        gas=SF6,
        wind_speed_at_release_m_s=meteorology["wind115_m_s"],
        sigv_m_s=meteorology["sigv_m_s"],
        sigw_m_s=meteorology["sigw_m_s"],
        turbulence_timescale_mixing_height_fraction=turbulence_timescale_fraction,
    )
    crosswind_m = np.linspace(-8000.0, 8000.0, 32001)
    concentration = ppm_to_ug_m3(
        np.asarray(
            deep_sensor_response(
                0.0,
                0.0,
                np.full_like(crosswind_m, distance_m),
                crosswind_m,
                emission_rate_g_s,
                params,
            ),
            dtype=float,
        )
    )
    concentration = np.maximum(concentration, 0.0)
    cy_ug_m2 = float(np.trapezoid(concentration, crosswind_m))
    mean_crosswind_m = float(np.average(crosswind_m, weights=concentration))
    sigy_m = math.sqrt(float(np.average((crosswind_m - mean_crosswind_m) ** 2, weights=concentration)))
    return float(np.max(concentration)), cy_ug_m2, sigy_m


def main() -> int:
    args = parse_args()
    raw_root = args.data_root / "copenhagen_raw_HARMO"
    derived_root = args.data_root / "copenhagen_derived"
    meteorology = load_meteorology(raw_root / "MET_CPH.DAT")
    with (derived_root / "copenhagen_observations.csv").open(encoding="utf-8-sig", newline="") as handle:
        observations = list(csv.DictReader(handle))

    rows: list[dict[str, float | str | None]] = []
    for observation in observations:
        case_id = observation["experiment_id"]
        met = meteorology[case_id]
        arcmax, cy, sigy = evaluate_arc(
            float(observation["distance_km"]) * 1000.0,
            float(observation["release_rate_g_s"]),
            float(observation["release_height_m"]),
            met,
        )
        rows.append(
            {
                "experiment_id": case_id,
                "distance_km": float(observation["distance_km"]),
                "predicted_arcmax_ug_m3": arcmax,
                "observed_arcmax_ug_m3": float(observation["arcmax_ug_m3"]),
                "predicted_cy_ug_m2": cy,
                "observed_cy_ug_m2": float(observation["cy_ug_m2"]),
                "predicted_sigy_m": sigy,
                "observed_sigy_m": float(observation["sigy_m"]) if observation["sigy_m"] else None,
            }
        )

    arc_pred = np.array([float(row["predicted_arcmax_ug_m3"]) for row in rows])
    arc_obs = np.array([float(row["observed_arcmax_ug_m3"]) for row in rows])
    cy_pred = np.array([float(row["predicted_cy_ug_m2"]) for row in rows])
    cy_obs = np.array([float(row["observed_cy_ug_m2"]) for row in rows])
    sigy_rows = [row for row in rows if row["observed_sigy_m"] is not None]
    payload = {
        "data_contract": "HARMO MET_CPH.DAT + unmodified Copenhagen observations",
        "parameterization": "W115, SIGV, SIGW, ZI; TL=0.1*ZI/SIGV(SIGW); no inert-tracer mass loss",
        "metrics": {
            "arcmax": calculate_metrics(arc_pred, arc_obs),
            "cy": calculate_metrics(cy_pred, cy_obs),
            "sigy": calculate_metrics(
                np.array([float(row["predicted_sigy_m"]) for row in sigy_rows]),
                np.array([float(row["observed_sigy_m"]) for row in sigy_rows]),
            ),
        },
        "rows": rows,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload["metrics"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
