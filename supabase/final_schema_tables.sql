-- =====================================================
-- SCHEMA FINAL CONSOLIDADO (TABELAS)
-- Origem: migrations 01..15 em supabase/migrations
-- Banco alvo: PostgreSQL / Supabase
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- ENUMS
-- =====================================================

create type invite_type as enum (
  'CERIMONIA',
  'CERIMONIA_JANTAR',
  'VIP'
);

create type member_status as enum (
  'CERIMONIA_E_JANTAR',
  'SOMENTE_CERIMONIA',
  'AUSENTE'
);

create type rsvp_status as enum (
  'PENDENTE',
  'RESPONDIDO'
);

-- =====================================================
-- TABELA: admin_users
-- =====================================================

create table admin_users (
    id uuid primary key default gen_random_uuid(),
    name varchar(120),
    email varchar(150) unique not null,
    password_hash text not null,
    active boolean default true,
    created_at timestamp default now(),
    updated_at timestamp not null default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_admin_users_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_admin_users_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_admin_users_created_by on admin_users(created_by);
create index idx_admin_users_updated_by on admin_users(updated_by);

-- =====================================================
-- TABELA: invitation_groups
-- =====================================================

create table invitation_groups (
    id uuid primary key default gen_random_uuid(),
    token varchar(30) unique,
    nome_grupo varchar(150) not null,
    tipo_convite invite_type not null default 'CERIMONIA',
    observacoes text,
    rsvp_status rsvp_status not null default 'PENDENTE',
    responded_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_invitation_groups_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_invitation_groups_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_invitation_groups_token on invitation_groups(token);
create index idx_invitation_groups_tipo on invitation_groups(tipo_convite);
create index idx_invitation_groups_created_by on invitation_groups(created_by);
create index idx_invitation_groups_updated_by on invitation_groups(updated_by);

-- =====================================================
-- TABELA: group_members
-- =====================================================

create table group_members (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references invitation_groups(id) on delete cascade,
    nome varchar(150) not null,
    pre_cadastrado boolean not null default true,
    ordem_exibicao integer default 0,
    created_at timestamp not null default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_group_members_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_group_members_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_group_members_group on group_members(group_id);
create index idx_group_members_created_by on group_members(created_by);
create index idx_group_members_updated_by on group_members(updated_by);

-- =====================================================
-- TABELA: rsvp_responses
-- =====================================================

create table rsvp_responses (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null unique references invitation_groups(id) on delete cascade,
    mensagem text,
    total_confirmados integer default 0,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_rsvp_responses_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_rsvp_responses_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_rsvp_group on rsvp_responses(group_id);
create index idx_rsvp_responses_created_by on rsvp_responses(created_by);
create index idx_rsvp_responses_updated_by on rsvp_responses(updated_by);

-- =====================================================
-- TABELA: rsvp_member_status
-- =====================================================

create table rsvp_member_status (
    id uuid primary key default gen_random_uuid(),
    response_id uuid not null references rsvp_responses(id) on delete cascade,
    member_id uuid not null references group_members(id) on delete cascade,
    status member_status not null,
    created_at timestamp not null default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    unique(response_id, member_id),

    constraint fk_rsvp_member_status_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_rsvp_member_status_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_member_status_response on rsvp_member_status(response_id);
create index idx_rsvp_member_status_created_by on rsvp_member_status(created_by);
create index idx_rsvp_member_status_updated_by on rsvp_member_status(updated_by);

-- =====================================================
-- TABELA: ceremony_guest_names
-- =====================================================

create table ceremony_guest_names (
    id uuid primary key default gen_random_uuid(),
    response_id uuid not null references rsvp_responses(id) on delete cascade,
    nome varchar(150) not null,
    created_at timestamp not null default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_ceremony_guest_names_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_ceremony_guest_names_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_ceremony_guest_names_response on ceremony_guest_names(response_id);
create index idx_ceremony_guest_names_created_by on ceremony_guest_names(created_by);
create index idx_ceremony_guest_names_updated_by on ceremony_guest_names(updated_by);

-- =====================================================
-- TABELA: event_settings
-- =====================================================

create table event_settings (
    id uuid primary key default gen_random_uuid(),
    nome_casal varchar(200) not null,
    data_evento timestamp not null,
    rsvp_deadline_offset_days integer,
    local_nome varchar(200),
    endereco text,
    google_maps_url text,
    gift_list_url text,
    mensagem_home text,
    ativo boolean default true,
    created_at timestamp default now(),
    updated_at timestamp default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_event_settings_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_event_settings_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_event_settings_created_by on event_settings(created_by);
create index idx_event_settings_updated_by on event_settings(updated_by);

-- =====================================================
-- TABELA: gifts
-- =====================================================

create table gifts (
    id uuid primary key default gen_random_uuid(),
    nome varchar(200) not null,
    descricao text,
    preco numeric(10,2),
    link_externo text,
    imagem_url text,
    ativo boolean default true,
    ordem integer default 0,
    created_at timestamp default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_gifts_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_gifts_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_gifts_created_by on gifts(created_by);
create index idx_gifts_updated_by on gifts(updated_by);

-- =====================================================
-- TABELA: gallery_photos
-- =====================================================

create table gallery_photos (
    id uuid primary key default gen_random_uuid(),
    titulo varchar(200),
    imagem_url text not null,
    publico boolean default true,
    ordem integer default 0,
    created_at timestamp default now(),
    created_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    updated_by uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,

    constraint fk_gallery_photos_created_by
        foreign key (created_by) references admin_users(id) on delete restrict,
    constraint fk_gallery_photos_updated_by
        foreign key (updated_by) references admin_users(id) on delete restrict
);

create index idx_gallery_photos_created_by on gallery_photos(created_by);
create index idx_gallery_photos_updated_by on gallery_photos(updated_by);

-- =====================================================
-- FUNCAO/TRIGGERS DE updated_at (aplicados nas migrations)
-- =====================================================

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_groups_updated
before update on invitation_groups
for each row execute function set_updated_at();

create trigger trg_rsvp_updated
before update on rsvp_responses
for each row execute function set_updated_at();

create trigger trg_event_updated
before update on event_settings
for each row execute function set_updated_at();

create trigger trg_admin_users_updated
before update on admin_users
for each row execute function set_updated_at();

-- =====================================================
-- BOOTSTRAP TECNICO (opcional, mas esperado pelo default created_by/updated_by)
-- =====================================================

insert into admin_users (
    id,
    name,
    email,
    password_hash,
    active,
    created_at,
    updated_at,
    created_by,
    updated_by
)
values (
    '00000000-0000-0000-0000-000000000001',
    'System Audit',
    'system.audit@wedding-invite.invalid',
    '!',
    false,
    now(),
    now(),
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
)
on conflict do nothing;
