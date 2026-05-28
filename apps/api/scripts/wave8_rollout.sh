#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

TARGET_ENV=""
RUN_SMOKE=true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)
            TARGET_ENV="$2"
            shift 2
            ;;
        --skip-smoke)
            RUN_SMOKE=false
            shift
            ;;
        *)
            echo "Uso: ./scripts/wave8_rollout.sh --env staging|production [--skip-smoke]"
            exit 1
            ;;
    esac
done

if [[ -z "${TARGET_ENV}" ]]; then
    echo "Erro: informe --env staging|production"
    exit 1
fi

if [[ "${TARGET_ENV}" != "staging" && "${TARGET_ENV}" != "production" ]]; then
    echo "Erro: env invalido. Use staging ou production."
    exit 1
fi

cd "${API_DIR}"
source "${API_DIR}/venv/bin/activate"

if [[ "${TARGET_ENV}" == "staging" ]]; then
    DEPLOY_CMD="${STAGING_DEPLOY_CMD:-}"
    MIGRATE_CMD="${STAGING_MIGRATE_CMD:-}"
    BASE_URL="${STAGING_API_BASE_URL:-}"
else
    DEPLOY_CMD="${PRODUCTION_DEPLOY_CMD:-}"
    MIGRATE_CMD="${PRODUCTION_MIGRATE_CMD:-}"
    BASE_URL="${PRODUCTION_API_BASE_URL:-}"
fi

echo "[Wave8] Target: ${TARGET_ENV}"

echo "[Wave8] Pre-check (Wave7)"
./scripts/wave7_check.sh

if [[ -n "${MIGRATE_CMD}" ]]; then
    echo "[Wave8] Aplicando migracoes (${TARGET_ENV})"
    bash -lc "${MIGRATE_CMD}"
else
    echo "[Wave8] Aviso: ${TARGET_ENV^^}_MIGRATE_CMD nao definido. Pulando etapa de migracao automatica."
fi

if [[ -n "${DEPLOY_CMD}" ]]; then
    echo "[Wave8] Publicando deploy (${TARGET_ENV})"
    bash -lc "${DEPLOY_CMD}"
else
    echo "[Wave8] Aviso: ${TARGET_ENV^^}_DEPLOY_CMD nao definido. Pulando etapa de deploy automatica."
fi

if [[ "${RUN_SMOKE}" == "true" ]]; then
    if [[ -z "${BASE_URL}" ]]; then
        echo "Erro: para smoke, defina ${TARGET_ENV^^}_API_BASE_URL."
        exit 1
    fi
    if [[ -z "${ADMIN_SMOKE_EMAIL:-}" || -z "${ADMIN_SMOKE_PASSWORD:-}" ]]; then
        echo "Erro: para smoke, defina ADMIN_SMOKE_EMAIL e ADMIN_SMOKE_PASSWORD."
        exit 1
    fi

    echo "[Wave8] Executando smoke (${TARGET_ENV})"
    python scripts/smoke_release.py \
        --base-url "${BASE_URL}" \
        --email "${ADMIN_SMOKE_EMAIL}" \
        --password "${ADMIN_SMOKE_PASSWORD}"
else
    echo "[Wave8] Smoke pulado por --skip-smoke"
fi

echo "[Wave8] Rollout ${TARGET_ENV} concluido"
