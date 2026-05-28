-- 5. STATUS INDIVIDUAL DOS MEMBROS
-- (USADO PARA JANTAR / VIP)
-- =====================================================

create table rsvp_member_status (
    id uuid primary key default gen_random_uuid(),

    response_id uuid not null
        references rsvp_responses(id) on delete cascade,

    member_id uuid not null
        references group_members(id) on delete cascade,

    status member_status not null,

    created_at timestamp not null default now(),

    unique(response_id, member_id)
);

create index idx_member_status_response
on rsvp_member_status(response_id);

-- =====================================================
