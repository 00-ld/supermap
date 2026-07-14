# Reference Materials

This directory stores public reference materials used to support project design,
sensor placement rules, safety constraints, and equipment classification.

Current inventory is intentionally explicit: `policies/` and `equipment/` contain
committed reference documents; `algorithms/` and `miscellaneous/` are placeholders
only until public, redistributable materials are added. Do not treat empty
placeholder directories as evidence for algorithm validation.

## Directory Map

| Directory | Purpose |
| --- | --- |
| `policies/` | Chemical park safety policies, standards, notices, and compliance references. |
| `algorithms/` | Placeholder for public algorithm papers, notes, and technical references. Currently no committed evidence files. |
| `equipment/` | Equipment and sensor reference materials. |
| `miscellaneous/` | Placeholder for other supporting documents. Currently no committed evidence files. |

## Rules

- Keep source documents readable and named by business meaning.
- Do not place business source code, generated build output, local notes, or temporary files here.
- Do not commit non-public, paid, confidential, or personally identifiable documents.
- Large raw datasets and model weights belong outside Git or in a documented external storage location.
- If a document is used as evidence for an algorithm or safety rule, cite it from the relevant project document.
