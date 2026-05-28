FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# Install minimal system deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential gcc libpq-dev ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

FROM base AS deps
# Copy only requirements to leverage Docker cache
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS final
COPY --from=deps /usr/local/lib/python*/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY apps/api/app ./app
COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh || true

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD ["/bin/sh", "-c", "curl -f http://localhost:${PORT:-8080}/health || exit 1"]

CMD ["/entrypoint.sh"]
