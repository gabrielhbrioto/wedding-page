# Contexto técnico do sistema para LLM

Data de referência: 21/05/2026

Este documento resume o estado atual real do repositório `wedding-invite` para servir como contexto de alta densidade para um modelo de linguagem. A ideia é explicar a arquitetura, os módulos relevantes, os contratos de dados e os fluxos importantes sem depender de ler todo o código antes.

## 1. Visao geral do sistema

O projeto e um site de casamento com tres blocos principais:

- Frontend publico com pagina inicial, RSVP e pagina de convite reutilizavel.
- Backend administrativo/publico com FastAPI, SQLAlchemy e JWT em cookies.
- Banco PostgreSQL/Supabase com schema versionado por migrations.

A arquitetura real hoje e esta:

- `apps/web`: Next.js App Router, React 19, TypeScript, MUI, Tailwind e algumas telas em CSS utilitario.
- `apps/api`: FastAPI com rotas versionadas em `/api/v1`.
- `supabase/migrations`: fonte de verdade do schema do banco.

## 2. Estrutura geral do monorepo

Pontos de entrada importantes:

- Backend: `apps/api/main.py`
- Frontend: `apps/web/src/app`
- Banco: `supabase/migrations` e `supabase/final_schema_tables.sql`
- Documentacao antiga/planejada: `docs/*.md`

Observacao importante:

- O frontend ativo esta em `apps/web/src`.
- O backend ativo esta em `apps/api/app`.
- Os arquivos antigos de contexto em `docs/PROJECT_CONTEXT.md`, `docs/spec.md` e `docs/spec-tecnica.md` ajudam como historico, mas podem conter visao antiga ou incompleta.

## 3. Backend

### 3.1 Entrypoint e infraestrutura base

Arquivo principal:

- `apps/api/main.py`

Responsabilidades:

- Cria a aplicacao FastAPI.
- Registra CORS para a URL do frontend e para hosts locais de desenvolvimento.
- Inclui o router principal em `/api/v1`.
- Expõe um healthcheck simples em `/`.

Arquivos de infraestrutura:

- `apps/api/app/core/config.py`
- `apps/api/app/core/database.py`
- `apps/api/app/core/admin_bootstrap.py`

O que eles fazem:

- `config.py`: carrega variaveis de ambiente com `BaseSettings`.
- `database.py`: cria `engine`, `SessionLocal` e `get_db`.
- `admin_bootstrap.py`: cria ou atualiza usuario admin via CLI, com suporte a auditoria e dicas de conexao com o banco.

### 3.2 Autenticacao e autorizacao

Arquivos principais:

- `apps/api/app/api/v1/auth.py`
- `apps/api/app/api/v1/dependencies.py`
- `apps/api/app/utils/security.py`

Fluxo:

- Login valida email e senha do admin em `admin_users`.
- O backend emite `access_token` e, opcionalmente, `refresh_token` em cookies HTTP-only.
- `require_admin` tenta ler `access_token`; se expirar, usa `refresh_token` para gerar um novo access token.
- O frontend de admin depende desses cookies para manter a sessao.

Detalhes de cookies e JWT:

- `ACCESS_COOKIE_NAME = access_token`
- `REFRESH_COOKIE_NAME = refresh_token`
- Algoritmo JWT: `HS256`
- Role valida: `admin`

Pontos importantes:

- O backend nao usa headers Bearer para a area admin; a sessao e cookie-based.
- O frontend usa `credentials: include` nas requisicoes.
- O proxy de Next protege `/admin/*` e redireciona para `/login` quando a sessao nao e valida.

### 3.3 Helper de prazo de confirmacao

Arquivo:

- `apps/api/app/utils/rsvp_deadline.py`

Este modulo centraliza a regra de fechamento da janela de RSVP.

Funcoes principais:

