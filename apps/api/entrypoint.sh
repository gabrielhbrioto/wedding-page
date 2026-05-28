#!/usr/bin/env sh
set -e

echo "Starting entrypoint: wait for DB (if DATABASE_URL provided) and run migrations if available"

if [ -n "${DATABASE_URL}" ]; then
  echo "DATABASE_URL is set, waiting for DB to accept connections..."
  # attempt to connect using python; retry until success
  COUNTER=0
  until python - <<PY
import os, time
from urllib.parse import urlparse
try:
    import psycopg2
except Exception:
    print('psycopg2 not available, skipping DB wait')
    raise SystemExit(0)
url = os.getenv('DATABASE_URL')
if not url:
    raise SystemExit(0)
for i in range(60):
    try:
        conn = psycopg2.connect(url)
        conn.close()
        print('DB reachable')
        raise SystemExit(0)
    except Exception as e:
        print('DB not ready, retrying...', i)
        time.sleep(1)
raise SystemExit(1)
PY
  do
    COUNTER=$((COUNTER+1))
    if [ "$COUNTER" -gt 60 ]; then
      echo "DB did not become available after 60s"
      exit 1
    fi
  done
fi

# Run migrations if alembic is available
if command -v alembic >/dev/null 2>&1; then
  echo "Applying alembic migrations (alembic upgrade head)"
  alembic upgrade head || true
else
  echo "No alembic command found, skipping migrations"
fi

echo "Starting Uvicorn"
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1
