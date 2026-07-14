"""Validate source localization against Prairie Grass D6589 arc observations.

This is a real-field, wind-aligned source-geometry validation: the source is
known to be at ``(0, 0)``, receptors are the Design2 Prairie Grass arc samples,
and observations are the measured ``c/q`` responses derived from PGARCS.DAT.

The validation deliberately separates source localization from concentration
shape reconstruction. Passing the localization checks means the model can find
the known release point in this classic field geometry; it does not mean the
deep surrogate has matched every measured arc concentration or that chemical
park production sensor telemetry exists.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from pathlib import Path
from statistics import mean

import numpy as np

from .forward_model import MIN_EMISSION_RATE, ForwardModel


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_PATH = (
    REPOSITORY_ROOT
    / "datasets"
    / "processed"
    / "prairie_grass"
    / "prairie_grass_arc_observations.csv"
)
DEFAULT_OUTPUT_PATH = REPOSITORY_ROOT / "output" / "prairie_grass_source_inversion_validation.json"

SOURCE_X_M = 0.0
SOURCE_Y_M = 0.0
DEFAULT_X_BOUNDS_M = (-100.0, 100.0)
DEFAULT_Y_BOUNDS_M = (-150.0, 150.0)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--output-path", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--grid-step-m", type=float, default=5.0)
    parser.add_argument("--chunk-size", type=int, default=128)
    parser.add_argument("--max-crosswind-m", type=float, default=300.0)
    parser.add_argument("--min-rows-per-experiment", type=int, default=25)
    args = parser.parse_args()

    rows = load_rows(args.data_path)
    candidates = candidate_grid(DEFAULT_X_BOUNDS_M, DEFAULT_Y_BOUNDS_M, args.grid_step_m)
    experiment_results = validate_experiments(
        rows=rows,
        candidates=candidates,
        chunk_size=max(int(args.chunk_size), 16),
        max_crosswind_m=float(args.max_crosswind_m),
        min_rows_per_experiment=max(int(args.min_rows_per_experiment), 5),
    )
    report = build_report(rows, experiment_results, candidates, args)

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

    if not report["acceptance"]["sourceLocalizationPassed"]:
        sys.exit(1)


def load_rows(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"Prairie Grass processed file not found: {path}. "
            "Run `python tools\\prepare_prairie_grass_source_validation_data.py --write` first."
        )
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = [row for row in reader]
    if not rows:
        raise ValueError(f"No rows loaded from {path}")
    return rows


def validate_experiments(
    rows: list[dict],
    candidates: np.ndarray,
    chunk_size: int,
    max_crosswind_m: float,
    min_rows_per_experiment: int,
) -> list[dict]:
    grouped: dict[int, list[dict]] = {}
    for row in rows:
        grouped.setdefault(int(row["experiment_id"]), []).append(row)

    results = []
    for experiment_id in sorted(grouped):
        selected = [
            row
            for row in grouped[experiment_id]
            if float(row["c_over_q"]) > 0.0
            and 50.0 <= float(row["actual_distance_m"]) <= 800.0
            and abs(float(row["crosswind_m"])) <= max_crosswind_m
        ]
        if len(selected) < min_rows_per_experiment:
            continue

        release_height = float(selected[0]["release_height_m"])
        sensors = [
            {
                "id": f"PG-{experiment_id}-{idx}",
                "x": float(row["actual_distance_m"]),
                "y": float(row["crosswind_m"]),
                "signal": float(row["c_over_q"]),
            }
            for idx, row in enumerate(selected, start=1)
        ]
        scenario = {
            "windDirection": 0.0,
            "windSpeed": 5.0,
            "stabilityClass": "D",
            "releaseHeight": release_height,
            "mapMetersPerUnit": 1.0,
            "mixingHeightM": 3.0,
        }
        gas = {
            "molarMass": 28.97,
            "densityRatio": 1.0,
            "diffusivityM2s": 2.0e-5,
            "diffusionBias": 1.0,
        }
        forward_model = ForwardModel.from_scenario(sensors, scenario, gas)
        observed = np.asarray([float(row["c_over_q"]) for row in selected], dtype=float)
        best = find_best_source(forward_model, observed, candidates, chunk_size)
        source_error_m = math.hypot(best["sourceX"], best["sourceY"])
        results.append(
            {
                "experimentId": experiment_id,
                "date": selected[0]["date"],
                "sampleTime": selected[0]["sample_time"],
                "rows": len(selected),
                "releaseHeightM": release_height,
                "knownSource": {"xM": SOURCE_X_M, "yM": SOURCE_Y_M},
                "estimatedSource": {
                    "xM": round(best["sourceX"], 3),
                    "yM": round(best["sourceY"], 3),
                    "scaleQ": round(best["scaleQ"], 6),
                },
                "sourceLocationErrorM": round(source_error_m, 3),
                "metrics": {
                    "logRmse": round(best["logRmse"], 6),
                    "rmseCOverQ": round(best["rmse"], 6),
                    "nmse": round(best["nmse"], 6),
                    "fac2": round(best["fac2"], 6),
                },
                "bestAtSearchBoundary": bool(best["atBoundary"]),
            }
        )
    if not results:
        raise ValueError("No Prairie Grass experiments had enough usable positive c/q samples")
    return results


def candidate_grid(
    x_bounds: tuple[float, float],
    y_bounds: tuple[float, float],
    step_m: float,
) -> np.ndarray:
    if step_m <= 0.0:
        raise ValueError("grid step must be positive")
    xs = np.arange(x_bounds[0], x_bounds[1] + step_m * 0.5, step_m, dtype=float)
    ys = np.arange(y_bounds[0], y_bounds[1] + step_m * 0.5, step_m, dtype=float)
    grid = np.asarray([(x, y, 1.0) for x in xs for y in ys], dtype=float)
    inside = (
        (grid[:, 0] >= x_bounds[0])
        & (grid[:, 0] <= x_bounds[1])
        & (grid[:, 1] >= y_bounds[0])
        & (grid[:, 1] <= y_bounds[1])
    )
    if not np.all(inside):
        raise AssertionError("candidate source grid exceeded declared validation bounds")
    return grid


def find_best_source(
    forward_model: ForwardModel,
    observed: np.ndarray,
    candidates: np.ndarray,
    chunk_size: int,
) -> dict:
    best = {
        "loss": float("inf"),
        "sourceX": 0.0,
        "sourceY": 0.0,
        "scaleQ": MIN_EMISSION_RATE,
        "logRmse": float("inf"),
        "rmse": float("inf"),
        "nmse": float("inf"),
        "fac2": 0.0,
        "atBoundary": False,
    }
    for start in range(0, len(candidates), chunk_size):
        chunk = candidates[start : start + chunk_size]
        unit = forward_model.predict_batch(chunk)
        denom = np.sum(unit * unit, axis=1)
        scale_q = np.where(denom > 1.0e-18, unit.dot(observed) / denom, MIN_EMISSION_RATE)
        scale_q = np.maximum(scale_q, MIN_EMISSION_RATE)
        predicted = unit * scale_q[:, None]
        log_residual = np.log1p(predicted) - np.log1p(observed[None, :])
        losses = np.mean(log_residual * log_residual, axis=1)
        local_index = int(np.argmin(losses))
        local_loss = float(losses[local_index])
        if local_loss >= best["loss"]:
            continue

        pred = predicted[local_index]
        rmse = float(np.sqrt(np.mean((pred - observed) ** 2)))
        log_rmse = float(np.sqrt(local_loss))
        nmse_denom = max(float(np.mean(pred) * np.mean(observed)), 1.0e-12)
        nmse = float(np.mean((pred - observed) ** 2) / nmse_denom)
        ratio = np.maximum(pred, 1.0e-12) / np.maximum(observed, 1.0e-12)
        fac2 = float(np.mean((ratio >= 0.5) & (ratio <= 2.0)))
        sx = float(chunk[local_index, 0])
        sy = float(chunk[local_index, 1])
        best = {
            "loss": local_loss,
            "sourceX": sx,
            "sourceY": sy,
            "scaleQ": float(scale_q[local_index]),
            "logRmse": log_rmse,
            "rmse": rmse,
            "nmse": nmse,
            "fac2": fac2,
            "atBoundary": (
                sx in DEFAULT_X_BOUNDS_M
                or sy in DEFAULT_Y_BOUNDS_M
            ),
        }
    return best


def build_report(
    rows: list[dict],
    experiment_results: list[dict],
    candidates: np.ndarray,
    args: argparse.Namespace,
) -> dict:
    errors = np.asarray([float(item["sourceLocationErrorM"]) for item in experiment_results], dtype=float)
    fac2_values = [float(item["metrics"]["fac2"]) for item in experiment_results]
    boundary_hits = sum(1 for item in experiment_results if item["bestAtSearchBoundary"])
    pass_rate_50 = float(np.mean(errors <= 50.0))
    pass_rate_80 = float(np.mean(errors <= 80.0))
    summary = {
        "experimentsEvaluated": len(experiment_results),
        "rawRowsAvailable": len(rows),
        "candidateSourceCount": int(len(candidates)),
        "medianSourceErrorM": round(percentile(errors, 50), 3),
        "p75SourceErrorM": round(percentile(errors, 75), 3),
        "p90SourceErrorM": round(percentile(errors, 90), 3),
        "maxSourceErrorM": round(float(np.max(errors)), 3),
        "passRateWithin50m": round(pass_rate_50, 6),
        "passRateWithin80m": round(pass_rate_80, 6),
        "boundaryHitCount": boundary_hits,
        "boundaryHitRate": round(boundary_hits / len(experiment_results), 6),
        "meanFac2": round(mean(fac2_values), 6),
        "medianFac2": round(percentile(np.asarray(fac2_values, dtype=float), 50), 6),
    }
    thresholds = {
        "minExperiments": 50,
        "medianSourceErrorM": 50.0,
        "p90SourceErrorM": 80.0,
        "maxSourceErrorM": 120.0,
        "minPassRateWithin80m": 0.90,
        "maxBoundaryHitRate": 0.05,
        "minMeanFac2ForConcentrationShape": 0.50,
    }
    source_localization_passed = (
        summary["experimentsEvaluated"] >= thresholds["minExperiments"]
        and summary["medianSourceErrorM"] <= thresholds["medianSourceErrorM"]
        and summary["p90SourceErrorM"] <= thresholds["p90SourceErrorM"]
        and summary["maxSourceErrorM"] <= thresholds["maxSourceErrorM"]
        and summary["passRateWithin80m"] >= thresholds["minPassRateWithin80m"]
        and summary["boundaryHitRate"] <= thresholds["maxBoundaryHitRate"]
    )
    concentration_shape_passed = summary["meanFac2"] >= thresholds["minMeanFac2ForConcentrationShape"]
    if source_localization_passed and concentration_shape_passed:
        decision = "pass"
    elif source_localization_passed:
        decision = "limited_pass_location_only"
    else:
        decision = "fail"

    return {
        "dataset": "Prairie Grass D6589 real field arc observations",
        "source": "HARMO classic dispersion datasets / ASTM D6589 archive",
        "processedDataPath": str(args.data_path),
        "outputPath": str(args.output_path),
        "truth": {
            "knownSource": {"xM": SOURCE_X_M, "yM": SOURCE_Y_M},
            "coordinateFrame": "Design2 wind-aligned local meters",
        },
        "method": {
            "forwardModel": "algorithm.inversion.forward_model.ForwardModel",
            "runtime": "physics-informed PyTorch deep surrogate plus physical anchor",
            "search": "bounded deterministic grid with analytic scale fit per candidate",
            "gridStepM": float(args.grid_step_m),
            "xBoundsM": list(DEFAULT_X_BOUNDS_M),
            "yBoundsM": list(DEFAULT_Y_BOUNDS_M),
            "boundaryViolationCount": 0,
            "filters": {
                "positiveCOverQOnly": True,
                "distanceRangeM": [50.0, 800.0],
                "maxAbsCrosswindM": float(args.max_crosswind_m),
                "minRowsPerExperiment": int(args.min_rows_per_experiment),
            },
        },
        "summary": summary,
        "acceptance": {
            "thresholds": thresholds,
            "sourceLocalizationPassed": source_localization_passed,
            "concentrationShapePassed": concentration_shape_passed,
            "decision": decision,
            "processExitRule": (
                "exit 1 only when source localization fails; limited location-only "
                "passes remain exit 0 but must not be described as full concentration validation"
            ),
        },
        "validation": {
            "experiments": experiment_results,
            "worstBySourceError": sorted(
                experiment_results,
                key=lambda item: float(item["sourceLocationErrorM"]),
                reverse=True,
            )[:8],
        },
        "truthBoundary": (
            "This uses real Prairie Grass field arc concentrations and known source geometry. "
            "It validates bounded source localization in wind-aligned coordinates, not complete "
            "chemical-park telemetry training, accident-scale hazardous gas release physics, or "
            "independent absolute concentration reconstruction."
        ),
    }


def percentile(values: np.ndarray, q: float) -> float:
    return float(np.percentile(np.asarray(values, dtype=float), q))


if __name__ == "__main__":
    main()
