-- 8. LISTA DE PRESENTES
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

    created_at timestamp default now()
);

-- =====================================================
