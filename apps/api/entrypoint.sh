#!/usr/bin/env sh
set -e

echo "Starting entrypoint: wait for DB and run migrations if available"

if [ -n "${DATABASE_URL}" ]; then
  echo "DATABASE_URL is set, waiting for DB to accept connections..."
  COUNTER=0
  until python - <<PY
import os, time

try:
    import psycopg
except Exception:
    print('psycopg not available, skipping DB wait')
    raise SystemExit(0)

url = os.getenv('DATABASE_URL')
if not url:
    raise SystemExit(0)

# NOVIDADE: Remove o prefixo +psycopg APENAS para o teste de conexão funcionar
test_url = url.replace("postgresql+psycopg://", "postgresql://", 1)

for i in range(60):
    try:
        conn = psycopg.connect(
            test_url,
            connect_timeout=10
        )
        conn.close()
        print('DB reachable')
        raise SystemExit(0)
    except Exception as e:
        print('DB ERROR:', repr(e))
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
  # alembic upgrade head # (Descomente se precisar que o comando rode de fato)
else
  echo "No alembic command found, skipping migrations"
fi

echo "Starting Uvicorn"
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1