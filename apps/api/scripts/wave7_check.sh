#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

RUN_INTEGRATION=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --integration)
            RUN_INTEGRATION=true
            shift
            ;;
        *)
            echo "Uso: ./scripts/wave7_check.sh [--integration]"
            exit 1
            ;;
    esac
done

cd "${API_DIR}"
source "${API_DIR}/venv/bin/activate"

echo "[Wave7] Executando check migration-model-schema..."
python scripts/check_migration_model_schema.py

if [[ "${RUN_INTEGRATION}" == "true" ]]; then
    echo "[Wave7] Executando testes de integracao..."
    WAVE7_RUN_INTEGRATION=1 pytest -m integration tests/integration/test_admin_integration.py
else
    echo "[Wave7] Testes de integracao nao executados (use --integration para rodar)."
fi

echo "[Wave7] Checks concluidos."
