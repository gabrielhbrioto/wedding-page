# Documento Técnico Completo de Desenvolvimento (Parte 2)

## Projeto: Site de Casamento / Convite Virtual
**Versão:** 1.0  
**Data:** 14/04/2026

---

# 1. Objetivo Técnico

Definir a estrutura completa de implementação do projeto com foco em qualidade, escalabilidade, manutenção simples e baixo custo operacional.

---

# 2. Estrutura de Pastas Next.js

```text
src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── rsvp/page.tsx
│   ├── presentes/page.tsx
│   ├── historia/page.tsx
│   ├── faq/page.tsx
│   ├── admin/page.tsx
│   └── api/
│       ├── rsvp/route.ts
│       ├── guests/route.ts
│       ├── export/route.ts
│       └── ics/route.ts
│
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Countdown.tsx
│   ├── RSVPForm.tsx
│   ├── GiftList.tsx
│   ├── Footer.tsx
│   └── AdminTable.tsx
│
├── lib/
│   ├── supabase.ts
│   ├── validators.ts
│   ├── ics.ts
│   └── utils.ts
│
├── types/
│   ├── guest.ts
│   └── rsvp.ts
│
└── styles/
```

---

# 3. Endpoints da API

## 🌍 Endpoints Públicos

### Convites / RSVP

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/public/invite/{token} | Buscar convite personalizado |
| POST | /api/v1/public/rsvp/{token} | Confirmar presença convite com token |
| POST | /api/v1/public/rsvp/open | RSVP genérico sem token |
| GET | /api/v1/public/event | Dados do evento |
| GET | /api/v1/public/countdown | Data oficial casamento |

### Calendário

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/public/calendar/{token}.ics | Baixar convite ICS |

### Presentes

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/public/gifts | Listar presentes ativos |
| POST | /api/v1/public/gifts/{id}/reserve | Reservar presente |

### Galeria Futura

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/public/gallery | Fotos pós evento |

## 🔐 Auth Admin

| Método | Endpoint | Descrição |
| --- | --- | --- |
| POST | /api/v1/admin/auth/login | Login admin |
| POST | /api/v1/admin/auth/logout | Logout |
| GET | /api/v1/admin/auth/me | Sessão atual |

## 👨‍💼 Admin Dashboard

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/admin/dashboard | KPIs gerais |
| GET | /api/v1/admin/stats/presence | Resumo presença |
| GET | /api/v1/admin/stats/gifts | Estatísticas presentes |

## 👨‍👩‍👧‍👦 Admin Convites / Famílias

### Famílias

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/admin/groups | Listar famílias |
| POST | /api/v1/admin/groups | Criar família |
| GET | /api/v1/admin/groups/{id} | Detalhar família |
| PUT | /api/v1/admin/groups/{id} | Atualizar |
| DELETE | /api/v1/admin/groups/{id} | Remover |

### Membros da Família

| Método | Endpoint | Descrição |
| --- | --- | --- |
| POST | /api/v1/admin/groups/{id}/members | Adicionar membro |
| PUT | /api/v1/admin/members/{id} | Atualizar membro |
| DELETE | /api/v1/admin/members/{id} | Remover membro |

## 📩 Admin RSVP

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/admin/rsvps | Todas confirmações |
| GET | /api/v1/admin/rsvps/{id} | Detalhe resposta |
| DELETE | /api/v1/admin/rsvps/{id} | Resetar RSVP |

## 🎁 Admin Presentes

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/admin/gifts | Listar presentes |
| POST | /api/v1/admin/gifts | Criar presente |
| PUT | /api/v1/admin/gifts/{id} | Atualizar |
| DELETE | /api/v1/admin/gifts/{id} | Remover |

## 🖼️ Admin Galeria (V2)

| Método | Endpoint | Descrição |
| --- | --- | --- |
| POST | /api/v1/admin/gallery/upload | Upload foto |
| DELETE | /api/v1/admin/gallery/{id} | Remover foto |

## 📤 Exportação

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/admin/export/rsvps.csv | Export RSVP |
| GET | /api/v1/admin/export/groups.csv | Export convidados |
| GET | /api/v1/admin/export/gifts.csv | Export presentes |

## ⚙️ Settings

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/v1/admin/settings | Configurações |
| PUT | /api/v1/admin/settings | Atualizar |

# 4. Schema SQL Pronto

```sql
create extension if not exists "uuid-ossp";

create table invitation_groups (
  id uuid primary key,
  token varchar(30) unique not null,
  nome_grupo varchar(150),
  tipo_convite varchar(30), -- CERIMONIA / JANTAR
  created_at timestamp default now()
);

create table group_members (
  id uuid primary key,
  group_id uuid references invitation_groups(id),
  nome varchar(150),
  pre_cadastrado boolean default true
);

create table rsvp_responses (
  id uuid primary key,
  group_id uuid references invitation_groups(id),
  vai_cerimonia boolean,
  vai_jantar boolean,
  created_at timestamp default now()
);

create table rsvp_member_status (
  id uuid primary key,
  response_id uuid references rsvp_responses(id),
  member_id uuid references group_members(id),
  comparecera boolean
);

create table rsvp (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id) on delete cascade,
  comparecera boolean not null,
  acompanhantes int default 0,
  restricao text,
  mensagem text,
  created_at timestamp default now()
);

create table gifts (
  id uuid primary key default uuid_generate_v4(),
  titulo varchar(150) not null,
  descricao text,
  valor numeric(10,2),
  link text,
  disponivel boolean default true
);

create table gallery (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  legenda text,
  created_at timestamp default now()
);
```

