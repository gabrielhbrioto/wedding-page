-- 9. GALERIA FUTURA (PÓS EVENTO)
-- =====================================================

create table gallery_photos (
    id uuid primary key default gen_random_uuid(),

    titulo varchar(200),
    imagem_url text not null,

    publico boolean default true,

    ordem integer default 0,

    created_at timestamp default now()
);

-- =====================================================
