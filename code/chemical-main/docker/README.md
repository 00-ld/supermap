# Docker

This directory is reserved for Docker build assets that are shared across services.

Rules:
- Put service-specific deployment files under `deploy/` when they are tied to server operation.
- Put shared base images, compose fragments, and container maintenance notes here.
- Do not commit generated image layers, local volumes, or runtime logs.
- Frequently maintained runtime components should be containerized with documented rebuild steps.
