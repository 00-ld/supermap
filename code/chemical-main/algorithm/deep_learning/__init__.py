"""Deep-learning gas dispersion and inversion helpers."""

from .gas_surrogate import (
    DEFAULT_MODEL_PATH,
    deep_sensor_response,
    deep_transient_field,
    ensure_deep_surrogate,
    train_default_surrogate,
)

__all__ = [
    "DEFAULT_MODEL_PATH",
    "deep_sensor_response",
    "deep_transient_field",
    "ensure_deep_surrogate",
    "train_default_surrogate",
]
