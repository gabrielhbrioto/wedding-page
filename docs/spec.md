# Documento de Especificação de Software (DES)

## Projeto: Site de Casamento / Convite Virtual
**Versão:** 1.0  
**Data:** 14/04/2026  
**Status:** Planejamento Inicial

---

# 1. Visão Geral

## 1.1 Objetivo

Desenvolver uma plataforma web responsiva para servir como **site oficial do casamento**, centralizando informações do evento, confirmação de presença dos convidados (RSVP), lista de presentes e recursos digitais relacionados ao evento.

O sistema deverá proporcionar uma experiência elegante, simples e intuitiva para convidados, além de oferecer painel administrativo para gerenciamento dos dados pelos noivos.

## 1.2 Objetivos de Negócio

- Reduzir custos com convites físicos.
- Centralizar comunicação do evento.
- Automatizar confirmação de presença.
- Facilitar logística dos convidados.
- Melhorar organização da lista de presença.
- Disponibilizar canal moderno para lista de presentes.
- Criar lembrança digital do evento.

---

# 2. Escopo do Projeto

## 2.1 Escopo da Versão 1 (MVP)

### Público (visitantes)

- Página inicial personalizada.
- Data e horário do evento.
- Contagem regressiva.
- Localização com integração de mapas.
- Informações da cerimônia e festa.
- História do casal.
- Dress code.
- FAQ.
- RSVP online.
- Download de convite em `.ics`.
- Lista de presentes.
- Responsividade mobile.

### Administrativo

- Login administrativo.
- Dashboard com confirmações.
- Exportação CSV.
- Gestão de convidados.
- Consulta de respostas.

## 2.2 Escopo da Versão 2 (Pós-evento)

- Galeria de fotos.
- Vídeos.
- Upload colaborativo.
- Mensagens dos convidados.
- Álbum privado.

---

# 3. Stakeholders

| Stakeholder | Papel |
|---|---|
| Noivos | Clientes / administradores |
| Convidados | Usuários finais |
| Desenvolvedor | Construção e manutenção |
| Fotógrafo | Fornecedor futuro da galeria |

---

# 4. Requisitos Funcionais

## RF01 – Página Inicial

O sistema deve apresentar landing page contendo:

- Nome do casal
- Foto/banner
- Data do casamento
- Botões principais
- Navegação entre seções

## RF02 – Contagem Regressiva

O sistema deve exibir contador regressivo em tempo real até a data do casamento.

## RF03 – Informações do Evento

O sistema deve exibir:

- Data
- Horário
- Endereço
- Nome do local
- Observações

## RF04 – Integração com Mapas

O sistema deve permitir abertura do local em Google Maps e Waze (opcional).

## RF05 – História do Casal

O sistema deve permitir cadastro de texto, imagens e timeline.

## RF06 – RSVP

- RSVP por link personalizado.
- Convites por grupo familiar.
- Confirmação segmentada por tipo de convite.
- Controle separado de presença na cerimônia e jantar.

Para os convidados apenas para a cerimônia, o sistema deve permitir confirmação de presença com:

- Lista de pessoas que comparecerão
- Mensagem aos noivos

Para os convidados tanto para a cerimônia, quanto para o jantar, o sistema deve permitir confirmação de presença com:

- Sim/não para cada nome da família
- Mensagem aos noivos

## RF07 – Convite Individualizado

Cada convidado poderá acessar link único:

`site.com/rsvp?code=ABC123`

## RF08 – Exportar para Agenda

O sistema deve permitir baixar arquivo `.ics` contendo:

- Título do evento
- Local
- Horário
- Descrição

## RF09 – Lista de Presentes

- Links externos ou lista interna com cotas simbólicas.

## RF10 – FAQ

Área de perguntas frequentes editável.

## RF11 – Painel Administrativo

- Visualizar confirmações
- Editar convidados
- Filtrar respostas
- Exportar CSV
- Atualizar conteúdos

## RF12 – Galeria Pós Evento (V2)

Exibir fotos e vídeos após cerimônia.

## RF13 – Convites por Grupo Familiar

