# Wedding Invite API - Documentação de Rotas

**Versão:** 1.0.0  
**Data:** 28 de Abril de 2026  
**Base URL:** `http://localhost:8000/api/v1`

---

## 📑 Índice

1. [Rotas Públicas](#rotas-públicas)
2. [Autenticação (Admin)](#autenticação-admin)
3. [Grupos de Convidados](#grupos-de-convidados)
4. [Membros de Grupos](#membros-de-grupos)
5. [RSVP (Confirmações)](#rsvp-confirmações)
6. [Dashboard](#dashboard)
7. [Estatísticas](#estatísticas)
8. [Presentes (Gifts)](#presentes-gifts)
9. [Galeria de Fotos](#galeria-de-fotos)
10. [Exportações](#exportações)
11. [Configurações do Evento](#configurações-do-evento)

---

## 🌐 Rotas Públicas

### GET `/public/event`

**Objetivo:** Retornar dados da cerimônia (nome do casal, data, local, etc.)

**Autenticação:** Não requerida

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "id": "uuid",
  "nome_casal": "Gabriel & Débora",
  "data_evento": "2027-04-10T16:00:00",
  "local_nome": "Igreja Presbiteriana Filadélfia",
  "endereco": "São Carlos, SP",
  "google_maps_url": "https://maps.app.goo.gl/...",
  "mensagem_home": "Bem-vindos!",
  "ativo": true,
  "created_at": "2026-04-28T22:05:25.763481",
  "updated_at": "2026-04-28T22:05:25.763481"
}
```

**Erros:**
- `404`: Configurações do evento não encontradas

---

### GET `/public/countdown`

**Objetivo:** Retornar data do evento para contagem regressiva (frontend)

**Autenticação:** Não requerida

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "date": "2027-04-10T16:00:00"
}
```

---

### GET `/public/invite/{token}`

**Objetivo:** Retornar informações do convite (grupo, tipo, membros)

**Autenticação:** Não requerida

**Parâmetros:**
- `token` (string): Token único do convite

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "token": "abc123",
  "group_name": "Familia Silva",
  "type": "CERIMONIA_JANTAR",
  "members": [
    {"id": "member-1", "name": "Francisco"},
    {"id": "member-2", "name": "Livia"}
  ]
}
```

---

### POST `/public/rsvp/{token}`

**Objetivo:** Confirmar RSVP de um grupo via token

**Autenticação:** Não requerida

**Parâmetros:**
- `token` (string): Token único do convite

**Payload:**
```json
{
  "message": "Estamos confirmados",
  "members": [
    {"member_id": "uuid", "status": "CERIMONIA_E_JANTAR"},
    {"member_id": "uuid", "status": "AUSENTE"}
  ]
}
```

**Resposta (200):**
```json
{
  "success": true,
  "token": "abc123",
  "response_id": "uuid",
  "total_confirmados": 1
}
```

---

### POST `/public/rsvp/open`

**Objetivo:** Permitir RSVP genérico (sem token/grupo específico)

**Autenticação:** Não requerida

**Payload:**
```json
{
  "guest_names": ["Francisco", "Livia"],
  "message": "Estamos confirmados"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "response_id": "uuid"
}
```

---

### GET `/public/calendar/{token}.ics`

**Objetivo:** Retornar arquivo iCalendar (.ics) com data/hora do evento

**Autenticação:** Não requerida

**Parâmetros:**
- `token` (string): Token único do convite

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "token": "abc123",
  "filename": "invite-abc123.ics",
  "content": "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR"
}
```

---

### GET `/public/gifts`

**Objetivo:** Listar presentes (lista pública)

**Autenticação:** Não requerida

**Payload:** Nenhum

**Resposta (200):**
```json
[
  {
    "id": "gift-1",
    "name": "Jogo de jantar",
    "price": 350.00,
    "available": true
  },
  {
    "id": "gift-2",
    "name": "Air fryer",
    "price": 500.00,
    "available": true
  }
]
```

---

### POST `/public/gifts/{gift_id}/reserve`

**Objetivo:** Reservar um presente

**Autenticação:** Não requerida

**Parâmetros:**
- `gift_id` (string): ID do presente

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "reserved": true,
  "gift_id": "gift-1"
}
```

---

### GET `/public/gallery`

**Objetivo:** Listar fotos da galeria (públicas)

**Autenticação:** Não requerida

**Payload:** Nenhum

**Resposta (200):**
```json
[]
```

---

## 🔐 Autenticação (Admin)

**Prefixo:** `/admin/auth`

### POST `/admin/auth/login`

**Objetivo:** Autenticar admin e gerar tokens JWT (access + refresh)

**Autenticação:** Não requerida

**Payload:**
```json
{
  "email": "admin@exemplo.com",
  "password": "senha123",
  "remember_me": false
}
```

**Validações:**
- `email`: EmailStr (válido)
- `password`: string, min_length=1
- `remember_me`: boolean (opcional, padrão: false)

**Resposta (200):**
```json
{
  "success": true,
  "token_type": "bearer",
  "access_expires_in": 3600,
  "remember_me": false
}
```

**Cookies setados:**
- `ACCESS_COOKIE_NAME`: Token de acesso (httponly, secure se production)
- `REFRESH_COOKIE_NAME`: Token de refresh (se remember_me=true)

**Erros:**
- `401`: Email ou senha inválidos

---

### POST `/admin/auth/logout`

**Objetivo:** Desautentica admin (limpa cookies)

**Autenticação:** Requerida (admin)

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "success": true
}
```

---

### GET `/admin/auth/me`

**Objetivo:** Retornar dados do admin autenticado

**Autenticação:** Requerida (admin)

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "id": "uuid",
  "email": "admin@exemplo.com",
  "name": "Gabriel da Silva",
  "role": "admin"
}
```

---

## 👥 Grupos de Convidados

**Prefixo:** `/admin/groups`  
**Autenticação:** Requerida em todas as rotas

### GET `/admin/groups`

**Objetivo:** Listar todos os grupos de convidados

**Payload:** Nenhum

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "token": "grupo-1",
    "nome_grupo": "Familia Silva",
    "tipo_convite": "CERIMONIA_JANTAR",
    "observacoes": "Grupo da noiva",
    "rsvp_status": "PENDENTE",
    "responded_at": null,
    "created_at": "2026-04-28T10:00:00",
    "updated_at": "2026-04-28T10:00:00"
  }
]
```

**Enums - `tipo_convite`:**
- `CERIMONIA` - Apenas cerimônia
- `CERIMONIA_JANTAR` - Cerimônia e jantar
- `JANTAR` - Apenas jantar

**Enums - `rsvp_status`:**
- `PENDENTE` - Aguardando resposta
- `CONFIRMADO` - Confirmado que virá
- `RECUSADO` - Recusou o convite

---

### POST `/admin/groups` (201)

**Objetivo:** Criar novo grupo de convidados

**Payload:**
```json
{
  "token": "grupo-silva",
  "nome_grupo": "Familia Silva",
  "tipo_convite": "CERIMONIA_JANTAR",
  "observacoes": "Grupo da noiva"
}
```

**Validações:**
- `token`: string, max_length=30 (opcional, unique)
- `nome_grupo`: string, min_length=1, max_length=150 (obrigatório)
- `tipo_convite`: InviteType (padrão: CERIMONIA)
- `observacoes`: string (opcional)

**Resposta (201):**
```json
{
  "id": "uuid",
  "token": "grupo-silva",
  "nome_grupo": "Familia Silva",
  "tipo_convite": "CERIMONIA_JANTAR",
  "observacoes": "Grupo da noiva",
  "rsvp_status": "PENDENTE",
  "responded_at": null,
  "created_at": "2026-04-28T10:00:00",
  "updated_at": "2026-04-28T10:00:00"
}
```

**Erros:**
- `409`: Token duplicado ou dados inválidos

---

### GET `/admin/groups/{group_id}`

**Objetivo:** Retornar detalhes de um grupo + seus membros

**Parâmetros:**
- `group_id` (UUID): ID do grupo

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "id": "uuid",
  "token": "grupo-silva",
  "nome_grupo": "Familia Silva",
  "tipo_convite": "CERIMONIA_JANTAR",
  "observacoes": "Grupo da noiva",
  "rsvp_status": "PENDENTE",
  "responded_at": null,
  "created_at": "2026-04-28T10:00:00",
  "updated_at": "2026-04-28T10:00:00",
  "members": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "nome": "Francisco Silva",
      "pre_cadastrado": true,
      "ordem_exibicao": 1,
      "created_at": "2026-04-28T10:00:00"
    }
  ]
}
```

**Erros:**
- `404`: Grupo não encontrado

---

### PUT `/admin/groups/{group_id}`

**Objetivo:** Atualizar dados de um grupo

**Parâmetros:**
- `group_id` (UUID): ID do grupo

**Payload:**
```json
{
  "token": "grupo-silva-updated",
  "nome_grupo": "Familia Silva (Atualizado)",
  "tipo_convite": "CERIMONIA",
  "observacoes": "Observação modificada",
  "rsvp_status": "CONFIRMADO",
  "responded_at": "2026-04-28T15:30:00"
}
```

**Validações:** Todos os campos são opcionais (partial update)

**Resposta (200):**
```json
{
  "id": "uuid",
  "token": "grupo-silva-updated",
  "nome_grupo": "Familia Silva (Atualizado)",
  "tipo_convite": "CERIMONIA",
  "observacoes": "Observação modificada",
  "rsvp_status": "CONFIRMADO",
  "responded_at": "2026-04-28T15:30:00",
  "created_at": "2026-04-28T10:00:00",
  "updated_at": "2026-04-28T16:00:00"
}
```

**Erros:**
- `404`: Grupo não encontrado
- `409`: Token duplicado

---

### DELETE `/admin/groups/{group_id}`

**Objetivo:** Deletar um grupo (e seus membros por cascata)

**Parâmetros:**
- `group_id` (UUID): ID do grupo

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "deleted": true,
  "id": "uuid"
}
```

**Erros:**
- `404`: Grupo não encontrado

---

### POST `/admin/groups/{group_id}/members` (201)

**Objetivo:** Adicionar membro a um grupo

**Parâmetros:**
- `group_id` (UUID): ID do grupo

**Payload:**
```json
{
  "nome": "Francisco Silva",
  "pre_cadastrado": true,
  "ordem_exibicao": 1
}
```

**Validações:**
- `nome`: string, min_length=1, max_length=150 (obrigatório)
- `pre_cadastrado`: boolean (padrão: true)
- `ordem_exibicao`: integer (padrão: 0)

**Resposta (201):**
```json
{
  "created": true,
  "group_id": "uuid",
  "member": {
    "id": "uuid",
    "group_id": "uuid",
    "nome": "Francisco Silva",
    "pre_cadastrado": true,
    "ordem_exibicao": 1,
    "created_at": "2026-04-28T10:00:00"
  }
}
```

**Erros:**
- `404`: Grupo não encontrado

---

## 👤 Membros de Grupos

**Prefixo:** `/admin/members`  
**Autenticação:** Requerida em todas as rotas

### PUT `/admin/members/{member_id}`

**Objetivo:** Atualizar dados de um membro

**Parâmetros:**
- `member_id` (UUID): ID do membro

**Payload:**
```json
{
  "nome": "Francisco Silva Atualizado",
  "pre_cadastrado": false,
  "ordem_exibicao": 2
}
```

**Validações:** Todos os campos são opcionais (partial update)

**Resposta (200):**
```json
{
  "id": "uuid",
  "group_id": "uuid",
  "nome": "Francisco Silva Atualizado",
  "pre_cadastrado": false,
  "ordem_exibicao": 2,
  "created_at": "2026-04-28T10:00:00"
}
```

**Erros:**
- `404`: Membro não encontrado

---

### DELETE `/admin/members/{member_id}`

**Objetivo:** Deletar um membro de um grupo

**Parâmetros:**
- `member_id` (UUID): ID do membro

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "deleted": true,
  "id": "uuid"
}
```

**Erros:**
- `404`: Membro não encontrado

---

## 📋 RSVP (Confirmações)

**Prefixo:** `/admin/rsvps`  
**Autenticação:** Requerida em todas as rotas

### GET `/admin/rsvps`

**Objetivo:** Listar todas as confirmações (RSVPs)

**Payload:** Nenhum

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "group_id": "uuid",
    "nome_grupo": "Familia Silva",
    "mensagem": "Muito felizes em celebrar com vocês!",
    "total_confirmados": 4,
    "created_at": "2026-04-28T10:00:00",
    "updated_at": "2026-04-28T10:00:00"
  }
]
```

---

### GET `/admin/rsvps/{rsvp_id}`

**Objetivo:** Retornar detalhes de um RSVP com membros confirmados

**Parâmetros:**
- `rsvp_id` (UUID): ID do RSVP

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "id": "uuid",
  "group_id": "uuid",
  "nome_grupo": "Familia Silva",
  "mensagem": "Muito felizes em celebrar com vocês!",
  "total_confirmados": 4,
  "created_at": "2026-04-28T10:00:00",
  "updated_at": "2026-04-28T10:00:00",
  "members": [
    {
      "member_id": "uuid",
      "member_name": "Francisco",
      "status": "CONFIRMADO"
    }
  ],
  "ceremony_guest_names": [
    {
      "id": "uuid",
      "nome": "Francisco Silva"
    }
  ]
}
```

**Enums - `status`:**
- `CONFIRMADO` - Confirmou presença
- `APENAS_CERIMONIA` - Só vai à cerimônia
- `AUSENTE` - Não irá

**Erros:**
- `404`: RSVP não encontrado

---

### DELETE `/admin/rsvps/{rsvp_id}`

**Objetivo:** Resetar/deletar um RSVP (volta grupo para PENDENTE)

**Parâmetros:**
- `rsvp_id` (UUID): ID do RSVP

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "reset": true,
  "id": "uuid",
  "group_id": "uuid"
}
```

**Erros:**
- `404`: RSVP não encontrado

---

## 📊 Dashboard

**Prefixo:** `/admin/dashboard`  
**Autenticação:** Requerida

### GET `/admin/dashboard`

**Objetivo:** Retornar resumo executivo com volume de grupos, distribuição por tipo de convite e taxa de resposta

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "total_groups": 25,
  "confirmed": 18,
  "pending": 7,
  "dinner_count": 65,
  "ceremony_groups": 9,
  "ceremony_dinner_groups": 14,
  "vip_groups": 2,
  "response_rate_percent": 72.0
}
```

---

## 📈 Estatísticas

**Prefixo:** `/admin/stats`  
**Autenticação:** Requerida

### GET `/admin/stats/presence`

**Objetivo:** Retornar estatísticas de presença por convidado, incluindo total de membros, respondidos e pendentes

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "dinner_confirmed": 65,
  "ceremony_only": 12,
  "absent": 5,
  "total_members": 82,
  "responded_members": 77,
  "pending_members": 5
}
```

---

### GET `/admin/stats/gifts`

**Objetivo:** Retornar estatísticas de presentes (total, ativos, reservados)

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "total_items": 50,
  "active_items": 38,
  "reserved_items": 12
}
```

---

## 🎁 Presentes (Gifts)

**Prefixo:** `/admin/gifts`  
**Autenticação:** Requerida em todas as rotas

### GET `/admin/gifts`

**Objetivo:** Listar todos os presentes

**Payload:** Nenhum

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "nome": "Jogo de Jantar",
    "descricao": "Jogo de jantar completo para 12 pessoas",
    "preco": 350.00,
    "link_externo": "https://www.shop.com/jogo-jantar",
    "imagem_url": "https://cdn.example.com/jogo-jantar.jpg",
    "ativo": true,
    "ordem": 1,
    "created_at": "2026-04-28T10:00:00"
  }
]
```

