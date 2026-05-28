# Deploy minimal para GCP (Cloud Run) — guia rápido

Este documento descreve passos mínimos para buildar imagens e fazer deploy no Cloud Run em uma conta gratuita/limitada.

Requisitos:
- `gcloud` configurado e autenticado
- Projeto GCP com Cloud Run habilitado

Variáveis essenciais (defina via Cloud Run ou Secrets):
- `DATABASE_URL`
- `SECRET_KEY`
- `NEXT_PUBLIC_API_URL` (URL pública do backend)

Build local (apenas para validar):

```bash
make build-api
make build-web
```

Build & push com `gcloud` (exemplo para o frontend):

```bash
# build and push to Artifact Registry (or Container Registry)
gcloud builds submit --tag LOCATION-docker.pkg.dev/PROJECT/REPOSITORY/wedding-invite-web:latest ./

# deploy to Cloud Run (low resources for free tier)
gcloud run deploy wedding-invite-web \
  --image LOCATION-docker.pkg.dev/PROJECT/REPOSITORY/wedding-invite-web:latest \
  --region YOUR_REGION --platform managed \
  --memory=256Mi --concurrency=1 --max-instances=1 \
  --set-env-vars NEXT_PUBLIC_API_URL=https://your-backend-url
```

Observações:
- Use `--memory=256Mi --concurrency=1 --max-instances=1` para reduzir uso de recursos em conta gratuita.
- Recomenda-se aplicar migrations antes de rotear tráfego para o serviço.
- O repositório já inclui um workflow pronto em `.github/workflows/supabase-migrations.yml` que aplica as migrations de `supabase/migrations/` via `psql` e registra o que já foi aplicado na tabela `_schema_migrations`.
- Secret necessário no GitHub Actions: `DATABASE_URL`.
- Proteja segredos usando Secret Manager e mapeie-os no Cloud Run.
