-- 6. NOMES INFORMADOS LIVREMENTE
-- (USADO PARA CERIMÔNIA)
-- =====================================================

create table ceremony_guest_names (
    id uuid primary key default gen_random_uuid(),

    response_id uuid not null
        references rsvp_responses(id) on delete cascade,

    nome varchar(150) not null,

    created_at timestamp not null default now()
);

create index idx_ceremony_guest_names_response
on ceremony_guest_names(response_id);

-- =====================================================
