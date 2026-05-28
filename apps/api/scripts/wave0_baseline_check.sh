#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${API_DIR}/../.." && pwd)"
MIGRATIONS_DIR="${ROOT_DIR}/supabase/migrations"

SKIP_DB=false
STRICT_DB=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --strict-db)
            STRICT_DB=true
            shift
            ;;
        *)
            echo "Uso: ./scripts/wave0_baseline_check.sh [--skip-db] [--strict-db]"
            exit 1
            ;;
    esac
done

echo "[Wave0] Validando inventario de migrations..."

expected=(
    "01_enums.sql"
    "02_invitation_groups.sql"
    "03_group_members.sql"
    "04_rsvp_responses.sql"
    "05_rsvp_member_status.sql"
    "06_ceremony_guest_names.sql"
    "07_event_settings.sql"
    "08_gifts.sql"
    "09_gallery_photos.sql"
    "10_updated_at_triggers.sql"
    "11_view_dashboard.sql"
    "12_view_presence_summary.sql"
    "13_admin_users.sql"
    "14_admin_audit_and_multi_login.sql"
)

missing=0
for file in "${expected[@]}"; do
    if [[ -f "${MIGRATIONS_DIR}/${file}" ]]; then
        echo "  [ok] ${file}"
    else
        echo "  [missing] ${file}"
        missing=$((missing + 1))
    fi
done

if [[ ${missing} -gt 0 ]]; then
    echo "[Wave0] Falha: ${missing} migration(s) ausente(s)."
    exit 1
fi

echo "[Wave0] Inventario de migrations valido (01-14)."

if [[ "${SKIP_DB}" == "true" ]]; then
    echo "[Wave0] Validacao de banco pulada (--skip-db)."
    echo "[Wave0] Baseline local concluido."
    exit 0
fi

echo "[Wave0] Validando artefatos no banco (tabelas + auditoria + views)..."

set +e
DB_RESULT=$(cd "${API_DIR}" && source "${API_DIR}/venv/bin/activate" && python - <<'PY'
from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.DATABASE_URL)

tables = [
    'admin_users',
    'invitation_groups',
    'group_members',
    'rsvp_responses',
    'rsvp_member_status',
    'ceremony_guest_names',
    'event_settings',
    'gifts',
    'gallery_photos',
]

with engine.connect() as conn:
    table_count = conn.execute(text("""
        select count(*)
        from information_schema.tables
        where table_schema='public'
          and table_name = any(:tables)
    """), {"tables": tables}).scalar_one()

    audit_column_count = conn.execute(text("""
        select count(*)
        from information_schema.columns
        where table_schema='public'
          and table_name = any(:tables)
          and column_name in ('created_by', 'updated_by')
    """), {"tables": tables}).scalar_one()

    view_count = conn.execute(text("""
        select count(*)
        from information_schema.views
        where table_schema='public'
          and table_name in ('vw_dashboard', 'vw_presence_summary')
    """)).scalar_one()

if table_count != 9:
    raise SystemExit(f"schema_not_ready: tables_found={table_count} expected=9")

if audit_column_count < 18:
    raise SystemExit(
        f"schema_not_ready: audit_columns_found={audit_column_count} expected_min=18",
    )

if view_count != 2:
    raise SystemExit(f"schema_not_ready: views_found={view_count} expected=2")

print(
    f"schema_ready tables={table_count} audit_columns={audit_column_count} views={view_count}",
)
PY
)
DB_EXIT=$?
set -e

if [[ ${DB_EXIT} -ne 0 ]]; then
    echo "[Wave0] Falha na validacao de banco."
    echo "${DB_RESULT}"
    if [[ "${STRICT_DB}" == "true" ]]; then
        echo "[Wave0] Encerrando com erro por --strict-db."
        exit 2
    fi
    echo "[Wave0] Continuando sem bloquear (rode novamente com --strict-db quando conectividade estiver normal)."
    exit 0
fi

echo "[Wave0] ${DB_RESULT}"
echo "[Wave0] Baseline completo concluido."
