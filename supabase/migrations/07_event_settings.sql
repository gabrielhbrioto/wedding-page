-- 7. CONFIGURAÇÕES DO EVENTO
-- =====================================================

create table event_settings (
    id uuid primary key default gen_random_uuid(),

    nome_casal varchar(200) not null,
    data_evento timestamp not null,

    local_nome varchar(200),
    endereco text,

    google_maps_url text,

    mensagem_home text,

    ativo boolean default true,

    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- =====================================================