---

### POST `/admin/gifts` (201)

**Objetivo:** Criar novo presente

**Payload:**
```json
{
  "nome": "Air Fryer",
  "descricao": "Air fryer 5L",
  "preco": 500.00,
  "link_externo": "https://www.shop.com/air-fryer",
  "imagem_url": "https://cdn.example.com/air-fryer.jpg",
  "ativo": true,
  "ordem": 2
}
```

**Validações:**
- `nome`: string (obrigatório)
- `descricao`: string (opcional)
- `preco`: float (obrigatório)
- `link_externo`: URL (opcional)
- `imagem_url`: URL (opcional)
- `ativo`: boolean (padrão: true)
- `ordem`: integer (padrão: 0)

**Resposta (201):**
```json
{
  "id": "uuid",
  "nome": "Air Fryer",
  "descricao": "Air fryer 5L",
  "preco": 500.00,
  "link_externo": "https://www.shop.com/air-fryer",
  "imagem_url": "https://cdn.example.com/air-fryer.jpg",
  "ativo": true,
  "ordem": 2,
  "created_at": "2026-04-28T10:00:00"
}
```

---

### PUT `/admin/gifts/{gift_id}`

**Objetivo:** Atualizar presente

**Parâmetros:**
- `gift_id` (UUID): ID do presente

