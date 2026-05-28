# Onda 8 - Runbook de Rollout (PR-8)

## Objetivo

Executar rollout seguro para staging e producao com:

- aplicacao de migracoes
- deploy da aplicacao
- smoke completo autenticado
- checklist formal de aprovacao

## Pre-requisitos

- Onda 7 aprovada (check migration-model-schema + integracao)
- Credenciais de admin para smoke definidas em variaveis de ambiente
- Comandos de deploy/migracao definidos no ambiente CI/CD ou shell

Variaveis usadas pelo script:

- `STAGING_MIGRATE_CMD`
- `STAGING_DEPLOY_CMD`
- `STAGING_API_BASE_URL`
- `PRODUCTION_MIGRATE_CMD`
- `PRODUCTION_DEPLOY_CMD`
- `PRODUCTION_API_BASE_URL`
- `ADMIN_SMOKE_EMAIL`
- `ADMIN_SMOKE_PASSWORD`

## Fluxo de staging

No diretorio `apps/api`:

```bash
./scripts/wave8_rollout.sh --env staging
```

O script executa:

1. Pre-check da Onda 7 (`./scripts/wave7_check.sh`)
2. Migracao de staging (se `STAGING_MIGRATE_CMD` estiver definido)
3. Deploy de staging (se `STAGING_DEPLOY_CMD` estiver definido)
4. Smoke completo autenticado (`scripts/smoke_release.py`)

## Fluxo de producao

Somente apos aprovacao de staging:

```bash
./scripts/wave8_rollout.sh --env production
```

## Smoke manual (opcional)

```bash
python scripts/smoke_release.py \
  --base-url "https://api.exemplo.com" \
  --email "admin@example.com" \
  --password "***"
```

O smoke valida:

- health
- login admin
- auth/me
- dashboard real
- stats real
- CRUD rapido de groups (create/delete)
- CRUD rapido de gifts (create/delete)

## Checklist de aprovacao (Gate)

- [ ] Wave7 check verde no target env
- [ ] Migracoes aplicadas sem erro
- [ ] Deploy concluido sem rollback
- [ ] Smoke autenticado 100% aprovado
- [ ] Dashboard e stats retornando dados reais
- [ ] Auditoria criada/atualizada em operacoes de teste
- [ ] Aprovacao de staging registrada
- [ ] Promocao para producao executada
- [ ] Smoke de producao aprovado

## Comandos de referencia

```bash
# apenas check local
./scripts/wave7_check.sh --integration

# rollout staging sem smoke (quando smoke sera executado separadamente)
./scripts/wave8_rollout.sh --env staging --skip-smoke

# rollout producao completo
./scripts/wave8_rollout.sh --env production
```
