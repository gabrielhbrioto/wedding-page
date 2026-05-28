-- 10. TRIGGER updated_at
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

-- =====================================================
