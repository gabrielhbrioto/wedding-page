alter table event_settings
    add column if not exists rsvp_deadline_offset_days integer;