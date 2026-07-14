FROM python:3.12.10-slim
COPY --from=ghcr.io/astral-sh/uv:0.11.14 /uv /uvx /usr/local/bin/

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:${PATH}"

# Install runtime libraries used by the scientific Python stack.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Use the repository root lockfile as the single Python dependency source.
COPY pyproject.toml uv.lock ./
ARG UV_EXTRAS=""
RUN if [ -n "$UV_EXTRAS" ]; then \
        uv sync --frozen --no-dev --no-install-project --extra "$UV_EXTRAS"; \
    else \
        uv sync --frozen --no-dev --no-install-project; \
    fi

# Copy the algorithm package source.
COPY algorithm ./algorithm

# Run as a non-root user after dependencies are installed.
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000 8001

CMD ["uvicorn", "algorithm.api_server:app", "--host", "0.0.0.0", "--port", "8000"]
