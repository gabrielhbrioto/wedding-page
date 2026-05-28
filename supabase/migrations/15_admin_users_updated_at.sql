-- 15. ADMIN_USERS updated_at
-- =====================================================
-- Objetivo:
-- 1) Adicionar coluna updated_at em admin_users.
-- 2) Backfill historico usando created_at/now().
-- 3) Aplicar trigger de atualizacao automatica em updates.

alter table admin_users
    add column if not exists updated_at timestamp;

update admin_users
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table admin_users
    alter column updated_at set default now();

alter table admin_users
    alter column updated_at set not null;

do $$
begin
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'trg_admin_users_updated'
          and tgrelid = 'admin_users'::regclass
    ) then
        create trigger trg_admin_users_updated
        before update on admin_users
        for each row execute function set_updated_at();
    end if;
end $$;

-- =====================================================
-- FIM