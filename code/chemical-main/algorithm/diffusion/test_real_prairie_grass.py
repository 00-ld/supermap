"""Validate dispersion width against the Prairie Grass field dataset.

This test uses the measured crosswind spread column ``Sy (m)`` from the
Prairie Grass observation analysis sample committed under
``datasets/samples/prairie_grass``. It does not validate absolute
concentration because that would require release averaging, sampler, and
historical unit assumptions that are outside this small regression test.

Run from the repository root:

    python -m algorithm.diffusion.test_real_prairie_grass
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

from .gaussian_plume import (
    briggs_sigma_y,
    comparison_statistics,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = REPOSITORY_ROOT / "datasets" / "samples" / "prairie_grass" / "PGrassOBSAnalysis.txt"
URBAN_TERRAIN = False


def load_prairie_grass_spread() -> dict[int, dict[str, np.ndarray]]:
    """Load observed distance and Sy values grouped by experiment number."""
    experiments: dict[int, dict[str, list[float]]] = {}
    raw_lines = DATA_FILE.read_text(encoding="utf-8").splitlines()

    for line in raw_lines:
        parts = line.split()
        if len(parts) < 12 or not parts[0].isdigit():
            continue
        try:
            experiment_id = int(parts[0])
            distance_m = float(parts[3])
            observed_sy_m = float(parts[10])
        except (IndexError, ValueError):
            continue
        if distance_m <= 0.0 or observed_sy_m <= 0.0 or not np.isfinite(observed_sy_m):
            continue

        bucket = experiments.setdefault(experiment_id, {"distance_m": [], "observed_sy_m": []})
        bucket["distance_m"].append(distance_m)
        bucket["observed_sy_m"].append(observed_sy_m)

    return {
        experiment_id: {
            "distance_m": np.asarray(values["distance_m"], dtype=float),
            "observed_sy_m": np.asarray(values["observed_sy_m"], dtype=float),
        }
        for experiment_id, values in experiments.items()
        if len(values["observed_sy_m"]) >= 2
    }


def choose_best_fit_stability(distance_m: np.ndarray, observed_sy_m: np.ndarray) -> str:
    """Choose the Pasquill class whose classic Briggs Sy has the lowest NMSE."""
    best_stability = "D"
    best_nmse = float("inf")
    for stability in "ABCDEF":
        model_sy_m = np.asarray(briggs_sigma_y(distance_m, stability, URBAN_TERRAIN), dtype=float)
        nmse = comparison_statistics(model_sy_m, observed_sy_m)["NMSE"]
        if nmse < best_nmse:
            best_nmse = nmse
            best_stability = stability
    return best_stability


def run_prairie_grass_validation() -> dict[str, object]:
    """Validate classic Briggs Sy against observed Sy on the field dataset."""
    experiments = load_prairie_grass_spread()

    observed_values: list[float] = []
    classic_values: list[float] = []

    for experiment in experiments.values():
        distance_m = experiment["distance_m"]
        observed_sy_m = experiment["observed_sy_m"]
        stability = choose_best_fit_stability(distance_m, observed_sy_m)

        classic_sy_m = np.asarray(briggs_sigma_y(distance_m, stability, URBAN_TERRAIN), dtype=float)

        observed_values.extend(observed_sy_m.tolist())
        classic_values.extend(classic_sy_m.tolist())

    observed = np.asarray(observed_values, dtype=float)
    classic = np.asarray(classic_values, dtype=float)

    classic_stats = comparison_statistics(classic, observed)

    return {
        "experiment_count": len(experiments),
        "sample_count": int(observed.size),
        "classic": classic_stats,
        "passed": (
            observed.size > 0
            # 经典 Briggs 在真实场数据上应保持合理拟合：多数样本落在
            # 观测值的 2 倍因子内（FAC2），且无系统性偏差爆炸（NMSE 有界）。
            and classic_stats["FAC2"] >= 0.8
            and classic_stats["NMSE"] <= 0.5
        ),
    }


def print_stats(label: str, stats: dict[str, float]) -> None:
    """Print a compact metric row."""
    print(f"{label:<18}{stats['FB']:>12.4f}{stats['NMSE']:>12.4f}{stats['FAC2']:>10.3f}")


def main() -> int:
    print("=" * 72)
    print("Prairie Grass Sy validation")
    print(f"Data file: {DATA_FILE}")
    print("=" * 72)

    if not DATA_FILE.exists():
        print("[FAIL] Dataset sample is missing.")
        return 1

    result = run_prairie_grass_validation()
    if result["sample_count"] == 0:
        print("[FAIL] No valid observed Sy samples were parsed.")
        return 1

    print(f"Experiments: {result['experiment_count']}")
    print(f"Distance samples: {result['sample_count']}")
    print()
    print(f"{'Model':<18}{'FB':>12}{'NMSE':>12}{'FAC2':>10}")
    print("-" * 52)
    print_stats("classic", result["classic"])
    print("-" * 52)
    print()

    if result["passed"]:
        print("[PASS] Classic Briggs Sy matches observed Sy within FAC2/NMSE bounds.")
        return 0

    print("[FAIL] Classic Briggs Sy regressed against observed field data.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
