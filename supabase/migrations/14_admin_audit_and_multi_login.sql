-- 14. AUDITORIA DE AUTORIA + MULTI-LOGIN ADMIN
-- =====================================================
-- Objetivo:
-- 1) Adicionar created_by e updated_by em todas as tabelas de dominio + admin_users.
-- 2) Criar usuario tecnico de sistema para backfill legado.
-- 3) Aplicar FKs de auditoria para admin_users(id) e consolidar NOT NULL.

-- UUID fixo do usuario tecnico (nao autenticavel)
-- Mantido como constante para consultas e rastreabilidade.

insert into admin_users (
    id,
    name,
    email,
    password_hash,
    active,
    created_at
)
values (
    '00000000-0000-0000-0000-000000000001',
    'System Audit',
    'system.audit@wedding-invite.invalid',
    '!',
    false,
    now()
)
on conflict do nothing;

-- 1) Adicao de colunas (fase transitoria nullable)
alter table admin_users add column if not exists created_by uuid;
alter table admin_users add column if not exists updated_by uuid;
alter table admin_users alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table admin_users alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table invitation_groups add column if not exists created_by uuid;
alter table invitation_groups add column if not exists updated_by uuid;
alter table invitation_groups alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table invitation_groups alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table group_members add column if not exists created_by uuid;
alter table group_members add column if not exists updated_by uuid;
alter table group_members alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table group_members alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table rsvp_responses add column if not exists created_by uuid;
alter table rsvp_responses add column if not exists updated_by uuid;
alter table rsvp_responses alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table rsvp_responses alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table rsvp_member_status add column if not exists created_by uuid;
alter table rsvp_member_status add column if not exists updated_by uuid;
alter table rsvp_member_status alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table rsvp_member_status alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table ceremony_guest_names add column if not exists created_by uuid;
alter table ceremony_guest_names add column if not exists updated_by uuid;
alter table ceremony_guest_names alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table ceremony_guest_names alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table event_settings add column if not exists created_by uuid;
alter table event_settings add column if not exists updated_by uuid;
alter table event_settings alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table event_settings alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table gifts add column if not exists created_by uuid;
alter table gifts add column if not exists updated_by uuid;
alter table gifts alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table gifts alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

alter table gallery_photos add column if not exists created_by uuid;
alter table gallery_photos add column if not exists updated_by uuid;
alter table gallery_photos alter column created_by set default '00000000-0000-0000-0000-000000000001'::uuid;
alter table gallery_photos alter column updated_by set default '00000000-0000-0000-0000-000000000001'::uuid;

-- 2) Backfill legado para usuario tecnico
update admin_users
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update invitation_groups
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update group_members
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update rsvp_responses
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update rsvp_member_status
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update ceremony_guest_names
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update event_settings
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update gifts
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

update gallery_photos
set
    created_by = coalesce(created_by, '00000000-0000-0000-0000-000000000001'::uuid),
    updated_by = coalesce(updated_by, created_by, '00000000-0000-0000-0000-000000000001'::uuid)
where created_by is null
   or updated_by is null;

