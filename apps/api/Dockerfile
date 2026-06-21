FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
 && rm -rf /var/lib/apt/lists/*

# ==========================
# DEPENDENCIES
# ==========================

FROM base AS deps

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ==========================
# RUNTIME
# ==========================

FROM base AS final

COPY --from=deps /usr/local/lib/python3.11/site-packages \
                 /usr/local/lib/python3.11/site-packages

COPY --from=deps /usr/local/bin \
                 /usr/local/bin

COPY app ./app
COPY main.py ./main.py

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

RUN adduser \
    --disabled-password \
    --gecos "" \
    appuser

USER appuser

EXPOSE 8080

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=15s \
    CMD curl -f http://localhost:${PORT:-8080} || exit 1

CMD ["/entrypoint.sh"]