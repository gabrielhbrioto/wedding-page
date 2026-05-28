# Onda 0 - Baseline e Congelamento de Escopo

Data de referencia: 26/04/2026
Status: Concluida

## Objetivo

Concluir o gate inicial da trilha de correcao:
- confirmar inventario de migrations 01-14 no repositorio;
- registrar escopo congelado da rodada;
- deixar validacao repetivel para banco e repositorio.

## Escopo congelado desta rodada

Incluido:
- backend API em `apps/api` (models, schemas, endpoints admin, scripts operacionais);
- consistencia entre migrations SQL e camada Python;
- estabilizacao de `create_admin` e fluxo de login admin.

Excluido:
- frontend (`apps/web`) e ajustes de UI;
- permissao granular por papel (RBAC fino);
- refatoracao arquitetural ampla fora do dominio admin/RSVP.

## Evidencias do baseline

1. Inventario de migrations esperado:
- `01_enums.sql`
- `02_invitation_groups.sql`
- `03_group_members.sql`
- `04_rsvp_responses.sql`
- `05_rsvp_member_status.sql`
- `06_ceremony_guest_names.sql`
- `07_event_settings.sql`
- `08_gifts.sql`
- `09_gallery_photos.sql`
- `10_updated_at_triggers.sql`
- `11_view_dashboard.sql`
- `12_view_presence_summary.sql`
- `13_admin_users.sql`
- `14_admin_audit_and_multi_login.sql`

2. Script de validacao criado:
- `apps/api/scripts/wave0_baseline_check.sh`

3. Execucao dos gates (26/04/2026):
- `./scripts/wave0_baseline_check.sh --skip-db` -> sucesso
- `./scripts/wave0_baseline_check.sh` -> sucesso (`schema_ready tables=9 audit_columns=18 views=2`)

## Como executar o gate Onda 0

No diretorio `apps/api`:

```bash
./scripts/wave0_baseline_check.sh --skip-db
```

Validacao completa (inclui banco):

```bash
./scripts/wave0_baseline_check.sh --strict-db
```

Notas:
- `--skip-db` valida apenas repositorio local.
- `--strict-db` falha o comando se conectividade/estrutura do banco nao estiverem corretas.

## Criterio de aceite Onda 0

- [x] Inventario de migrations 01-14 validado sem faltas.
- [x] Script de baseline executavel e reproduzivel.
- [x] Escopo da rodada explicitamente congelado (inclui/exclui) para evitar desvio.
- [x] Validacao de banco executada com sucesso em ambiente de staging/alvo.

## Proxima onda

Seguir para Onda 1 (correcoes criticas de operacao auth/admin), mantendo o gate Onda 0 como pre-condicao de inicio.