O sistema deve permitir que um único convite represente múltiplos convidados vinculados a um grupo familiar ou grupo social.

## RF14 – Convites Segmentados

O sistema deve permitir tipos de convite:

- Cerimônia
- Cerimônia + Jantar
- VIP (opcional)

## RF15 – RSVP Dinâmico por Tipo

Ao acessar o link personalizado:

- convidados somente cerimônia poderão informar nomes dos participantes
- convidados do jantar visualizarão lista pré-cadastrada com seleção individual de presença

## RF16 – Controle de Presença por Evento

O sistema deve contabilizar separadamente:

- presença na cerimônia
- presença no jantar

---

# 5. Requisitos Não Funcionais

- Responsivo para mobile, tablet e desktop.
- Carregamento médio inferior a 2 segundos.
- Disponibilidade mínima de 99,5%.
- HTTPS obrigatório.
- Compatível com LGPD.
- SEO otimizado.
- Escalável para picos de acesso.

---

# 6. Arquitetura Técnica

```text
Frontend (Next.js)
↓
API Serverless
↓
Supabase PostgreSQL
↓
Storage (imagens)
```

---

# 7. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js |
| Linguagem | TypeScript |
| UI | Tailwind CSS |
| Backend | API Routes |
| Banco | Supabase |
| Hospedagem | Vercel |
| Versionamento | GitHub |

---

# 8. Modelo de Dados

## guests

- id
- nome
- email
- telefone
- codigo_convite
- acompanhantes_max
- grupo

## rsvp

- id
- guest_id
- comparecera
- acompanhantes
- restricao
- mensagem
- created_at

## gallery (V2)

- id
- image_url
- legenda
- created_at

---

# 9. Fluxos do Sistema

## RSVP

```text
Convidado recebe link único
↓
Acessa /convite/[token]
↓
Sistema identifica tipo de convite
↓
Renderiza formulário correspondente
↓
Salva confirmação
↓
Atualiza métricas
```

## Admin

```text
Login
↓
Dashboard
↓
Consulta convidados
↓
Exporta CSV
```

---

# 10. Estrutura de Telas

## Público

- Home
- Evento
- História
- RSVP
- Presentes
- FAQ

## Administrativo

- Login
- Dashboard
- Convidados
- Respostas
- Configurações

---

# 11. Integrações Externas

- Google Maps
- Google Calendar
- WhatsApp
- Plataformas de presentes

---

# 12. Regras de Negócio

- Cada grupo terá token único.
- Cada token só poderá responder seu próprio convite.
- Convites do jantar não poderão adicionar novos nomes.
- Convites de cerimônia poderão informar participantes.
- RSVP editável até data limite.
- Dashboard exibirá totais separados.

---

# 13. Segurança

- Login seguro admin.
- Rate limiting.
- Captcha opcional.
- Backup diário.

---

# 14. Cronograma Sugerido

| Semana | Entrega |
|---|---|
| 1 | Layout + identidade |
| 2 | Site público |
| 3 | RSVP + Banco |
| 4 | Painel admin |
| 5 | Presentes + ICS |
| 6 | QA + deploy |

---

# 15. Custos Estimados

| Item | Valor |
|---|---|
| Domínio | R$ 40–70/ano |
| Hospedagem | R$ 0 inicial |
| Banco | R$ 0 inicial |

---

# 16. Critérios de Aceite

- Site funcionando em mobile e desktop.
- RSVP persistindo dados corretamente.
- ICS funcionando.
- Maps abrindo corretamente.
- Exportação CSV operacional.

---

# 17. Riscos do Projeto

- Pico de acessos.
- Spam RSVP.
- Mudança de local.
- Dados incorretos.

---

# 18. Evolução Futura (V2)

- Álbum de fotos
- Vídeos
- Upload convidados
- Mensagens
- Área privada

---

# 19. Recomendação Final Técnica

`Next.js + TypeScript + Tailwind + Supabase + Vercel`

---

# 20. Próximos Passos

- [ ] Definir identidade visual
- [ ] Escolher domínio
- [ ] Criar wireframes
- [ ] Construir MVP
- [ ] Testar com familiares
- [ ] Publicar
