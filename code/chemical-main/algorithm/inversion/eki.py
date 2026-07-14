"""Ensemble Kalman Inversion (EKI) for gas source term estimation.

Implements the iterative Ensemble Kalman Inversion of Iglesias, Law & Stuart
(*Inverse Problems* 29, 2013) for the source-term estimation (STE) inverse
problem. Given a physically consistent forward operator ``G(theta)`` (see
:mod:`inversion.forward_model`) and noisy sensor observations ``y``, EKI evolves
an ensemble of candidate states

    theta = [x_s, y_s, log Q]

towards the posterior without ever computing a derivative of ``G``. The ensemble
mean is the point estimate of the source; the ensemble covariance is a direct,
physically meaningful measure of localisation uncertainty (the basis for the
confidence ellipse / radius shown to the user).

Algorithm (perturbed-observation EKI, one iteration):

    G_j        = G(theta_j)                          # forward each member
    Gbar       = mean_j G_j
    thetabar   = mean_j theta_j
    C_tg       = cov(theta, G)                        # cross-covariance
    C_gg       = cov(G, G)                            # output covariance
    theta_j   <- theta_j + C_tg (C_gg + alpha*Gamma)^-1 (y + xi_j - G_j)

where ``Gamma`` is the observation-noise covariance, ``xi_j ~ N(0, alpha*Gamma)``
are per-member perturbations, and ``alpha`` is an adaptive regularisation
(inflation) factor that controls the step size, after Iglesias (2016)
"A regularizing iterative ensemble Kalman method".

Everything here is pure numpy and runs in milliseconds for the small ensembles
(tens of members) and handful of sensors typical of a chemical-park layout, so
it is suitable for real-time, GPU-free deployment.

Typical usage:
    result = run_eki(forward_model, observed, prior_mean, prior_std)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional

import numpy as np


# Default ensemble size. Large enough to resolve a 3-D state covariance with
# margin, small enough to stay sub-millisecond per iteration on CPU.
DEFAULT_ENSEMBLE_SIZE = 64

# Default maximum number of EKI iterations. Convergence is usually reached well
# before this; the cap bounds worst-case cost.
DEFAULT_MAX_ITERATIONS = 24

# Floor on observation-noise standard deviation (ppm) so Gamma stays invertible
# even when all sensors read near zero.
MIN_NOISE_STD = 1e-3


@dataclass
class EkiResult:
    """Outcome of an Ensemble Kalman Inversion run.

    Attributes:
        mean_history: Ensemble-mean state at each iteration (incl. the
            initial ensemble), each a length-3 array ``[x, y, log Q]``.
        cov_history: Spatial (x, y) covariance matrix at each iteration,
            shape ``[2, 2]`` per entry.
        misfit_history: Data misfit (RMS, ppm) at each iteration.
        final_mean: Final ensemble-mean state ``[x, y, log Q]``.
        final_cov: Final full state covariance, shape ``[3, 3]``.
        ensemble: Final ensemble, shape ``[J, 3]``.
        iterations: Number of iterations actually performed.
        converged: Whether the convergence criterion was met.
    """

    mean_history: List[np.ndarray] = field(default_factory=list)
    cov_history: List[np.ndarray] = field(default_factory=list)
    misfit_history: List[float] = field(default_factory=list)
    final_mean: Optional[np.ndarray] = None
    final_cov: Optional[np.ndarray] = None
    ensemble: Optional[np.ndarray] = None
    iterations: int = 0
    converged: bool = False


def run_eki(
    forward: Callable[[np.ndarray], np.ndarray],
    observed: np.ndarray,
    prior_mean: np.ndarray,
    prior_std: np.ndarray,
    noise_std: np.ndarray,
    ensemble_size: int = DEFAULT_ENSEMBLE_SIZE,
    max_iterations: int = DEFAULT_MAX_ITERATIONS,
    convergence_ratio: float = 0.02,
    bounds: Optional[Dict[str, tuple]] = None,
    seed: Optional[int] = 12345,
) -> EkiResult:
    """Run regularising Ensemble Kalman Inversion for source estimation.

    Args:
        forward: Vectorised forward operator. Maps a state array ``[3]``
            ``[x, y, log Q]`` to predicted observations ``[N]``.
        observed: Observed sensor concentrations (ppm), shape ``[N]``.
        prior_mean: Prior mean state ``[x, y, log Q]``, shape ``[3]``.
        prior_std: Prior std-dev per state component, shape ``[3]``.
        noise_std: Observation-noise std-dev per sensor (ppm), shape ``[N]``.
        ensemble_size: Number of ensemble members ``J``.
        max_iterations: Maximum EKI iterations.
        convergence_ratio: Stop when the relative misfit improvement between
            iterations drops below this value.
        bounds: Optional dict with ``x``/``y``/``logq`` ``(lo, hi)`` tuples to
            clip ensemble members to the physical domain.
        seed: RNG seed for reproducibility (``None`` for nondeterministic).

    Returns:
        An :class:`EkiResult` with per-iteration mean / covariance / misfit
        histories and the final posterior estimate.
    """
    rng = np.random.default_rng(seed)
    observed = np.asarray(observed, dtype=float)
    prior_mean = np.asarray(prior_mean, dtype=float)
    prior_std = np.maximum(np.asarray(prior_std, dtype=float), 1e-6)
    noise_std = np.maximum(np.asarray(noise_std, dtype=float), MIN_NOISE_STD)

    n_obs = observed.shape[0]
    gamma = np.diag(noise_std ** 2)

    # Initial ensemble: Gaussian draw around the prior mean.
    ensemble = prior_mean[None, :] + rng.standard_normal((ensemble_size, 3)) * prior_std[None, :]
    ensemble = _apply_bounds(ensemble, bounds)

    result = EkiResult()

    def record(state_ensemble: np.ndarray) -> float:
        mean = state_ensemble.mean(axis=0)
        spatial_cov = np.cov(state_ensemble[:, :2], rowvar=False)
        if spatial_cov.shape != (2, 2):  # degenerate (J==1) guard
            spatial_cov = np.zeros((2, 2))
        predicted_mean = forward(mean)
        misfit = float(np.sqrt(np.mean((predicted_mean - observed) ** 2)))
        result.mean_history.append(mean.copy())
        result.cov_history.append(spatial_cov.copy())
        result.misfit_history.append(misfit)
        return misfit

    prev_misfit = record(ensemble)

    # Regularisation schedule: a constant inflation ``alpha = max_iterations``
    # implements the classic Iglesias-Law-Stuart discretisation, where the
    # ensemble is tempered from prior to posterior in ``max_iterations`` equal
    # pseudo-time steps (sum of 1/alpha over the run equals 1). This is markedly
    # more stable than a per-step adaptive alpha for this low-dimensional STE
    # problem and avoids both divergence (alpha too small) and stalling (alpha
    # too large).
    alpha = float(max(max_iterations, 1))

    # Require a few iterations before the convergence test can fire, so the
    # ensemble actually contracts instead of stopping on a flat first step.
    min_iterations = min(6, max_iterations)

    for iteration in range(max_iterations):
        # Forward every member: predictions has shape [J, N].
        predictions = np.stack([forward(ensemble[j]) for j in range(ensemble_size)], axis=0)

        pred_mean = predictions.mean(axis=0)
        theta_mean = ensemble.mean(axis=0)

        # Cross- and output-covariances (factor 1/(J-1) cancels in the product).
        d_theta = ensemble - theta_mean[None, :]          # [J, 3]
        d_pred = predictions - pred_mean[None, :]          # [J, N]
        c_tg = (d_theta.T @ d_pred) / (ensemble_size - 1)  # [3, N]
        c_gg = (d_pred.T @ d_pred) / (ensemble_size - 1)   # [N, N]

        # Kalman gain K = C_tg (C_gg + alpha*Gamma)^-1, solved as a linear
        # system for numerical stability.
        s_matrix = c_gg + alpha * gamma
        try:
            gain = np.linalg.solve(s_matrix.T, c_tg.T).T       # [3, N]
        except np.linalg.LinAlgError:
            gain = c_tg @ np.linalg.pinv(s_matrix)

        # Perturbed observations: y + xi_j, xi_j ~ N(0, alpha*Gamma).
        perturb = rng.standard_normal((ensemble_size, n_obs)) * (np.sqrt(alpha) * noise_std)[None, :]
        innovation = observed[None, :] + perturb - predictions  # [J, N]

        ensemble = ensemble + innovation @ gain.T              # [J, 3]
        ensemble = _apply_bounds(ensemble, bounds)

        misfit = record(ensemble)

        rel_improvement = abs(prev_misfit - misfit) / max(prev_misfit, 1e-12)
        result.iterations = iteration + 1
        if iteration + 1 >= min_iterations and rel_improvement < convergence_ratio:
            result.converged = True
            break
        prev_misfit = misfit

    result.final_mean = ensemble.mean(axis=0)
    final_cov = np.cov(ensemble, rowvar=False)
    if final_cov.shape != (3, 3):
        final_cov = np.zeros((3, 3))
    result.final_cov = final_cov
    result.ensemble = ensemble
    return result


def _apply_bounds(ensemble: np.ndarray, bounds: Optional[Dict[str, tuple]]) -> np.ndarray:
    """Clip ensemble members to physical bounds when provided.

    Args:
        ensemble: Ensemble array of shape ``[J, 3]`` (``[x, y, log Q]``).
        bounds: Optional dict with ``x``/``y``/``logq`` ``(lo, hi)`` tuples.

    Returns:
        The bounded ensemble (a copy when clipping is applied).
    """
    if not bounds:
        return ensemble
    bounded = ensemble.copy()
    if "x" in bounds:
        bounded[:, 0] = np.clip(bounded[:, 0], bounds["x"][0], bounds["x"][1])
    if "y" in bounds:
        bounded[:, 1] = np.clip(bounded[:, 1], bounds["y"][0], bounds["y"][1])
    if "logq" in bounds:
        bounded[:, 2] = np.clip(bounded[:, 2], bounds["logq"][0], bounds["logq"][1])
    return bounded


def covariance_to_radius(spatial_cov: np.ndarray, n_sigma: float = 1.0) -> float:
    """Convert a 2-D spatial covariance to a confidence radius in pixels.

    Uses the square root of the largest eigenvalue (the major semi-axis of the
    covariance ellipse) scaled by ``n_sigma``.

    Args:
        spatial_cov: 2x2 spatial covariance matrix.
        n_sigma: Number of standard deviations the radius should span.

    Returns:
        Confidence radius in map pixels.
    """
    cov = np.asarray(spatial_cov, dtype=float)
    if cov.shape != (2, 2):
        return 0.0
    eigvals = np.linalg.eigvalsh(cov)
    max_eig = float(np.max(eigvals)) if eigvals.size else 0.0
    if max_eig <= 0.0:
        return 0.0
    return n_sigma * float(np.sqrt(max_eig))


def covariance_to_equivalent_radius(spatial_cov: np.ndarray, n_sigma: float = 1.0) -> float:
    """Convert a 2-D spatial covariance to an equivalent-circle radius (pixels).

    Uses the geometric mean of the two eigenvalues, i.e. the radius of a circle
    with the same area as the covariance ellipse. Unlike the major semi-axis
    (:func:`covariance_to_radius`), this is not dominated by a single weakly
    constrained direction (typical along-wind for a steady plume), so it makes a
    well-behaved on-map localisation marker.

    Args:
        spatial_cov: 2x2 spatial covariance matrix.
        n_sigma: Number of standard deviations the radius should span.

    Returns:
        Equivalent-circle radius in map pixels.
    """
    cov = np.asarray(spatial_cov, dtype=float)
    if cov.shape != (2, 2):
        return 0.0
    eigvals = np.clip(np.linalg.eigvalsh(cov), 0.0, None)
    if eigvals.size != 2:
        return 0.0
    geo_mean = float(np.sqrt(eigvals[0] * eigvals[1]))
    if geo_mean <= 0.0:
        return 0.0
    return n_sigma * float(np.sqrt(geo_mean))
