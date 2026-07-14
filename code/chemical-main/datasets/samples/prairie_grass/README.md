# Prairie Grass Sample

This directory contains a small Prairie Grass field experiment observation sample used for reproducible gas dispersion validation.

## File

| File | Size | SHA256 |
| --- | ---: | --- |
| `PGrassOBSAnalysis.txt` | 47,878 bytes | `71CBC94880D3A51E88E6594BE62213176DD28E302503C1A72EA7610495D10397` |

## Source And Scope

- Dataset family: Prairie Grass field dispersion experiment, commonly referenced by HARMO classic dispersion datasets.
- Project source page recorded in documentation: https://www.harmo.org/classic.php
- Local import source: a local archival copy of the HARMO classic Prairie Grass sample; no personal absolute path is retained in the repository.
- Imported into Git on: 2026-06-12

## Field Usage

The automated validation uses only:

- `Exp`: experiment identifier.
- `Dist (m)`: downwind sampling arc distance.
- `Sy (m)`: observed crosswind spread.

Absolute concentration columns are retained in the source sample but are not used by the regression test, because absolute concentration validation requires additional assumptions about historical sampling, averaging, release handling, and unit conversion.

## Maintenance Rules

- Keep this sample small and text-based.
- Do not replace it with large raw archives or generated binary files.
- Any new field usage must update this README and `docs/dataset-sources.md`.
