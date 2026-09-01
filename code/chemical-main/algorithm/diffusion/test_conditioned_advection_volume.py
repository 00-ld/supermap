"""Regression tests for the physical three-dimensional concentration solver."""

from __future__ import annotations

import unittest

import numpy as np

from .conditioned_advection import (
    ConditionedAdvectionParams,
    ConditionedAdvectionVolume,
    GasCondition,
)


def build_parameters() -> ConditionedAdvectionParams:
    return ConditionedAdvectionParams(
        source_rate_g_s=5.0,
        release_duration_s=30.0,
        wind_speed_10m=2.0,
        wind_direction_deg=0.0,
        stability_class="D",
        release_height_m=6.0,
        wind_reference_height_m=10.0,
        ambient_temperature_k=298.15,
        pressure_pa=101325.0,
        cell_size_px=10.0,
        map_meters_per_unit=1.0,
        mixing_height_m=40.0,
        gas=GasCondition(
            relative_density=0.7,
            diffusivity_m2_s=2.0e-5,
            diffusion_bias=1.0,
            molar_mass_g_mol=17.03,
        ),
    )


class ConditionedAdvectionVolumeTests(unittest.TestCase):
    def test_volume_uses_z_y_x_shape_and_release_height_layer(self) -> None:
        solver = ConditionedAdvectionVolume(
            shape=(5, 7, 9),
            source_level=2,
            source_row=3,
            source_col=2,
            params=build_parameters(),
            vertical_cell_size_m=3.0,
            vertical_velocity_m_s=0.12,
        )

        field = solver.advance_to(2.0)

        self.assertEqual(field.shape, (5, 7, 9))
        self.assertTrue(np.all(np.isfinite(field)))
        self.assertGreater(float(np.sum(field)), 0.0)
        self.assertGreater(float(np.sum(field[2:])), 0.0)

    def test_volumetric_obstacle_cells_remain_zero(self) -> None:
        blocked = np.zeros((4, 6, 8), dtype=bool)
        blocked[:, 2, 4] = True
        solver = ConditionedAdvectionVolume(
            shape=blocked.shape,
            source_level=1,
            source_row=2,
            source_col=1,
            params=build_parameters(),
            vertical_cell_size_m=4.0,
            hard_block_volume=blocked,
        )

        field = solver.advance_to(4.0)

        self.assertTrue(np.all(field[:, 2, 4] == 0.0))

    def test_source_increment_uses_voxel_volume_not_mixing_height(self) -> None:
        shallow = ConditionedAdvectionVolume(
            shape=(3, 5, 5),
            source_level=1,
            source_row=2,
            source_col=2,
            params=build_parameters(),
            vertical_cell_size_m=2.0,
        )
        tall = ConditionedAdvectionVolume(
            shape=(3, 5, 5),
            source_level=1,
            source_row=2,
            source_col=2,
            params=build_parameters(),
            vertical_cell_size_m=4.0,
        )

        shallow_total = float(np.sum(shallow.advance_to(1.0)))
        tall_total = float(np.sum(tall.advance_to(1.0)))
        self.assertAlmostEqual(shallow_total, tall_total * 2.0, places=5)


if __name__ == "__main__":
    unittest.main()