- `compute_confirmation_deadline(event_date, offset_days)`: deriva a data limite a partir da data do evento e do offset em dias.
- `is_confirmation_window_closed(now, event_date, offset_days)`: compara data atual com a janela de fechamento.
- `ensure_confirmation_window_open(db)`: carrega a configuracao atual do evento e retorna HTTP 410 quando o prazo ja encerrou.
- `serialize_event_setting(event)`: transforma o ORM `EventSetting` em resposta de API, incluindo `confirmation_deadline_at`.

Regra operacional:

- Se `rsvp_deadline_offset_days` for nulo, a janela nao fecha automaticamente.
- Se existir offset, qualquer escrita de RSVP fora do prazo deve falhar com HTTP 410.

### 3.4 Router principal da API

Arquivo:

- `apps/api/app/api/v1/router.py`

Rotas registradas:

- `/api/v1/public`
- `/api/v1/admin/auth`
- `/api/v1/admin/groups`
- `/api/v1/admin/members`
- `/api/v1/admin/rsvps`
- `/api/v1/admin/dashboard`
- `/api/v1/admin/stats`
- `/api/v1/admin/gifts`
- `/api/v1/admin/gallery`
- `/api/v1/admin/export`
- `/api/v1/admin/settings`

### 3.5 Rotas publicas

Arquivo:

- `apps/api/app/api/v1/public.py`

Endpoints atuais:

- `GET /api/v1/public/event`
- `GET /api/v1/public/countdown`
- `GET /api/v1/public/invite/{token}`
- `POST /api/v1/public/rsvp/open`
- `POST /api/v1/public/rsvp/{token}`
- `GET /api/v1/public/calendar/{token}.ics`
- `GET /api/v1/public/gifts`
- `POST /api/v1/public/gifts/{gift_id}/reserve`
- `GET /api/v1/public/gallery`

Comportamento por endpoint:

- `GET /event`: retorna os dados do evento principal e o prazo derivado de confirmacao.
- `GET /countdown`: retorna apenas a data do evento.
- `GET /invite/{token}`: busca o grupo pelo token e devolve membros.
- `POST /rsvp/open`: cria um grupo real de cerimonia com membros informados livremente, grava resposta e devolve um token reutilizavel.
- `POST /rsvp/{token}`: atualiza a resposta de um convite existente.
- `GET /calendar/{token}.ics`: ainda e stub.
- `GET /gifts`: ainda devolve lista fixa simulada.
- `POST /gifts/{gift_id}/reserve`: ainda e stub.
- `GET /gallery`: ainda devolve lista vazia.

Regras importantes:

- As escritas publicas respeitam o prazo de confirmacao.
- O fluxo aberto cria um grupo com `InviteType.CERIMONIA`.
- O fluxo por token reutiliza o token salvo na URL/cookie.
- A resposta aberta salva uma unica `RsvpResponse` para o grupo criado.

### 3.6 Rotas de settings do evento

Arquivo:

- `apps/api/app/api/v1/settings.py`

Esta rota trata `event_settings` como um singleton administrativo.

Operacoes:

- `GET /api/v1/admin/settings/`
- `POST /api/v1/admin/settings/`
- `PUT /api/v1/admin/settings/`
- `DELETE /api/v1/admin/settings/`

Comportamento:

- `GET` retorna o unico registro atual.
- `POST` cria o registro apenas se nao existir nenhum.
- `PUT` atualiza o registro existente.
- `DELETE` remove o registro.
- O `confirmation_deadline_at` e calculado na serializacao e nao gravado diretamente.

Observacoes:

- Criacao exige pelo menos `nome_casal` e `data_evento`.
- `rsvp_deadline_offset_days` controla o encerramento da janela de RSVP.
- O frontend administra esta entidade como uma tela unica, nao como lista.

### 3.7 Rotas de grupos e membros

Arquivo:

- `apps/api/app/api/v1/groups.py`

Endpoints:

- `GET /api/v1/admin/groups/`
- `POST /api/v1/admin/groups/`
- `GET /api/v1/admin/groups/{group_id}`
- `PUT /api/v1/admin/groups/{group_id}`
- `DELETE /api/v1/admin/groups/{group_id}`
- `POST /api/v1/admin/groups/{group_id}/members`

