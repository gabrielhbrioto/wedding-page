-- 2. TABELA PRINCIPAL: GRUPOS / FAMÍLIAS
-- =====================================================

create table invitation_groups (
    id uuid primary key default gen_random_uuid(),

    token varchar(30) unique,

    nome_grupo varchar(150) not null,
    -- responsavel_nome varchar(150),
    -- telefone varchar(30),
    -- email varchar(150),

    tipo_convite invite_type not null default 'CERIMONIA',

    observacoes text,

    -- max_pessoas integer default 10,

    rsvp_status rsvp_status not null default 'PENDENTE',

    responded_at timestamp,

    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index idx_invitation_groups_token
on invitation_groups(token);

create index idx_invitation_groups_tipo
on invitation_groups(tipo_convite);

-- =====================================================
