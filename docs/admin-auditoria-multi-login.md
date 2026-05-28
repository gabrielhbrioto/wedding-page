# Implementacao Inicial - Auditoria E Multi-Login Admin

## Objetivo desta entrega

- Adicionar `created_by` e `updated_by` em todas as tabelas de dominio e em `admin_users`.
- Popular dados legados com um usuario tecnico de sistema.
- Permitir provisionamento simples de mais de um login admin (ex.: noivo e noiva).

## Arquivos implementados

- `supabase/migrations/14_admin_audit_and_multi_login.sql`
- `supabase/migrations/15_admin_users_updated_at.sql`
- `apps/api/app/models/admin_user.py`
- `apps/api/app/core/admin_bootstrap.py`
- `apps/api/scripts/create_admin.sh`
- `apps/api/app/api/v1/groups.py`
- `apps/api/app/api/v1/members.py`
- `apps/api/app/api/v1/gifts.py`
- `apps/api/app/api/v1/settings.py`
- `apps/api/app/api/v1/gallery.py`
- `apps/api/app/api/v1/rsvps.py`

## Ordem recomendada de execucao

1. Aplicar as migrations SQL ate a 15 no banco alvo.
2. Subir a API com o schema novo.
3. Criar/atualizar usuarios admin com o script abaixo.

## Provisionar usuarios admin

No diretorio `apps/api`:

```bash
./scripts/create_admin.sh --email noivo@example.com --name "Noivo"
./scripts/create_admin.sh --email noiva@example.com --name "Noiva" --actor-email noivo@example.com
```

Observacoes:
- Se `--password` nao for informado, o script solicita a senha em prompt seguro.
- O `--actor-email` e opcional e serve para gravar auditoria de autoria.
- Se o email ja existir, o usuario e atualizado (senha/nome/active).

## Verificacoes SQL uteis

```sql
-- Conferir colunas de auditoria
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'admin_users',
    'invitation_groups',
    'group_members',
    'rsvp_responses',
    'rsvp_member_status',
    'ceremony_guest_names',
    'event_settings',
    'gifts',
    'gallery_photos'
  )
  and column_name in ('created_by', 'updated_by')
order by table_name, column_name;

-- Conferir se restou NULL apos backfill
select 'admin_users' as table_name, count(*) as null_count from admin_users where created_by is null or updated_by is null
union all
select 'invitation_groups', count(*) from invitation_groups where created_by is null or updated_by is null
union all
select 'group_members', count(*) from group_members where created_by is null or updated_by is null
union all
select 'rsvp_responses', count(*) from rsvp_responses where created_by is null or updated_by is null
union all
select 'rsvp_member_status', count(*) from rsvp_member_status where created_by is null or updated_by is null
union all
select 'ceremony_guest_names', count(*) from ceremony_guest_names where created_by is null or updated_by is null
union all
select 'event_settings', count(*) from event_settings where created_by is null or updated_by is null
union all
select 'gifts', count(*) from gifts where created_by is null or updated_by is null
union all
select 'gallery_photos', count(*) from gallery_photos where created_by is null or updated_by is null;

-- Conferir updated_at em admin_users (Onda 2)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'admin_users'
  and column_name in ('created_at', 'updated_at')
order by column_name;

-- Conferir trigger de updated_at para admin_users
select tgname
from pg_trigger
where tgrelid = 'admin_users'::regclass
  and tgname = 'trg_admin_users_updated'
  and not tgisinternal;
```

## Nota operacional

O usuario tecnico de sistema usa o UUID fixo `00000000-0000-0000-0000-000000000001` e permanece com `active=false`, servindo apenas para backfill e defaults de auditoria.

## Rollout e release

Para o processo de rollout de staging/producao (Onda 8), consulte:

- `docs/wave8-rollout.md`

## Endpoints de escrita com auditoria ativa

Os endpoints abaixo deixaram de ser placeholder e passaram a escrever em banco.
Em todos eles, `created_by` e/ou `updated_by` sao preenchidos com o `id` do admin autenticado via cookie JWT.

- `POST /api/v1/admin/groups`
- `PUT /api/v1/admin/groups/{group_id}`
- `DELETE /api/v1/admin/groups/{group_id}`
- `POST /api/v1/admin/groups/{group_id}/members`
- `PUT /api/v1/admin/members/{member_id}`
- `DELETE /api/v1/admin/members/{member_id}`
- `POST /api/v1/admin/gifts`
- `PUT /api/v1/admin/gifts/{gift_id}`
- `DELETE /api/v1/admin/gifts/{gift_id}`
- `PUT /api/v1/admin/settings`
- `POST /api/v1/admin/gallery/upload`
- `DELETE /api/v1/admin/gallery/{photo_id}`
- `DELETE /api/v1/admin/rsvps/{rsvp_id}`

### Exemplo rapido (criar grupo)

```json
{
  "token": "familia-silva",
  "nome_grupo": "Familia Silva",
  "tipo_convite": "CERIMONIA_JANTAR",
  "observacoes": "Mesa proxima ao altar"
}
```

### Exemplo rapido (criar presente)

```json
{
  "nome": "Air Fryer",
  "descricao": "Modelo 5L",
  "preco": 499.90,
  "link_externo": "https://loja.exemplo/presente",
  "imagem_url": "https://cdn.exemplo/presente.jpg",
  "ativo": true,
  "ordem": 10
}
```
