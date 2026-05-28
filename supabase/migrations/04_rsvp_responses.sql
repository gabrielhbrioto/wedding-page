-- 4. RESPOSTA PRINCIPAL RSVP
-- =====================================================

create table rsvp_responses (
    id uuid primary key default gen_random_uuid(),

    group_id uuid not null unique
        references invitation_groups(id) on delete cascade,

    mensagem text,
    -- restricoes_alimentares text,

    total_confirmados integer default 0,

    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index idx_rsvp_group
on rsvp_responses(group_id);

-- =====================================================
