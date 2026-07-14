# Scripts

This directory contains project-level helper scripts for development, build, data preparation, and release operations.

Rules:
- Keep reusable checks in `tools/`; use `scripts/` for workflow orchestration.
- Scripts must be idempotent where practical and must not embed secrets.
- Avoid local absolute paths unless they are clearly documented examples.
- Prefer environment variables or `.env.example` templates for configurable values.