Responsabilidades principais:

- Listar grupos.
- Criar grupo.
- Exibir detalhes com membros e status individual.
- Atualizar grupo.
- Remover grupo.
- Adicionar membros a um grupo.

Detalhes importantes:

- A rota de detalhe monta `status_by_member_id` a partir de `rsvp_member_status` para devolver o status individual de cada membro.
- Criacao e alteracao de RSVP dentro de grupo respeitam o prazo de confirmacao.
- O create group atualmente define `tipo_convite = CERIMONIA_JANTAR` no backend, mesmo que o payload tenha outros valores. Esse comportamento e relevante porque o frontend pode mostrar opcao mais ampla que o backend aceita na criacao.

### 3.8 Rotas de RSVP administrativo

Arquivo:

- `apps/api/app/api/v1/rsvps.py`

Endpoints:

- `GET /api/v1/admin/rsvps/`
- `GET /api/v1/admin/rsvps/{rsvp_id}`
- `DELETE /api/v1/admin/rsvps/{rsvp_id}`

Comportamento:

- Lista respostas com nome do grupo e metadados.
- Detalha membros com status individual e os nomes livres de cerimonia.
- O reset da resposta e bloqueado apos o prazo de confirmacao.

### 3.9 Dashboard, stats, export, gifts e gallery

Arquivos:

- `apps/api/app/api/v1/dashboard.py`
- `apps/api/app/api/v1/stats.py`
- `apps/api/app/api/v1/export.py`
- `apps/api/app/api/v1/gifts.py`
- `apps/api/app/api/v1/gallery.py`
- `apps/api/app/api/v1/members.py`

Resumo por modulo:

- `dashboard.py`: retorna contadores gerais de grupos, respostas, pendentes, confirmados no jantar e taxa de resposta.
- `stats.py`: retorna resumo de presenca por membro e estatisticas de presentes.
- `export.py`: ainda retorna URLs simuladas, nao gera CSV real.
- `gifts.py`: CRUD administrativo real para presentes.
- `gallery.py`: upload e exclusao de fotos da galeria, com SQL direto.
- `members.py`: atualiza e remove membros individualmente.

Importante:

- O dashboard e a camada de stats sao alimentados por SQL direto e views simples, nao por agregacoes em memoria.
- `export.py` e uma stub util para evolucao futura.

### 3.10 Modelos SQLAlchemy

Arquivos principais:

- `apps/api/app/models/admin_user.py`
- `apps/api/app/models/event_setting.py`
- `apps/api/app/models/invitation_group.py`
- `apps/api/app/models/group_member.py`
- `apps/api/app/models/rsvp_response.py`
- `apps/api/app/models/rsvp_member_status.py`
- `apps/api/app/models/ceremony_guest_name.py`
- `apps/api/app/models/gift.py`
- `apps/api/app/models/gallery_photo.py`
- `apps/api/app/models/enums.py`

Entidades e papel de cada uma:

- `AdminUser`: usuarios do painel admin.
- `EventSetting`: configuracao singleton do evento.
- `InvitationGroup`: grupo/familia/convite.
- `GroupMember`: pessoas dentro do grupo.
- `RsvpResponse`: resposta agregada por grupo.
- `RsvpMemberStatus`: status individual de cada membro em uma resposta.
- `CeremonyGuestName`: nomes livres enviados no fluxo aberto da cerimonia.
- `Gift`: presentes da lista.
- `GalleryPhoto`: fotos da galeria futura.

Enums centrais:

- `InviteType`: `CERIMONIA`, `CERIMONIA_JANTAR`, `VIP`
- `MemberStatus`: `CERIMONIA_E_JANTAR`, `SOMENTE_CERIMONIA`, `AUSENTE`
- `RsvpStatus`: `PENDENTE`, `RESPONDIDO`

Pontos estruturais:

