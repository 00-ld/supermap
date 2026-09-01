"""Select one global turbulence time-scale fraction by leave-one-case-out CV."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np

from .evaluate_copenhagen_conditioned_advection import (
    calculate_metrics,
    evaluate_arc,
    load_meteorology,
)


DEFAULT_FRACTIONS = (0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.12, 0.15, 0.20)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def predict_rows(
    observations: list[dict[str, str]], meteorology: dict[str, dict[str, float]], fraction: float
) -> list[dict[str, float | str | None]]:
    rows: list[dict[str, float | str | None]] = []
    for observation in observations:
        case_id = observation["experiment_id"]
        arcmax, cy, sigy = evaluate_arc(
            float(observation["distance_km"]) * 1000.0,
            float(observation["release_rate_g_s"]),
            float(observation["release_height_m"]),
            meteorology[case_id],
            fraction,
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
    return rows


def metric_bundle(rows: list[dict[str, float | str | None]]) -> dict[str, dict[str, float]]:
    sigy_rows = [row for row in rows if row["observed_sigy_m"] is not None]
    return {
        "arcmax": calculate_metrics(
            np.array([float(row["predicted_arcmax_ug_m3"]) for row in rows]),
            np.array([float(row["observed_arcmax_ug_m3"]) for row in rows]),
        ),
        "cy": calculate_metrics(
            np.array([float(row["predicted_cy_ug_m2"]) for row in rows]),
            np.array([float(row["observed_cy_ug_m2"]) for row in rows]),
        ),
        "sigy": calculate_metrics(
            np.array([float(row["predicted_sigy_m"]) for row in sigy_rows]),
            np.array([float(row["observed_sigy_m"]) for row in sigy_rows]),
        ),
    }


def mean_absolute_log_error(rows: list[dict[str, float | str | None]]) -> float:
    predicted = np.array([float(row["predicted_arcmax_ug_m3"]) for row in rows])
    observed = np.array([float(row["observed_arcmax_ug_m3"]) for row in rows])
    return float(np.mean(np.abs(np.log(predicted / observed))))


def main() -> int:
    args = parse_args()
    meteorology = load_meteorology(args.data_root / "copenhagen_raw_HARMO" / "MET_CPH.DAT")
    with (args.data_root / "copenhagen_derived" / "copenhagen_observations.csv").open(
        encoding="utf-8-sig", newline=""
    ) as handle:
        observations = list(csv.DictReader(handle))

    predictions = {fraction: predict_rows(observations, meteorology, fraction) for fraction in DEFAULT_FRACTIONS}
    case_ids = sorted({str(row["experiment_id"]) for row in predictions[0.10]})
    held_out_rows: list[dict[str, float | str | None]] = []
    selected: list[dict[str, float | str]] = []
    for case_id in case_ids:
        scores = {}
        for fraction, rows in predictions.items():
            train_rows = [row for row in rows if row["experiment_id"] != case_id]
            scores[fraction] = mean_absolute_log_error(train_rows)
        fraction = min(scores, key=scores.get)
        held_out_rows.extend(row for row in predictions[fraction] if row["experiment_id"] == case_id)
        selected.append(
            {
                "held_out_case": case_id,
                "selected_fraction": fraction,
                "training_mean_absolute_log_error": scores[fraction],
            }
        )

    payload = {
        "selection_rule": "minimise ARCMAX mean absolute log error on the other eight experiments",
        "candidate_fractions": list(DEFAULT_FRACTIONS),
        "selected_per_held_out_case": selected,
        "loo_metrics": metric_bundle(held_out_rows),
        "held_out_rows": held_out_rows,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload["loo_metrics"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
