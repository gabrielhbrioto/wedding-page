alter table event_settings
add column if not exists recepcao_local_nome varchar(200),
add column if not exists recepcao_endereco text,
add column if not exists recepcao_google_maps_url text;