- Quase todas as tabelas possuem `created_by` e `updated_by` apontando para `admin_users`.
- O usuario tecnico de sistema tem UUID fixo `00000000-0000-0000-0000-000000000001`.
- `RsvpResponse.group_id` e unico: cada grupo tem uma resposta principal.
- `RsvpMemberStatus` tem restricao unica por `response_id` + `member_id`.

### 3.11 Schemas Pydantic

Arquivos principais:

- `apps/api/app/schemas/auth.py`
- `apps/api/app/schemas/dashboard.py`
- `apps/api/app/schemas/stats.py`
- `apps/api/app/schemas/settings.py`
- `apps/api/app/schemas/groups.py`
- `apps/api/app/schemas/rsvp.py`
- `apps/api/app/schemas/gifts.py`
- `apps/api/app/schemas/gallery.py`
- `apps/api/app/schemas/members.py`

Contratos mais importantes:

- `EventSettingsResponse` inclui `confirmation_deadline_at` calculado.
- `UpdateEventSettingsRequest` aceita `rsvp_deadline_offset_days`.
- `GroupDetailResponse` inclui `members` com status individual.
- `PublicInviteResponse` devolve `token`, `group_name`, `type` e `members`.
- `OpenRsvpResponse` devolve `confirmation_deadline_at` e o token reutilizavel.
- `AdminRsvpDetailResponse` inclui `members` e `ceremony_guest_names`.

### 3.12 Scripts e testes do backend

Scripts relevantes:

- `apps/api/scripts/create_admin.sh`
- `apps/api/scripts/seed_event_settings.py`
- `apps/api/scripts/test.sh`
- `apps/api/scripts/lint.sh`
- `apps/api/scripts/format.sh`
- `apps/api/scripts/migrate.sh`

Testes:

- `apps/api/tests/conftest.py`
- `apps/api/tests/integration/test_admin_integration.py`

Observacoes dos testes:

- Os testes de integracao exigem `WAVE7_RUN_INTEGRATION=1`.
- O fixture cria admin temporario via `create_admin.sh`.
- Ha cobertura para CRUD de event settings, dashboard, groups, gifts e regras de prazo.

### 3.13 Comportamentos e alertas importantes no backend

- O schema do banco deve existir antes da API subir; faltas de coluna geram erro de runtime.
- O prazo de RSVP e centralizado em `rsvp_deadline.py` e deve ser usado por qualquer novo fluxo de escrita.
- Alguns endpoints sao stubs e nao devem ser tratados como funcionalidades concluídas.
- O backend aceita o fluxo aberto como criacao real de dados, nao mais como mock.

## 4. Frontend

### 4.1 Estrutura geral

O frontend ativo esta em `apps/web/src` e usa Next.js App Router.

Rotas principais atuais:

- `/` -> `apps/web/src/app/page.tsx`
- `/rsvp` -> `apps/web/src/app/rsvp/page.tsx`
- `/login` -> `apps/web/src/app/login/page.tsx`
- `/admin` -> redireciona para dashboard
- `/admin/dashboard` -> dashboard executivo
- `/admin/convidados` -> cadastro e edicao de grupos
- `/admin/evento` -> CRUD do evento
- `/presentes` -> pagina placeholder
- `/convite/[token]` -> rota que grava cookie e redireciona para `/rsvp`

Arquivos base:

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/proxy.ts`

### 4.2 Camada de autenticação e roteamento

Arquivos:

- `apps/web/src/proxy.ts`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/app/admin/page.tsx`

Comportamento:

- `proxy.ts` protege tudo que estiver abaixo de `/admin/*`.
- O proxy valida os cookies `access_token` e `refresh_token` com `jose`.
- Se nao validar, redireciona para `/login?next=...`.
- A pagina de login envia `POST /api/admin/auth/login` com `credentials: include`.
- A pagina `/admin` redireciona imediatamente para `/admin/dashboard`.
- O layout admin compartilha `AdminShell`.

Detalhe importante:

- O proxy usa `JWT_SECRET` ou `SECRET_KEY` do ambiente do frontend para validar os tokens.

### 4.3 Home publica

Arquivo:

- `apps/web/src/app/page.tsx`

Fluxo:

- Faz fetch server-side em `GET /api/v1/public/event`.
- Se a API falhar, usa valores padrao de fallback.
- Mostra hero, countdown, historia, bloco de evento e CTA final.
- Usa `Countdown` como componente client-side animado.

Pontos importantes:

- O nome do casal, data do evento, local e mapa sao dinamicos quando o backend responde.
- A pagina ainda mantem fallback para desenvolvimento.

### 4.4 RSVP publica

Arquivo:

- `apps/web/src/app/rsvp/page.tsx`

Fluxo real:

- Lê o cookie `invite_token`.
- Busca o prazo de confirmacao em `GET /api/v1/public/event`.
- Se nao houver token, renderiza `GenericRsvpForm`.
- Se houver token, usa Supabase client direto para carregar `invitation_groups`, `group_members` e `rsvp_responses`.
- Se existir resposta salva, carrega os statuses individuais de `rsvp_member_status`.
- Renderiza `TokenRsvpForm` com os dados carregados.

Importante:

- A pagina publica nao passa pelo backend para ler o grupo existente; ela usa o client do Supabase diretamente.
- O token reutilizavel vem da rota `/convite/[token]`.

### 4.5 Rota reutilizavel do convite

Arquivo:

- `apps/web/src/app/convite/[token]/route.ts`

Comportamento:

- Recebe o token na URL.
- Grava `invite_token` como cookie HTTP-only, `sameSite=lax`, `path=/`.
- Redireciona para `/rsvp`.

Esse e o mecanismo que permite abrir um link guardado posteriormente e editar a resposta.

### 4.6 Formulario aberto de RSVP

Arquivo:

- `apps/web/src/components/rsvp/GenericRsvpForm.tsx`

Comportamento:

- Pede quantidade de pessoas, nomes e mensagem.
- Envia `POST /api/v1/public/rsvp/open` via `apiFetch`.
- Desabilita a edicao apos sucesso ou fim do prazo.
- Exibe o token gerado e um botao de copiar link.
- Mostra o prazo de confirmacao quando o backend o envia.

Detalhe importante:

- A confirmacao aberta nao e um mock; ela cria grupo real, membros reais e uma resposta persistida.

### 4.7 Formulario por token

Arquivo:

- `apps/web/src/components/rsvp/TokenRsvpForm.tsx`

Comportamento:

- Recebe grupo, membros, statuses iniciais e mensagem inicial.
- Monta selects de status por membro conforme o tipo do convite.
- Envia `POST /api/v1/public/rsvp/{token}`.
- Exibe aviso quando existe resposta ja carregada.
- Bloqueia edicao apos o prazo de confirmacao.

Observacao de dominio:

- Para `CERIMONIA`, o status permitido e apenas `SOMENTE_CERIMONIA` ou `AUSENTE`.
- Para outros tipos, tambem aparece `CERIMONIA_E_JANTAR`.

### 4.8 Admin shell e telas internas

Arquivos:

- `apps/web/src/components/admin/AdminShell.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/app/admin/convidados/page.tsx`
- `apps/web/src/app/admin/evento/page.tsx`
- `apps/web/src/components/admin/EventSettingsForm.tsx`

AdminShell:

- Fornece menu lateral no desktop e barra compacta no mobile.
- Navegacao atual: Dashboard, Cadastro de Convidados e Dados do Evento.

Dashboard:

- Busca resumo em `/admin/dashboard`, `/admin/stats/presence`, `/admin/rsvps` e `/admin/groups`.
- Mostra cards, grafico de pizza, ultimos RSVPs e tabelas por tipo de convite.
- Usa `GroupsTable` para expandir detalhes dos grupos.

Cadastro de convidados:

- Cria um grupo, gera um token e adiciona membros.
- Permite editar e excluir grupos.
- Usa `GroupEditDialog` para edicao.
- Usa `GroupsTable` para listagem e expansao.

Dados do evento:

- Faz CRUD do singleton `event_settings`.
- Mostra prazo calculado em tempo real no formulario.
- Exibe a data limite salva e um preview do deadline derivado.
- Permite criar, atualizar e excluir os dados do evento.

### 4.9 Componentes UI importantes

Componentes relevantes:

- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/Footer.tsx`
- `apps/web/src/components/sections/Countdown.tsx`
- `apps/web/src/components/ui/CopyInviteLinkButton.tsx`
- `apps/web/src/components/ui/GroupsTable.tsx`
- `apps/web/src/components/ui/GroupEditDialog.tsx`
- `apps/web/src/components/ui/SummaryCard.tsx`
- `apps/web/src/components/ui/PieChartCard.tsx`

Resumo:

- `Header` e `Footer` compoem o site publico.
- `Countdown` calcula o tempo restante com animacao.
- `CopyInviteLinkButton` copia o link completo do convite.
- `GroupsTable` expande o grupo e mostra status individual dos membros.
- `GroupEditDialog` edita token, nome, tipo, RSVP e observacoes.
- `SummaryCard` e `PieChartCard` sao widgets do dashboard.

### 4.10 Camada de biblioteca do frontend

Arquivos:

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/supabase/client.ts`
- `apps/web/src/lib/supabase/server.ts`
- `apps/web/src/lib/validations/rsvp.ts`
- `apps/web/src/lib/actions/rsvp.ts`
- `apps/web/src/lib/mocks/invites.ts`

Resumo:

- `api.ts`: helper de fetch para o backend via `/api/v1`.
- `supabase/client.ts` e `supabase/server.ts`: clients do Supabase.
- `validations/rsvp.ts`: schema antigo de RSVP.
- `actions/rsvp.ts`: server action antiga que grava na tabela `rsvp`.
- `mocks/invites.ts`: dados simulados usados em prototipos.

Ponto crítico:

- `lib/actions/rsvp.ts`, `lib/validations/rsvp.ts`, `lib/mocks/invites.ts` e a tabela `rsvp` em `apps/web/src/types/database.ts` sao legados do MVP anterior.
- O fluxo ativo de RSVP hoje usa o backend FastAPI e o schema atual em `invitation_groups`, `group_members`, `rsvp_responses` e `rsvp_member_status`.

### 4.11 Tipos do frontend

Arquivos:

- `apps/web/src/types/admin.ts`
- `apps/web/src/types/database.ts`

`admin.ts`:

- Define os tipos consumidos pelo dashboard, cadastro de convidados e tela de evento.
- Contem alguns valores de compatibilidade legada, como `CONFIRMADO`, `RECUSADO`, `JANTAR` e `APENAS_CERIMONIA`.

`database.ts`:

- E gerado como tipo de Supabase e ainda contem tabelas legadas como `guests` e `rsvp`.
- O schema atual do backend nao usa essas tabelas como fluxo principal.

### 4.12 Pagina de presentes

Arquivo:

- `apps/web/src/app/presentes/page.tsx`

Estado atual:

- E apenas um placeholder.
- Mostra texto de lista de presentes em construcao.

## 5. Banco de dados

### 5.1 Fonte de verdade do schema

Arquivos:

- `supabase/migrations/*`
- `supabase/final_schema_tables.sql`

Regra pratica:

- As migrations sao a fonte de verdade.
- `final_schema_tables.sql` e uma consolidacao/snapshot util para leitura rapida, mas nao substitui a serie de migrations.

### 5.2 Ordem das migrations

Arquivos relevantes:

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
- `15_admin_users_updated_at.sql`
- `16_event_settings_rsvp_deadline.sql`

Resumo cronologico:

- Primeiro foram criados enums e tabelas base do dominio.
- Depois vieram triggers de `updated_at` e views de dashboard.
- Em seguida o sistema ganhou `admin_users` e o backfill de auditoria com `created_by`/`updated_by`.
- A migration 16 adicionou `rsvp_deadline_offset_days` em `event_settings`.

### 5.3 Tabelas principais e funcao de cada uma

`admin_users`