**Payload:**
```json
{
  "nome": "Air Fryer Pro",
  "descricao": "Air fryer 6L com mais potência",
  "preco": 600.00,
  "ativo": true
}
```

**Validações:** Todos os campos são opcionais

**Resposta (200):**
```json
{
  "id": "uuid",
  "nome": "Air Fryer Pro",
  "descricao": "Air fryer 6L com mais potência",
  "preco": 600.00,
  "link_externo": "https://www.shop.com/air-fryer",
  "imagem_url": "https://cdn.example.com/air-fryer.jpg",
  "ativo": true,
  "ordem": 2,
  "created_at": "2026-04-28T10:00:00"
}
```

**Erros:**
- `404`: Presente não encontrado

---

### DELETE `/admin/gifts/{gift_id}`

**Objetivo:** Deletar um presente

**Parâmetros:**
- `gift_id` (UUID): ID do presente

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "deleted": true,
  "id": "uuid"
}
```

**Erros:**
- `404`: Presente não encontrado

---

## 🖼️ Galeria de Fotos

**Prefixo:** `/admin/gallery`  
**Autenticação:** Requerida em rotas de escrita

### POST `/admin/gallery/upload` (201)

**Objetivo:** Fazer upload de foto para galeria

**Payload:**
```json
{
  "titulo": "Foto da Cerimonia 1",
  "imagem_url": "https://cdn.example.com/foto1.jpg",
  "publico": true,
  "ordem": 1
}
```

**Validações:**
- `titulo`: string (obrigatório)
- `imagem_url`: URL (obrigatório)
- `publico`: boolean (padrão: true)
- `ordem`: integer (padrão: 0)

**Resposta (201):**
```json
{
  "uploaded": true,
  "photo": {
    "id": "uuid",
    "titulo": "Foto da Cerimonia 1",
    "imagem_url": "https://cdn.example.com/foto1.jpg",
    "publico": true,
    "ordem": 1,
    "created_at": "2026-04-28T10:00:00"
  }
}
```

---

### DELETE `/admin/gallery/{photo_id}`

**Objetivo:** Deletar foto da galeria

**Parâmetros:**
- `photo_id` (UUID): ID da foto

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "deleted": true,
  "id": "uuid"
}
```