-- 3) Constraints FK de auditoria (com verificacao para evitar duplicidade)
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'fk_admin_users_created_by'
    ) then
        alter table admin_users
            add constraint fk_admin_users_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_admin_users_updated_by'
    ) then
        alter table admin_users
            add constraint fk_admin_users_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_invitation_groups_created_by'
    ) then
        alter table invitation_groups
            add constraint fk_invitation_groups_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_invitation_groups_updated_by'
    ) then
        alter table invitation_groups
            add constraint fk_invitation_groups_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_group_members_created_by'
    ) then
        alter table group_members
            add constraint fk_group_members_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_group_members_updated_by'
    ) then
        alter table group_members
            add constraint fk_group_members_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_rsvp_responses_created_by'
    ) then
        alter table rsvp_responses
            add constraint fk_rsvp_responses_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_rsvp_responses_updated_by'
    ) then
        alter table rsvp_responses
            add constraint fk_rsvp_responses_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_rsvp_member_status_created_by'
    ) then
        alter table rsvp_member_status
            add constraint fk_rsvp_member_status_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_rsvp_member_status_updated_by'
    ) then
        alter table rsvp_member_status
            add constraint fk_rsvp_member_status_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_ceremony_guest_names_created_by'
    ) then
        alter table ceremony_guest_names
            add constraint fk_ceremony_guest_names_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_ceremony_guest_names_updated_by'
    ) then
        alter table ceremony_guest_names
            add constraint fk_ceremony_guest_names_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_event_settings_created_by'
    ) then
        alter table event_settings
            add constraint fk_event_settings_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_event_settings_updated_by'
    ) then
        alter table event_settings
            add constraint fk_event_settings_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_gifts_created_by'
    ) then
        alter table gifts
            add constraint fk_gifts_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_gifts_updated_by'
    ) then
        alter table gifts
            add constraint fk_gifts_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_gallery_photos_created_by'
    ) then
        alter table gallery_photos
            add constraint fk_gallery_photos_created_by
            foreign key (created_by) references admin_users(id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'fk_gallery_photos_updated_by'
    ) then
        alter table gallery_photos
            add constraint fk_gallery_photos_updated_by
            foreign key (updated_by) references admin_users(id) on delete restrict;
    end if;
end $$;

-- 4) Consolidacao NOT NULL apos backfill
alter table admin_users alter column created_by set not null;
alter table admin_users alter column updated_by set not null;

alter table invitation_groups alter column created_by set not null;
alter table invitation_groups alter column updated_by set not null;

alter table group_members alter column created_by set not null;
alter table group_members alter column updated_by set not null;

alter table rsvp_responses alter column created_by set not null;
alter table rsvp_responses alter column updated_by set not null;

alter table rsvp_member_status alter column created_by set not null;
alter table rsvp_member_status alter column updated_by set not null;

alter table ceremony_guest_names alter column created_by set not null;
alter table ceremony_guest_names alter column updated_by set not null;

alter table event_settings alter column created_by set not null;
alter table event_settings alter column updated_by set not null;

alter table gifts alter column created_by set not null;
alter table gifts alter column updated_by set not null;

alter table gallery_photos alter column created_by set not null;
alter table gallery_photos alter column updated_by set not null;

-- 5) Indices de auditoria
create index if not exists idx_admin_users_created_by on admin_users(created_by);
create index if not exists idx_admin_users_updated_by on admin_users(updated_by);

create index if not exists idx_invitation_groups_created_by on invitation_groups(created_by);
create index if not exists idx_invitation_groups_updated_by on invitation_groups(updated_by);

create index if not exists idx_group_members_created_by on group_members(created_by);
create index if not exists idx_group_members_updated_by on group_members(updated_by);

create index if not exists idx_rsvp_responses_created_by on rsvp_responses(created_by);
create index if not exists idx_rsvp_responses_updated_by on rsvp_responses(updated_by);

create index if not exists idx_rsvp_member_status_created_by on rsvp_member_status(created_by);
create index if not exists idx_rsvp_member_status_updated_by on rsvp_member_status(updated_by);

create index if not exists idx_ceremony_guest_names_created_by on ceremony_guest_names(created_by);
create index if not exists idx_ceremony_guest_names_updated_by on ceremony_guest_names(updated_by);

create index if not exists idx_event_settings_created_by on event_settings(created_by);
create index if not exists idx_event_settings_updated_by on event_settings(updated_by);

create index if not exists idx_gifts_created_by on gifts(created_by);
create index if not exists idx_gifts_updated_by on gifts(updated_by);

create index if not exists idx_gallery_photos_created_by on gallery_photos(created_by);
create index if not exists idx_gallery_photos_updated_by on gallery_photos(updated_by);

-- =====================================================
-- FIM
