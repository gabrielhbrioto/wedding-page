-- 3. MEMBROS DO GRUPO
-- =====================================================

create table group_members (
    id uuid primary key default gen_random_uuid(),

    group_id uuid not null references invitation_groups(id) on delete cascade,

    nome varchar(150) not null,

    pre_cadastrado boolean not null default true,

    ordem_exibicao integer default 0,

    created_at timestamp not null default now()
);

create index idx_group_members_group
on group_members(group_id);

-- =====================================================