- Guarda usuarios do painel.
- Contem login, hash da senha, flag `active` e auditoria.

`invitation_groups`

- Representa um convite/grupo familiar.
- Possui `token`, `nome_grupo`, `tipo_convite`, `observacoes`, `rsvp_status` e `responded_at`.

`group_members`

- Guarda as pessoas de um grupo.
- Relaciona cada membro ao grupo e define ordem de exibicao.

`rsvp_responses`

- Guarda a resposta agregada por grupo.
- Tem mensagem, total confirmado e auditoria.

`rsvp_member_status`

- Guarda o status individual de cada membro na resposta.
- Usa enum `member_status`.

`ceremony_guest_names`

- Guarda nomes livres informados no fluxo aberto de cerimonia.
- E importante para a experiencia sem convite pre-cadastrado.

`event_settings`

- Guarda os dados publicos do evento.
- Funciona como singleton.
- Inclui `rsvp_deadline_offset_days` para controlar o prazo.

`gifts`

- Lista de presentes.
- Possui nome, descricao, preco, link externo, imagem, ativo e ordem.

`gallery_photos`

- Fotos da galeria futura.
- Inclui titulo, imagem e visibilidade publica.

### 5.4 Enums do banco

Enums reais usados no schema:

- `invite_type`: `CERIMONIA`, `CERIMONIA_JANTAR`, `VIP`
- `member_status`: `CERIMONIA_E_JANTAR`, `SOMENTE_CERIMONIA`, `AUSENTE`
- `rsvp_status`: `PENDENTE`, `RESPONDIDO`

### 5.5 Auditoria e usuario tecnico

Padrao adotado:

- Todas as tabelas de dominio recebem `created_by` e `updated_by`.
- O usuario tecnico de sistema tem UUID fixo `00000000-0000-0000-0000-000000000001`.
- Esse usuario nao e logavel e serve para backfill e rastreabilidade.

### 5.6 Triggers e views

Triggers:

- `trg_groups_updated`
- `trg_rsvp_updated`
- `trg_event_updated`
- `trg_admin_users_updated`

O que fazem:

- Atualizam automaticamente `updated_at` antes de qualquer update.

Views:

- `vw_dashboard`
- `vw_presence_summary`

Uso:

- `vw_dashboard` agrega grupos respondidos e pendentes.
- `vw_presence_summary` agrega status individuais dos membros.

### 5.7 Inconsistencias legadas que ainda existem no repositorio

Esses pontos sao importantes para nao confundir um modelo:

- O frontend ainda tem tipos legados para `guests` e `rsvp`.
- A antiga action `submitRSVP` grava em `rsvp`, mas o fluxo real atual nao usa isso.
- O arquivo `mocks/invites.ts` ainda existe para prototipacao.
- Alguns tipos de frontend ainda usam nomes antigos de status e tipos, como `CONFIRMADO`, `RECUSADO`, `JANTAR` e `APENAS_CERIMONIA`.
- O backend atual usa os enums do schema novo, que sao mais restritos.

### 5.8 Observacao operacional critica

Ja houve um caso real de descompasso entre codigo e banco quando a coluna `event_settings.rsvp_deadline_offset_days` ainda nao existia em uma instancia ativa.

Licao pratica:

- Sempre aplicar a migration correspondente em todos os ambientes.
- Nao confiar apenas no codigo se a coluna nova nao existe no banco.

## 6. Fluxos importantes que um LLM deve entender

### 6.1 Home publica

Fluxo esperado:

- A pagina inicial busca os dados do evento.
- Mostra CTA para RSVP.
- Usa valores padrao se o backend estiver indisponivel.

### 6.2 RSVP sem convite

Fluxo esperado:

- Usuario entra na pagina de RSVP sem token.
- Informa nomes livres.
- O frontend envia os nomes ao endpoint aberto.
- O backend cria grupo, membros, resposta e token reutilizavel.
- O usuario recebe orientacao para guardar o token ou abrir o link salvo.

### 6.3 RSVP com convite/token

