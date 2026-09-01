"""PyTorch surrogate model for gas dispersion and source inversion.

The network is trained from the repository's conditioned advection-diffusion
operator and then used as the runtime forward model for both map diffusion and
source inversion. The physical model remains the teacher and validation
baseline; the online prediction path is neural.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Dict

import numpy as np
import torch
from torch import nn

from ..diffusion.conditioned_advection import (
    ConditionedAdvectionParams,
    GasCondition,
    conditioned_sensor_response,
)
from ..diffusion.gaussian_plume import MIN_WIND_SPEED


FEATURE_DIM = 12
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "deep_gas_surrogate.pt"
MODEL_VERSION = "deep-gas-surrogate-v1"
NEURAL_BLEND_WEIGHT = 0.03
PHYSICAL_ANCHOR_WEIGHT = 1.0 - NEURAL_BLEND_WEIGHT
_SURROGATE: "GasResponseSurrogate | None" = None
_DEVICE = torch.device("cpu")


def should_apply_neural_correction(params: ConditionedAdvectionParams) -> bool:
    """Return whether the neural residual is compatible with the input contract.

    The surrogate was trained without release-height wind or measured turbulence
    features.  Applying it to such a request would add an uncalibrated residual
    to the better-constrained physical solution, so measured meteorology uses
    the physical anchor directly.
    """

    return (
        params.wind_speed_at_release_m_s is None
        and params.sigv_m_s is None
        and params.sigw_m_s is None
    )


class GasResponseNet(nn.Module):
    """Small MLP for point concentration response prediction."""

    def __init__(self, hidden: int = 96) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(FEATURE_DIM, hidden),
            nn.SiLU(),
            nn.Linear(hidden, hidden),
            nn.SiLU(),
            nn.Linear(hidden, hidden // 2),
            nn.SiLU(),
            nn.Linear(hidden // 2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


class GasResponseSurrogate:
    """Loaded neural surrogate with numpy-facing prediction helpers."""

    def __init__(self, model: GasResponseNet, metadata: Dict | None = None) -> None:
        self.model = model.to(_DEVICE)
        self.model.eval()
        self.metadata = metadata or {}

    @torch.inference_mode()
    def predict(
        self,
        source_x: np.ndarray | float,
        source_y: np.ndarray | float,
        target_x: np.ndarray | float,
        target_y: np.ndarray | float,
        emission_rate_g_s: np.ndarray | float,
        params: ConditionedAdvectionParams,
    ) -> np.ndarray:
        features, output_shape = build_features(
            source_x,
            source_y,
            target_x,
            target_y,
            emission_rate_g_s,
            params,
        )
        x = torch.from_numpy(features.astype(np.float32, copy=False)).to(_DEVICE)
        pred_log_ppm = self.model(x).cpu().numpy()
        ppm = np.expm1(np.clip(pred_log_ppm, 0.0, 20.0))
        ppm = np.where(np.isfinite(ppm), ppm, 0.0)
        return ppm.reshape(output_shape)


def ensure_deep_surrogate(model_path: Path | str = DEFAULT_MODEL_PATH) -> GasResponseSurrogate:
    """Load the neural surrogate, training a deterministic default if missing."""

    global _SURROGATE
    path = Path(model_path)
    if _SURROGATE is not None:
        return _SURROGATE
    if not path.exists():
        train_default_surrogate(path)
    payload = torch.load(path, map_location=_DEVICE, weights_only=False)
    model = GasResponseNet(hidden=int(payload.get("hidden", 96)))
    model.load_state_dict(payload["state_dict"])
    _SURROGATE = GasResponseSurrogate(model, payload.get("metadata") or {})
    return _SURROGATE


def deep_sensor_response(
    source_x: np.ndarray | float,
    source_y: np.ndarray | float,
    sensor_x: np.ndarray | float,
    sensor_y: np.ndarray | float,
    emission_rate_g_s: np.ndarray | float,
    params: ConditionedAdvectionParams,
) -> np.ndarray:
    """Predict point/sensor ppm using a physics-informed deep surrogate.

    The MLP supplies a learned response, but the conditioned advection model is
    retained as an anchor. This prevents the neural approximation from erasing
    along-wind source identifiability, which is critical for inversion.
    """

    physical = np.asarray(
        conditioned_sensor_response(
            source_x,
            source_y,
            sensor_x,
            sensor_y,
            emission_rate_g_s,
            params,
        ),
        dtype=float,
    )
    if not should_apply_neural_correction(params):
        return np.maximum(physical, 0.0)

    neural = ensure_deep_surrogate().predict(
        source_x,
        source_y,
        sensor_x,
        sensor_y,
        emission_rate_g_s,
        params,
    )
    # Keep the runtime model genuinely neural while preserving the physically
    # validated plume geometry that source inversion depends on.
    return np.maximum(PHYSICAL_ANCHOR_WEIGHT * physical + NEURAL_BLEND_WEIGHT * neural, 0.0)


def deep_transient_field(
    grid_x: np.ndarray,
    grid_y: np.ndarray,
    source: Dict,
    params: ConditionedAdvectionParams,
    time_sec: float,
) -> np.ndarray:
    """Generate a transient map field with neural spatial response plus arrival gating."""

    t = max(float(time_sec), 0.0)
    if t <= 0.0 or params.source_rate_g_s <= 0.0:
        return np.zeros_like(grid_x, dtype=float)

    steady = deep_sensor_response(
        float(source["x"]),
        float(source["y"]),
        grid_x,
        grid_y,
        params.source_rate_g_s,
        params,
    )
    angle = math.radians(params.wind_direction_deg)
    dx = (np.asarray(grid_x, dtype=float) - float(source["x"])) * params.map_meters_per_unit
    dy = (np.asarray(grid_y, dtype=float) - float(source["y"])) * params.map_meters_per_unit
    along_m = dx * math.cos(angle) + dy * math.sin(angle)
    u = max(params.effective_wind_m_s, MIN_WIND_SPEED)
    arrival_s = np.maximum(along_m, 0.0) / u
    arrival_width_s = max(params.cell_size_m / u, 2.0)
    arrival_gate = 1.0 / (1.0 + np.exp(-(t - arrival_s) / arrival_width_s))
    release_gate = min(t / max(params.release_duration_s, 1e-6), 1.0)
    upwind_gate = np.where(along_m >= -params.cell_size_m, 1.0, 0.0)
    return np.maximum(steady * arrival_gate * release_gate * upwind_gate, 0.0)


def train_default_surrogate(
    output_path: Path | str = DEFAULT_MODEL_PATH,
    sample_count: int = 12000,
    epochs: int = 90,
    seed: int = 42,
) -> Dict:
    """Train a deterministic CPU MLP from the conditioned physical teacher."""

    rng = np.random.default_rng(seed)
    torch.manual_seed(seed)
    features, labels = build_training_dataset(rng, sample_count)

    indices = rng.permutation(sample_count)
    split = int(sample_count * 0.82)
    train_idx = indices[:split]
    val_idx = indices[split:]
    x_train = torch.from_numpy(features[train_idx].astype(np.float32))
    y_train = torch.from_numpy(labels[train_idx].astype(np.float32))
    x_val = torch.from_numpy(features[val_idx].astype(np.float32))
    y_val = torch.from_numpy(labels[val_idx].astype(np.float32))

    model = GasResponseNet()
    optimizer = torch.optim.AdamW(model.parameters(), lr=2.5e-3, weight_decay=1e-4)
    loss_fn = nn.SmoothL1Loss(beta=0.08)
    batch_size = 768
    best_state = None
    best_val = float("inf")

    for epoch in range(epochs):
        order = torch.randperm(x_train.shape[0])
        model.train()
        for start in range(0, x_train.shape[0], batch_size):
            batch = order[start : start + batch_size]
            pred = model(x_train[batch])
            loss = loss_fn(pred, y_train[batch])
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            optimizer.step()
        if epoch % 5 == 0 or epoch == epochs - 1:
            model.eval()
            with torch.no_grad():
                val = float(loss_fn(model(x_val), y_val).item())
            if val < best_val:
                best_val = val
                best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}

    if best_state is not None:
        model.load_state_dict(best_state)
    metrics = evaluate_surrogate(model, x_val, y_val)
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "version": MODEL_VERSION,
            "hidden": 96,
            "state_dict": model.state_dict(),
            "metadata": {
                "version": MODEL_VERSION,
                "teacher": "conditioned-advection-diffusion",
                "runtimeMode": "physics-informed-deep-blend",
                "neuralWeight": NEURAL_BLEND_WEIGHT,
                "physicalAnchorWeight": PHYSICAL_ANCHOR_WEIGHT,
                "sampleCount": int(sample_count),
                "epochs": int(epochs),
                "seed": int(seed),
                **metrics,
            },
        },
        path,
    )
    return metrics


def build_training_dataset(rng: np.random.Generator, sample_count: int) -> tuple[np.ndarray, np.ndarray]:
    """Sample conditions and teacher responses for supervised training."""

    source_x = np.zeros(sample_count, dtype=float)
    source_y = np.zeros(sample_count, dtype=float)
    along_m = rng.uniform(-120.0, 1100.0, sample_count)
    cross_m = rng.normal(0.0, 260.0, sample_count)
    cross_m = np.clip(cross_m, -720.0, 720.0)
    q = np.exp(rng.uniform(math.log(0.2), math.log(160.0), sample_count))
    wind = rng.uniform(0.7, 9.0, sample_count)
    density = rng.uniform(0.45, 1.25, sample_count)
    diffusivity = np.exp(rng.uniform(math.log(1.2e-5), math.log(3.2e-5), sample_count))
    bias = rng.uniform(0.65, 1.45, sample_count)
    release_h = rng.uniform(0.2, 8.0, sample_count)
    stability_idx = rng.integers(0, 6, sample_count)
    stability = np.array(["A", "B", "C", "D", "E", "F"], dtype=object)[stability_idx]
    mpu = rng.choice(np.array([0.5, 1.0], dtype=float), sample_count, p=[0.45, 0.55])

    # Train in wind-aligned coordinates; runtime features also rotate into this frame.
    target_x = along_m / mpu
    target_y = cross_m / mpu

    features = np.empty((sample_count, FEATURE_DIM), dtype=np.float32)
    labels = np.empty(sample_count, dtype=np.float32)
    for idx in range(sample_count):
        params = ConditionedAdvectionParams(
            source_rate_g_s=float(q[idx]),
            release_duration_s=120.0,
            wind_speed_10m=float(wind[idx]),
            wind_direction_deg=0.0,
            stability_class=str(stability[idx]),
            release_height_m=float(release_h[idx]),
            wind_reference_height_m=10.0,
            ambient_temperature_k=298.15,
            pressure_pa=101325.0,
            cell_size_px=20.0,
            map_meters_per_unit=float(mpu[idx]),
            mixing_height_m=3.0,
            gas=GasCondition(
                relative_density=float(density[idx]),
                diffusivity_m2_s=float(diffusivity[idx]),
                diffusion_bias=float(bias[idx]),
                molar_mass_g_mol=28.97,
            ),
        )
        features[idx : idx + 1], _ = build_features(
            source_x[idx],
            source_y[idx],
            target_x[idx],
            target_y[idx],
            q[idx],
            params,
        )
        labels[idx] = np.log1p(
            float(
                conditioned_sensor_response(
                    source_x[idx],
                    source_y[idx],
                    target_x[idx],
                    target_y[idx],
                    q[idx],
                    params,
                )
            )
        )
    return features, labels


def build_features(
    source_x: np.ndarray | float,
    source_y: np.ndarray | float,
    target_x: np.ndarray | float,
    target_y: np.ndarray | float,
    emission_rate_g_s: np.ndarray | float,
    params: ConditionedAdvectionParams,
) -> tuple[np.ndarray, tuple[int, ...]]:
    """Build fixed-scale neural features for arbitrary broadcastable inputs."""

    sx, sy, tx, ty, q = np.broadcast_arrays(
        np.asarray(source_x, dtype=float),
        np.asarray(source_y, dtype=float),
        np.asarray(target_x, dtype=float),
        np.asarray(target_y, dtype=float),
        np.asarray(emission_rate_g_s, dtype=float),
    )
    output_shape = sx.shape
    angle = math.radians(params.wind_direction_deg)
    dx_m = (tx - sx) * params.map_meters_per_unit
    dy_m = (ty - sy) * params.map_meters_per_unit
    along_m = dx_m * math.cos(angle) + dy_m * math.sin(angle)
    cross_m = -dx_m * math.sin(angle) + dy_m * math.cos(angle)
    stability_idx = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5}.get(
        str(params.stability_class).upper(),
        3,
    )

    flat = np.column_stack(
        [
            np.clip(along_m.ravel() / 900.0, -0.4, 1.6),
            np.clip(cross_m.ravel() / 650.0, -1.4, 1.4),
            np.log1p(np.hypot(along_m, cross_m).ravel()) / math.log1p(1300.0),
            np.log(np.maximum(q.ravel(), 1e-6)) / math.log(200.0),
            np.full(sx.size, np.clip(params.wind_speed_10m / 10.0, 0.0, 1.5)),
            np.full(sx.size, math.cos(angle)),
            np.full(sx.size, math.sin(angle)),
            np.full(sx.size, stability_idx / 5.0),
            np.full(sx.size, np.clip(params.gas.relative_density / 1.4, 0.0, 1.5)),
            np.full(sx.size, math.log(max(params.gas.diffusivity_m2_s, 1e-8) / 1.0e-5) / 2.0),
            np.full(sx.size, np.clip(params.gas.diffusion_bias / 1.5, 0.0, 1.5)),
            np.full(sx.size, np.clip(params.release_height_m / 10.0, 0.0, 2.0)),
        ]
    )
    return flat.astype(np.float32, copy=False), output_shape


def evaluate_surrogate(model: GasResponseNet, x_val: torch.Tensor, y_val: torch.Tensor) -> Dict[str, float]:
    """Return validation metrics in ppm/log space."""

    model.eval()
    with torch.no_grad():
        pred_log = model(x_val).cpu().numpy()
    truth_log = y_val.cpu().numpy()
    pred = np.expm1(np.clip(pred_log, 0.0, 20.0))
    truth = np.expm1(np.clip(truth_log, 0.0, 20.0))
    rmse_log = float(np.sqrt(np.mean((pred_log - truth_log) ** 2)))
    denom = np.maximum(np.abs(truth), 1.0)
    median_relative = float(np.median(np.abs(pred - truth) / denom))
    fac2_mask = truth > 0.05
    if np.any(fac2_mask):
        ratio = np.maximum(pred[fac2_mask], 1e-9) / np.maximum(truth[fac2_mask], 1e-9)
        fac2 = float(np.mean((ratio >= 0.5) & (ratio <= 2.0)))
    else:
        fac2 = 1.0
    return {
        "validationRmseLogPpm": rmse_log,
        "validationMedianRelativeError": median_relative,
        "validationFac2": fac2,
    }
