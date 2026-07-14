# Models

This directory is the model-governance entrypoint for the repository.

- `manifest.json` is tracked and records model IDs, versions, runtime entrypoints, artifact paths, validation status, and known limits.
- Large model weights such as `.pt`, `.pth`, `.onnx`, and generated arrays stay ignored. They must be mounted, downloaded, or regenerated locally.
- Inference responses should expose the manifest-backed `modelId` and `modelVersion` so frontend results can be traced to a configured model.
- Validation claims must point back to `docs/dataset-sources.md` and `docs/algorithm-verification-report.md`.
- Never include API keys, database passwords, service credentials, or private dataset credentials in model configs.