Fluxo esperado:

- Usuario abre `/convite/{token}`.
- A rota grava o token no cookie e redireciona para `/rsvp`.
- A pagina de RSVP carrega o grupo e a resposta existente.
- O usuario pode revisar e reenviar a resposta.

### 6.4 Painel admin

Fluxo esperado:

- Usuario faz login em `/login`.
- O proxy protege `/admin/*`.
- Dashboard mostra números e tabelas.
- Cadastro de convidados permite CRUD de grupos e membros.
- Dados do evento permite CRUD do singleton publicamente exibido.

## 7. Dependencias e ambiente

Frontend principal:

- Next.js 16.2.3
- React 19.2.4
- TypeScript 5
- MUI 9
- Tailwind CSS 4
- Supabase JS/SSR
- Framer Motion
- React Hook Form e Zod

Backend principal:

- FastAPI
- SQLAlchemy
- Pydantic Settings
- PostgreSQL/Supabase
- JWT com `python-jose`
- `passlib` para hash de senha

Variaveis de ambiente mais importantes:

Backend (`apps/api/.env`):

- `APP_NAME`
- `APP_ENV`
- `APP_PORT`
- `DATABASE_URL`
- `FRONTEND_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_DURATION`
- `REFRESH_TOKEN_DURATION_DAYS`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

Frontend (`apps/web/.env.local`):

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `JWT_SECRET` ou `SECRET_KEY` para o proxy de admin, se estiver sendo usado no ambiente

## 8. Resumo prático para um outro modelo

Se outro modelo precisar trabalhar neste repo, a sequencia mental correta e esta:

1. Tratar `apps/api` como fonte da regra de negocio e da autenticação.
2. Tratar `apps/web` como consumer do backend e do Supabase, com alguns fluxos diretos ao banco ainda presentes.
3. Tratar `supabase/migrations` como fonte de verdade do schema.
4. Considerar `docs/spec*.md` apenas como contexto historico, nao como estado atual garantido.
5. Ter cuidado com legados de RSVP antigo (`rsvp`, `guests`, `submitRSVP`, mocks) que ainda existem no repositorio mas nao representam o fluxo principal atual.
6. Lembrar que o prazo de confirmacao e derivado de `event_settings.data_evento` + `rsvp_deadline_offset_days`.
7. Nunca assumir que um endpoint stub, uma view antiga ou um tipo legada esta realmente em uso sem conferir o caminho ativo em `apps/web` e `apps/api`.

## 9. Arquivos mais importantes para continuar o trabalho

Backend:

- `apps/api/main.py`
- `apps/api/app/api/v1/public.py`
- `apps/api/app/api/v1/settings.py`
- `apps/api/app/api/v1/groups.py`
- `apps/api/app/api/v1/rsvps.py`
- `apps/api/app/api/v1/dashboard.py`
- `apps/api/app/api/v1/stats.py`
- `apps/api/app/core/admin_bootstrap.py`
- `apps/api/app/utils/rsvp_deadline.py`

Frontend:

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/rsvp/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/app/admin/convidados/page.tsx`
- `apps/web/src/app/admin/evento/page.tsx`
- `apps/web/src/components/rsvp/GenericRsvpForm.tsx`
- `apps/web/src/components/rsvp/TokenRsvpForm.tsx`
- `apps/web/src/components/admin/EventSettingsForm.tsx`
- `apps/web/src/components/admin/AdminShell.tsx`
- `apps/web/src/app/convite/[token]/route.ts`

Banco:

- `supabase/migrations/14_admin_audit_and_multi_login.sql`
- `supabase/migrations/15_admin_users_updated_at.sql`
- `supabase/migrations/16_event_settings_rsvp_deadline.sql`
- `supabase/final_schema_tables.sql`

## 10. Fechamento

Este documento deve ser usado como memoria de contexto tecnica do estado atual do sistema. Se o codigo mudar de forma relevante, ele deve ser atualizado junto, porque o valor dele depende de refletir a implementacao real e nao a proposta original.
