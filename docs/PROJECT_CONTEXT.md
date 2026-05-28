# Wedding Invite - Contexto Atual do Projeto

## 1. Resumo Executivo

- Projeto: Wedding Invite (site de casamento com RSVP)
- Stack principal: Next.js App Router + React + TypeScript + Tailwind CSS + Supabase
- Status: MVP em desenvolvimento (home avançada; páginas internas ainda em construção)
- Data de referência deste contexto: 16/04/2026

Objetivo do produto:
- Centralizar informações do casamento
- Permitir confirmação de presença (RSVP)
- Evoluir para painel admin e lista de presentes

---

## 2. Estado Real Verificado no Código

Este documento descreve o estado atual do repositório com base no código existente.

### 2.1 Estrutura principal (hoje)

```text
wedding-invite/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── presentes/page.tsx
│   ├── components/
│   │   ├── actions/
│   │   └── validations/
│   └── types/
├── arc/
│   └── app/
│       └── layout.tsx
├── types/
├── next.config.ts
├── tsconfig.json
├── components.json
├── spec.md
├── spec-tecnica.md
└── PROJECT_CONTEXT.md
```

### 2.2 Observação arquitetural importante

- A árvore ativa de código está em `src/*`.
- Não existe pasta `app/` na raiz neste momento.
- Existe uma pasta auxiliar `arc/app` (não é a árvore principal do App Router).

No `tsconfig.json`, o alias `@/*` aponta para `./src/*`.

Impacto prático:
- Imports com `@/` devem sempre apontar para arquivos em `src/`.
- Ao adicionar novas rotas, usar `src/app`.

---

## 3. Rotas Atuais (App Router)
- Conteúdo atual:
  - Contagem regressiva com animação
  - Seção de história
  - Seção de evento (data/local)
  - Link externo para mapa
  - CTA final
- Estado: Em construção

---
- Arquivo: `src/app/layout.tsx`
- Importa: `./globals.css`
- Estrutura correta com `<html lang="pt-BR">` e `<body suppressHydrationWarning>`

---

const nextConfig = {
  allowedDevOrigins: ["192.168.0.6", "192.168.0.8"],
};
---

## 6. TypeScript e Alias

Arquivo: `tsconfig.json`

```json
"paths": {
Consequência:
- `@/lib/...` resolve para `src/lib/...`

---
- `src/lib/supabase/server.ts`

Padrão atual:
- `createBrowserClient` para client-side
- `createServerClient` com `cookies()` para server-side


### Action
- Arquivo: `src/lib/actions/rsvp.ts`

- Arquivo: `src/lib/validations/rsvp.ts`
- Schema atual:
  - `nome`: string min 3
  - `acompanhantes`: número 0..5
  - `restricao`: opcional

---

### Componentes de layout
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/sections/Countdown.tsx`

### UI base (shadcn)
- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/input.tsx`
- style: `radix-nova`
- tailwind css: `src/app/globals.css`

---
## 10. Dependências Relevantes

Runtime (principais):
- next 16.2.3
- react 19.2.4
- @supabase/ssr 0.10.2
- @supabase/supabase-js 2.103.0
- react-hook-form 7.72.1
- zod 4.3.6
- framer-motion 12.38.0
- tailwindcss 4

Dev (principais):
- typescript 5
- eslint 9
- eslint-config-next 16.2.3
- prettier 3.8.2

---

## 11. Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```

---

## 12. Variáveis de Ambiente Esperadas

Arquivo local: `.env.local`

Variáveis usadas no código:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Boas práticas:
- Não registrar segredos reais em arquivos versionados.

---

## 13. Histórico Técnico Recente

1. Erros de Turbopack por conflito estrutural entre árvores de rotas.
2. Migração para árvore ativa em `src/app`.
3. Padronização de `globals.css` em `src/app/globals.css`.
4. Ajustes em `allowedDevOrigins` no `next.config.ts`.

---

## 14. Riscos Técnicos Atuais

- Pasta auxiliar `arc/app` pode gerar confusão durante manutenção.
- RSVP ainda sem tipagem forte e sem tratamento robusto de erro.
- Páginas de `admin`, `rsvp` e `presentes` ainda estão como placeholders.

---

## 15. Recomendações para Qualquer IA que Continue Este Projeto

1. Priorizar sempre arquivos em `src/*`.
2. Para novas rotas, usar `src/app/*`.
3. Validar após mudanças com `npm run dev` e `npm run lint`.
4. Evitar reintroduzir duplicação de pastas de código.
5. Não versionar segredos.

---

## 16. Próximas Prioridades Técnicas (curto prazo)

1. Implementar formulário funcional em `/rsvp` com `react-hook-form` + `zod`.
2. Tipar corretamente `submitRSVP` e tratar erros de insert.
3. Construir dashboard inicial de `/admin` (listagem RSVP + métricas).
4. Implementar conteúdo real da página `/presentes`.
5. Decidir destino da pasta `arc/` (manter como arquivo/backup ou remover).

---

## 17. Referências de Produto

- Data do casamento na home: 10 de Abril de 2027
- Nomes exibidos: Gabriel & Débora
- Escopo macro: `spec.md`
- Detalhes técnicos adicionais: `spec-tecnica.md`

---

Atualizado em: 16/04/2026
