-- 13. PERFIL DE ADMIN
-- =====================================================

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  name varchar(120),
  email varchar(150) unique not null,
  password_hash text not null,
  active boolean default true,
  created_at timestamp default now()
);

-- =====================================================

-- FIM