---

# 5. Wireframes UI/UX

# Home

```text
+------------------------------------------------+
| Gabriel & Débora                                  |
| Vamos nos casar!                               |
| 14 Nov 2026                                    |
| [Confirmar Presença] [Como Chegar]             |
+------------------------------------------------+
| Nossa História                                 |
| Evento                                         |
| Presentes                                      |
| FAQ                                            |
+------------------------------------------------+
```

# RSVP - Cerimônia

```text
+------------------------------+
| Quantas pessoas irão?        |
|  [4]                         |
|                              |
| Informe nomes:               |
|  [Márcio]                    |
|  [Elaine]                    |
|  [Lívia]                     |
|  [Ana]                       |
|                              |
| Deseja deixar uma mensagem   |
| para os noivos?              |
|                              |
| R:                           |
+------------------------------+
```

# RSVP - Jantar

```text
+------------------------------+
| Família Silva                |
|                              |
| Selecione quem comparecerá:  |
|                              |
| Cerimônia  Jantar            | 
| ☑          ☑        Francisco|
| ☑          ☑        Lívia    |
| ☑          ☑        Thiago   |
| ☑          ☑        Lucas    |
| ☑          ☑        Felipe   |
|                              |
| Deseja deixar uma mensagem   |
| para os noivos?              |
|                              |
| R:                           |
+------------------------------+
```

# Admin

```text
+------------------------------+
| Dashboard                    |
|                              |
| Cerimônia: 184               |
| Jantar: 73                   |
| Pendentes: 29                |
|                              |
| [Gerar tokens]               |
| [Exportar CSV]               |
| [Importar convidados]        |
+------------------------------+
```

---

# 6. Design System

## Tipografia

- Títulos: Playfair Display / Cinzel
- Texto: Inter / Open Sans

## Cores

```text
Primária: #C9A66B (dourado)
Secundária: #F7F3EE (off-white)
Texto: #222222
Apoio: #7B8B6F (verde oliva)
```

## Componentes

- Botão primário
- Botão secundário
- Card
- Input
- Navbar sticky
- Accordion FAQ
- Modal confirmação

## Espaçamento

Base 8px grid.

---

# 7. Backlog Scrum

# Epic 1 - Site Público

- [X] Criar layout home
- [X] Criar countdown
- [X] Criar seção evento
- [X] Criar integração maps
- [X] Criar seção história

# Epic 2 - RSVP

- [X] Criar formulário
- [X] Validar inputs
- [ ] Salvar no banco
- [ ] Mensagem sucesso

# Epic 3 - Presentes

- [ ] Página presentes
- [ ] Integração links externos

# Epic 4 - Admin

- [ ] Login admin
- [ ] Dashboard métricas
- [ ] CRUD convidados
- [ ] Exportação CSV

# Epic 5 - Pós Evento

- [ ] Galeria fotos
- [ ] Upload imagens

---

# 8. Roadmap Real

## Semana 1

- Branding
- Wireframes
- Setup projeto

## Semana 2

- Frontend páginas públicas

## Semana 3

- Backend RSVP
- Banco dados

## Semana 4

- Painel admin

## Semana 5

- Presentes
- ICS
- Ajustes UI

## Semana 6

- Testes finais
- SEO
- Deploy

---

# 9. Plano de Deploy

## Ambientes

- Dev local
- Preview (Vercel PR)
- Produção

## Pipeline

```text
Git Push
↓
GitHub
↓
Vercel Build
↓
Deploy automático
```

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

## Domínio

- comprar domínio
- apontar DNS para Vercel
- SSL automático

---

# 10. Checklist Lançamento

## Infraestrutura

- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Banco conectado
- [ ] Variáveis ambiente setadas

## Funcional

- [ ] RSVP funcionando
- [ ] CSV funcionando
- [ ] Maps funcionando
- [ ] ICS funcionando
- [ ] Lista presentes ativa

## Qualidade

- [ ] Mobile revisado
- [ ] Desktop revisado
- [ ] Teste Safari/Chrome
- [ ] Performance > 90 Lighthouse

## Segurança

- [ ] Admin protegido
- [ ] Inputs validados
- [ ] Backup ativo

## Go Live

- [ ] Compartilhar link
- [ ] Testar acessos reais
- [ ] Monitorar erros

---

# 11. Recomendação Final

Stack ideal:

```text
Next.js 15
TypeScript
Tailwind CSS
Supabase
Vercel
React Hook Form
Zod
```

