# ── Stage 1: builder ──────────────────────────────────────────────────────────
# Install dependencies in an isolated layer so the final image stays lean
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system deps (libpq for asyncpg SSL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Create a non-root user — never run app containers as root
RUN useradd -m -u 1001 appuser

# Copy application code (secrets come from Dokploy env vars, not .env)
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# Single async worker — uvicorn handles concurrency via asyncio
# Increase --workers only if you scale replicas via Dokploy instead
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--log-level", "info"]
