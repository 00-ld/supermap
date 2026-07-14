"""Validate the deep gas surrogate against real BTEX tracer observations.

BTEX is a real SF6 field tracer experiment, but it is a small Alpine-valley
dataset rather than chemical-park sensor telemetry. This module therefore
trains only a residual calibration layer on top of the repository's fixed
physics-informed deep surrogate and reports explicit validation boundaries.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
import torch
from torch import nn

from .gas_surrogate import deep_sensor_response
from ..diffusion.conditioned_advection import ConditionedAdvectionParams, GasCondition


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_PATH = REPOSITORY_ROOT / "datasets" / "processed" / "btex" / "btex_training_observations.csv"
DEFAULT_OUTPUT_PATH = REPOSITORY_ROOT / "output" / "btex_real_validation.json"
DEFAULT_MODEL_PATH = REPOSITORY_ROOT / "models" / "btex_response_calibrator.pt"

FEATURE_NAMES = [
    "base_log1p_pptv",
    "along_wind_scaled",
    "cross_wind_scaled",
    "log_distance_scaled",
    "wind_speed_scaled",
    "time_since_release_scaled",
    "sample_duration_scaled",
    "source_rate_scaled",
    "release_duration_scaled",
    "smoke_discharge_scaled",
    "smoke_temp_scaled",
    "air_temp_scaled",
    "humidity_scaled",
    "pressure_scaled",
]

SF6_GAS = GasCondition(
    relative_density=5.11,
    diffusivity_m2_s=1.0e-5,
    diffusion_bias=0.9,
    molar_mass_g_mol=146.06,
)


class BTEXResidualCalibrator(nn.Module):
    """Tiny residual network for small-sample real-data calibration."""

    def __init__(self, feature_dim: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(feature_dim, 32),
            nn.SiLU(),
            nn.Dropout(p=0.05),
            nn.Linear(32, 16),
            nn.SiLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


@dataclass(frozen=True)
class TrainedCalibrator:
    model: BTEXResidualCalibrator
    mean: np.ndarray
    scale: np.ndarray
    residual_limit: float = 5.0

    @torch.inference_mode()
    def predict(self, features: np.ndarray) -> np.ndarray:
        x = standardize(features, self.mean, self.scale)
        tensor = torch.from_numpy(x.astype(np.float32, copy=False))
        self.model.eval()
        residual = self.model(tensor).cpu().numpy()
        residual = np.clip(residual, -self.residual_limit, self.residual_limit)
        return features[:, 0] + residual


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--output-path", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--epochs", type=int, default=900)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    rows = load_training_rows(args.data_path)
    ensure_release_metadata(rows)

    features = build_btex_feature_matrix(rows)
    target = rows["log1p_sf6_pptv"].to_numpy(dtype=np.float32)
    baseline = features[:, 0]

    grouped = []
    for release_id in sorted(rows["release_id"].unique()):
        test_mask = rows["release_id"].to_numpy() == release_id
        train_mask = ~test_mask
        trained = train_calibrator(
            features[train_mask],
            target[train_mask],
            epochs=args.epochs,
            seed=args.seed,
        )
        pred = trained.predict(features[test_mask])
        grouped.append(
            {
                "releaseId": release_id,
                "trainRows": int(train_mask.sum()),
                "validationRows": int(test_mask.sum()),
                "calibrated": compute_metrics(target[test_mask], pred),
                "deepSurrogateOnly": compute_metrics(target[test_mask], baseline[test_mask]),
            }
        )

    trained_all = train_calibrator(features, target, epochs=args.epochs, seed=args.seed)
    fitted_pred = trained_all.predict(features)
    source_checks = [
        localize_source(rows[rows["release_id"] == release_id].copy(), trained_all)
        for release_id in sorted(rows["release_id"].unique())
    ]
    source_localization_passed = all(
        check["estimates"]["btexCalibrated"]["passes500mCheck"] for check in source_checks
    )
    concentration_metrics = compute_metrics(target, fitted_pred)
    baseline_metrics = compute_metrics(target, baseline)

    output = {
        "dataset": "BTEX real SF6 field tracer experiment",
        "source": "https://doi.org/10.1594/PANGAEA.898761",
        "paper": "https://doi.org/10.5194/essd-12-277-2020",
        "rows": int(len(rows)),
        "featureNames": FEATURE_NAMES,
        "releaseFacts": release_facts(rows),
        "acceptance": {
            "concentrationCalibrationEvidence": "limited-small-sample",
            "sourceLocalizationThresholdM": 500.0,
            "sourceLocalizationPassed500m": source_localization_passed,
            "overallRealSourceTracingPassed": source_localization_passed,
            "decision": "fail" if not source_localization_passed else "pass",
        },
        "validation": {
            "groupHoldoutByRelease": grouped,
            "inSampleCalibrationUpperBound": concentration_metrics,
            "deepSurrogateOnlyAllRows": baseline_metrics,
            "sourceLocalization": source_checks,
        },
        "truthBoundary": (
            "Real BTEX SF6 concentrations and release masses are used. The calibrated layer "
            "is small-sample real-data evidence. BTEX source localization currently fails the "
            "500 m check, so it is not proof of real-field source-tracing accuracy and not proof "
            "that the project has chemical-park CO/NH3/CH4/O2 field telemetry training data."
        ),
    }

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    save_calibrator(args.model_path, trained_all, output, args)
    print(json.dumps(output, ensure_ascii=False, indent=2))
    if not source_localization_passed:
        sys.exit(1)


def load_training_rows(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"BTEX processed file not found: {path}")
    rows = pd.read_csv(path)
    rows = rows[rows["sf6_pptv"].notna()].copy()
    rows = rows[np.isfinite(rows["sf6_pptv"].astype(float))]
    return rows.reset_index(drop=True)


def ensure_release_metadata(rows: pd.DataFrame) -> None:
    required = ["tracer_mass_kg", "tracer_source_rate_g_s", "release_duration_h"]
    missing = [name for name in required if name not in rows.columns]
    if missing:
        raise ValueError(
            "BTEX processed data is missing real source metadata. "
            "Run `python tools\\prepare_btex_training_data.py --write` first. "
            f"Missing: {missing}"
        )


def build_btex_feature_matrix(
    rows: pd.DataFrame,
    source_x_m: float = 0.0,
    source_y_m: float = 0.0,
) -> np.ndarray:
    features = []
    for _, row in rows.iterrows():
        receptor_x = float(row["x_east_m"])
        receptor_y = float(row["y_north_m"])
        dx = receptor_x - source_x_m
        dy = receptor_y - source_y_m
        wind_to = float(row["wind_dir_deg_to"])
        along, cross = along_cross_wind(dx, dy, wind_to)
        distance = math.hypot(dx, dy)
        params = btex_params(row, wind_to)
        base_ppm = float(
            deep_sensor_response(
                source_x_m,
                source_y_m,
                receptor_x,
                receptor_y,
                float(row["tracer_source_rate_g_s"]),
                params,
            )
        )
        base_pptv = max(base_ppm * 1.0e6, 0.0)
        features.append(
            [
                math.log1p(base_pptv),
                clamp(along / 5000.0, -2.0, 2.0),
                clamp(cross / 5000.0, -2.0, 2.0),
                math.log1p(distance) / math.log1p(9000.0),
                clamp(float(row["wind_speed_m_s"]) / 10.0, 0.0, 2.0),
                clamp(float(row["time_since_release_min"]) / 360.0, -0.5, 2.0),
                clamp(float(row["sample_duration_min"]) / 120.0, 0.0, 2.0),
                math.log1p(float(row["tracer_source_rate_g_s"])) / math.log1p(100.0),
                clamp(float(row["release_duration_h"]) / 2.0, 0.0, 2.0),
                clamp(float(row["smoke_discharge_nm3_h"]) / 120000.0, 0.0, 2.0),
                clamp(float(row["smoke_temp_c"]) / 200.0, 0.0, 2.0),
                clamp((float(row["air_temp_c"]) + 20.0) / 60.0, 0.0, 2.0),
                clamp(float(row["relative_humidity_pct"]) / 100.0, 0.0, 1.5),
                clamp(float(row["pressure_hpa"]) / 1020.0, 0.8, 1.2),
            ]
        )
    return np.asarray(features, dtype=np.float32)


def btex_params(row: pd.Series, wind_to_deg_from_north: float) -> ConditionedAdvectionParams:
    # ConditionedAdvectionParams uses x-axis degrees; BTEX wind bearings are
    # compass degrees from north, so rotate them into the local east/north frame.
    wind_direction_x_axis = (90.0 - wind_to_deg_from_north) % 360.0
    return ConditionedAdvectionParams(
        source_rate_g_s=float(row["tracer_source_rate_g_s"]),
        release_duration_s=float(row["release_duration_h"]) * 3600.0,
        wind_speed_10m=max(float(row["wind_speed_m_s"]), 0.0),
        wind_direction_deg=wind_direction_x_axis,
        stability_class=stability_class_for_release(str(row["release_id"])),
        release_height_m=60.0,
        wind_reference_height_m=10.0,
        ambient_temperature_k=float(row["air_temp_c"]) + 273.15,
        pressure_pa=float(row["pressure_hpa"]) * 100.0,
        cell_size_px=20.0,
        map_meters_per_unit=1.0,
        mixing_height_m=80.0,
        gas=SF6_GAS,
    )


def stability_class_for_release(release_id: str) -> str:
    if "morning" in release_id:
        return "E"
    if "afternoon" in release_id:
        return "B"
    return "D"


def along_cross_wind(x_east_m: float, y_north_m: float, wind_to_deg_from_north: float) -> tuple[float, float]:
    theta = math.radians(wind_to_deg_from_north)
    ux = math.sin(theta)
    uy = math.cos(theta)
    along = x_east_m * ux + y_north_m * uy
    cross = -x_east_m * uy + y_north_m * ux
    return along, cross


def train_calibrator(
    features: np.ndarray,
    target: np.ndarray,
    epochs: int,
    seed: int,
) -> TrainedCalibrator:
    torch.manual_seed(seed)
    mean = features.mean(axis=0)
    scale = features.std(axis=0)
    x = torch.from_numpy(standardize(features, mean, scale).astype(np.float32, copy=False))
    residual_target = np.clip(target.astype(np.float32, copy=False) - features[:, 0], -5.0, 5.0)
    y = torch.from_numpy(residual_target.astype(np.float32, copy=False))
    model = BTEXResidualCalibrator(features.shape[1])
    optimizer = torch.optim.AdamW(model.parameters(), lr=2.0e-3, weight_decay=2.0e-3)
    loss_fn = nn.SmoothL1Loss(beta=0.15)

    for epoch in range(max(epochs, 1)):
        model.train()
        pred = model(x)
        loss = loss_fn(pred, y)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()
        if epoch == 350:
            for group in optimizer.param_groups:
                group["lr"] = 7.5e-4

    return TrainedCalibrator(model=model, mean=mean, scale=scale)


def standardize(features: np.ndarray, mean: np.ndarray, scale: np.ndarray) -> np.ndarray:
    safe_scale = np.where(scale < 1.0e-6, 1.0, scale)
    return (features - mean) / safe_scale


def compute_metrics(truth_log: np.ndarray, pred_log: np.ndarray) -> dict:
    truth_log = np.asarray(truth_log, dtype=float)
    pred_log = np.asarray(pred_log, dtype=float)
    pred_log = np.clip(pred_log, 0.0, 20.0)
    truth = np.expm1(truth_log)
    pred = np.expm1(pred_log)
    ratio = np.maximum(pred, 1e-9) / np.maximum(truth, 1e-9)
    return {
        "rmseLogPptv": float(np.sqrt(np.mean((pred_log - truth_log) ** 2))),
        "maeLogPptv": float(np.mean(np.abs(pred_log - truth_log))),
        "medianAbsLogPptv": float(np.median(np.abs(pred_log - truth_log))),
        "biasLogPptv": float(np.mean(pred_log - truth_log)),
        "fac2": float(np.mean((ratio >= 0.5) & (ratio <= 2.0))),
        "fac5": float(np.mean((ratio >= 0.2) & (ratio <= 5.0))),
        "pearsonLog": pearson(truth_log, pred_log),
        "spearmanLog": spearman(truth_log, pred_log),
    }


def pearson(a: np.ndarray, b: np.ndarray) -> float:
    if len(a) < 2 or float(np.std(a)) < 1e-12 or float(np.std(b)) < 1e-12:
        return 0.0
    return float(np.corrcoef(a, b)[0, 1])


def spearman(a: np.ndarray, b: np.ndarray) -> float:
    return pearson(rankdata(a), rankdata(b))


def rankdata(values: np.ndarray) -> np.ndarray:
    order = np.argsort(values)
    ranks = np.empty_like(order, dtype=float)
    ranks[order] = np.arange(len(values), dtype=float)
    return ranks


def localize_source(rows: pd.DataFrame, trained: TrainedCalibrator) -> dict:
    bounds = source_search_bounds(rows)
    x_values = np.linspace(bounds["xMinM"], bounds["xMaxM"], 55)
    y_values = np.linspace(bounds["yMinM"], bounds["yMaxM"], 55)
    target = rows["log1p_sf6_pptv"].to_numpy(dtype=np.float32)
    best_by_mode = {
        "deepSurrogateOnly": {"loss": float("inf"), "xEastM": 0.0, "yNorthM": 0.0},
        "btexCalibrated": {"loss": float("inf"), "xEastM": 0.0, "yNorthM": 0.0},
    }
    violation_count = 0
    for x in x_values:
        for y in y_values:
            if not (bounds["xMinM"] <= x <= bounds["xMaxM"] and bounds["yMinM"] <= y <= bounds["yMaxM"]):
                violation_count += 1
                continue
            features = build_btex_feature_matrix(rows, float(x), float(y))
            candidates = {
                "deepSurrogateOnly": features[:, 0],
                "btexCalibrated": trained.predict(features),
            }
            for mode, pred in candidates.items():
                loss = float(np.mean((np.clip(pred, 0.0, 20.0) - target) ** 2))
                if loss < best_by_mode[mode]["loss"]:
                    best_by_mode[mode] = {"loss": loss, "xEastM": float(x), "yNorthM": float(y)}
    estimates = {}
    for mode, best in best_by_mode.items():
        horizontal_error = float(math.hypot(best["xEastM"], best["yNorthM"]))
        estimates[mode] = {
            **best,
            "horizontalErrorM": horizontal_error,
            "passes500mCheck": horizontal_error <= 500.0,
        }
    return {
        "releaseId": str(rows["release_id"].iloc[0]),
        "rows": int(len(rows)),
        "knownSource": {"xEastM": 0.0, "yNorthM": 0.0},
        "estimates": estimates,
        "searchBounds": bounds,
        "boundaryViolationCount": int(violation_count),
        "methodBoundary": (
            "2-D horizontal grid search with known BTEX source rate; BTEX-calibrated "
            "mode uses the in-sample residual calibrator and must not be read as "
            "independent chemical-park localization validation."
        ),
    }


def source_search_bounds(rows: pd.DataFrame) -> dict:
    margin = 700.0
    x_min = min(float(rows["x_east_m"].min()) - margin, -margin)
    x_max = max(float(rows["x_east_m"].max()) + margin, margin)
    y_min = min(float(rows["y_north_m"].min()) - margin, -margin)
    y_max = max(float(rows["y_north_m"].max()) + margin, margin)
    return {"xMinM": x_min, "xMaxM": x_max, "yMinM": y_min, "yMaxM": y_max}


def release_facts(rows: pd.DataFrame) -> list[dict]:
    facts = []
    for release_id, group in rows.groupby("release_id"):
        row = group.iloc[0]
        facts.append(
            {
                "releaseId": str(release_id),
                "releaseStart": str(row["release_start"]),
                "releaseEnd": str(row["release_end"]),
                "durationH": float(row["release_duration_h"]),
                "tracerMassKg": float(row["tracer_mass_kg"]),
                "sourceRateGS": float(row["tracer_source_rate_g_s"]),
                "usableConcentrationRows": int(len(group)),
            }
        )
    return facts


def save_calibrator(
    path: Path,
    trained: TrainedCalibrator,
    validation: dict,
    args: argparse.Namespace,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "version": "btex-real-residual-calibrator-v1",
            "state_dict": trained.model.state_dict(),
            "feature_names": FEATURE_NAMES,
            "mean": trained.mean,
            "scale": trained.scale,
            "metadata": {
                "epochs": int(args.epochs),
                "seed": int(args.seed),
                "validation": validation,
            },
        },
        path,
    )


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(max(float(value), minimum), maximum)


def finite(values: Iterable[float]) -> list[float]:
    return [float(value) for value in values if math.isfinite(float(value))]


if __name__ == "__main__":
    main()
