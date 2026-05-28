# Wedding Invite

Projeto com backend FastAPI, frontend Next.js e schema versionado em `supabase/migrations/`.

## Workflow de migrations

O repositório inclui um workflow do GitHub Actions para aplicar migrations do Supabase de forma incremental:

- arquivo: `.github/workflows/supabase-migrations.yml`
- estratégia: `psql` direto com `DATABASE_URL`
- tracking: tabela `_schema_migrations`

### Secrets necessários

- `DATABASE_URL`: string de conexão do banco Supabase

### Como executar

O workflow roda:

1. em `push` para `main` quando houver mudanças em `supabase/migrations/**/*.sql`
2. manualmente via `workflow_dispatch`

Para execução manual, é possível sobrescrever a conexão informando `database_url` no disparo do workflow.

## Validação local

Se quiser testar manualmente a mesma estratégia do CI, aplique os arquivos SQL em ordem com `psql` contra o banco de staging antes de promover para produção.