**Erros:**
- `404`: Foto não encontrada

---

## 📥 Exportações

**Prefixo:** `/admin/export`  
**Autenticação:** Requerida

### GET `/admin/export/rsvps.csv`

**Objetivo:** Exportar RSVPs em CSV

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "url": "generated-rsvps.csv"
}
```

---

### GET `/admin/export/groups.csv`

**Objetivo:** Exportar grupos em CSV

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "url": "generated-groups.csv"
}
```

---

### GET `/admin/export/gifts.csv`

**Objetivo:** Exportar presentes em CSV

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "url": "generated-gifts.csv"
}
```

---

## ⚙️ Configurações do Evento

**Prefixo:** `/admin/settings`  
**Autenticação:** Requerida em todas as rotas

### GET `/admin/settings`

**Objetivo:** Retornar configurações do evento (nome casal, data, local, etc.)

**Payload:** Nenhum

**Resposta (200):**
```json
{
  "id": "uuid",
  "nome_casal": "Gabriel & Débora",
  "data_evento": "2027-04-10T16:00:00",
  "local_nome": "Igreja Presbiteriana Filadélfia",
  "endereco": "São Carlos, SP",
  "google_maps_url": "https://maps.app.goo.gl/...",
  "mensagem_home": "Bem-vindos!",
  "ativo": true,
  "created_at": "2026-04-28T10:00:00",
  "updated_at": "2026-04-28T10:00:00"
}
```

**Erros:**
- `404`: Configurações não encontradas

---

### PUT `/admin/settings`

**Objetivo:** Atualizar configurações (ou criar se não existir)

**Payload:**
```json
{
  "nome_casal": "Gabriel & Débora",
  "data_evento": "2027-04-10T16:00:00",
  "local_nome": "Igreja Presbiteriana Filadélfia",
  "endereco": "São Carlos, SP",
  "google_maps_url": "https://maps.app.goo.gl/...",
  "mensagem_home": "Muito felizes!",
  "ativo": true
}
```

**Validações:**
- `nome_casal`: string (obrigatório para criar)
- `data_evento`: datetime (obrigatório para criar)
- Demais campos: opcionais (partial update)

**Resposta (200):**
```json
{
  "created": true,
  "settings": {
    "id": "uuid",
    "nome_casal": "Gabriel & Débora",
    "data_evento": "2027-04-10T16:00:00",
    "local_nome": "Igreja Presbiteriana Filadélfia",
    "endereco": "São Carlos, SP",
    "google_maps_url": "https://maps.app.goo.gl/...",
    "mensagem_home": "Muito felizes!",
    "ativo": true,
    "created_at": "2026-04-28T10:00:00",
    "updated_at": "2026-04-28T10:00:00"
  }
}
```

Ou (se atualizando):
```json
{
  "updated": true,
  "settings": { ... }
}
```

**Erros:**
- `400`: Para criar, informe nome_casal e data_evento

---

## 🔑 Notas Importantes

- **Autenticação:** Admin routes usam JWT em cookies (ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME)
- **CORS:** Frontend URL = `http://localhost:3000` (development)
- **Paginação:** Atualmente não implementada; retorna todos os resultados
- **Filtros:** Não implementados; ordenação é por data ou ordem de exibição
- **Validação:** Email uses EmailStr (Pydantic validator)
- **Status HTTP Padrões:**
  - `200`: Sucesso
  - `201`: Criado com sucesso
  - `400`: Requisição inválida
  - `401`: Não autenticado
  - `404`: Recurso não encontrado
  - `409`: Conflito (ex: token duplicado)

---

**Última atualização:** 28 de Abril de 2026
