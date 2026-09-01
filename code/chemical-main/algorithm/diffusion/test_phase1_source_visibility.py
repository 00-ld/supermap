"""Regression checks for first-frame source visibility."""

from __future__ import annotations

import unittest

from .phase1_diffusion import create_phase1_diffusion_simulation


class Phase1SourceVisibilityTests(unittest.TestCase):
    def test_first_frame_contains_source_for_zero_release_duration(self) -> None:
        result = create_phase1_diffusion_simulation(
            {
                "gasId": "ch4",
                "sourceMapPoint": {"x": 500, "y": 300},
                "sourceRate": 10,
                "releaseDuration": 0,
                "releaseHeight": 2,
                "windSpeed": 2,
                "windDirection": 90,
                "frameCount": 1,
                "frameStepSec": 1,
            }
        )

        self.assertEqual(result["frames"][0]["frameIndex"], 0)
        self.assertEqual(result["frames"][0]["timeSec"], 1)
        self.assertGreater(result["frames"][0]["maxConcentration"], 0)
        self.assertTrue(result["frames"][0]["cells"])
        self.assertTrue(result["frames"][0]["volumeCells"])


if __name__ == "__main__":
    unittest.main()
