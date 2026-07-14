"""Diffusion package exports.

Keep the public runner lazy so low-level modules can be imported by the
deep-learning surrogate without triggering the full API task chain.
"""


def run_diffusion_simulation_task(payload):
    from .diffusion_runner import run_diffusion_simulation_task as _run

    return _run(payload)

__all__ = ["run_diffusion_simulation_task"]
