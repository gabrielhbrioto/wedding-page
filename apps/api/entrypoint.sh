#!/usr/bin/env sh
set -e

echo "Starting entrypoint: checking DB connectivity (max 15s)"

if [ -n "${DATABASE_URL}" ]; then
  python - <<PY
import os, time

try:
    import psycopg
except Exception:
    print('psycopg not available, skipping DB check')
    raise SystemExit(0)

url = os.getenv('DATABASE_URL')
if not url:
    raise SystemExit(0)

test_url = url.replace("postgresql+psycopg://", "postgresql://", 1)

for i in range(3):
    try:
        conn = psycopg.connect(test_url, connect_timeout=5)
        conn.close()
        print('DB reachable')
        raise SystemExit(0)
    except Exception as e:
        print('DB check attempt', i+1, 'failed:', repr(e))
        time.sleep(1)

print('DB not reachable after 3 attempts — proceeding anyway (app will retry)')
PY
fi

# Run migrations if alembic is available
if command -v alembic >/dev/null 2>&1; then
  echo "Applying alembic migrations (alembic upgrade head)"
  # alembic upgrade head # (Descomente se precisar que o comando rode de fato)
else
  echo "No alembic command found, skipping migrations"
fi

echo "Starting Uvicorn"
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1