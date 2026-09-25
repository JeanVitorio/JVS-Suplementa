-- ============================================================================
-- JVS Modelo — MIGRAÇÃO 002 (novas telas / funcionalidades)
-- ----------------------------------------------------------------------------
-- Pré-requisito: schema.sql (migração 001) já aplicado.
-- Execute este arquivo no SQL Editor do Supabase.
-- Adiciona: wishlist, reviews, coupons, addresses, banners, notifications,
-- colunas de cupom/rastreio em orders, índices e RLS.
-- ============================================================================

-- 1) Colunas novas em orders --------------------------------------------------
alter table public.orders
  add column if not exists discount       numeric(10,2) not null default 0,
  add column if not exists coupon_code    text,
  add column if not exists tracking_code  text;

-- 2) Wishlist (favoritos) -----------------------------------------------------
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists idx_wishlist_user on public.wishlist(user_id);

grant select, insert, delete on public.wishlist to authenticated;
grant all on public.wishlist to service_role;

alter table public.wishlist enable row level security;
create policy "wishlist_self_all" on public.wishlist for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3) Reviews (avaliações de produto) ------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_user on public.reviews(user_id);

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;

alter table public.reviews enable row level security;
create policy "reviews_public_read" on public.reviews for select
  to anon, authenticated using (approved = true or public.has_role(auth.uid(), 'admin') or user_id = auth.uid());
create policy "reviews_self_insert" on public.reviews for insert
  to authenticated with check (user_id = auth.uid());
create policy "reviews_self_update" on public.reviews for update
  to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "reviews_self_delete" on public.reviews for delete
  to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- 4) Coupons (cupons promocionais) --------------------------------------------
create type public.coupon_type as enum ('percent', 'fixed');

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.coupon_type not null,
  value numeric(10,2) not null check (value >= 0),
  min_subtotal numeric(10,2) not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_coupons_updated before update on public.coupons
  for each row execute function public.touch_updated_at();

grant select on public.coupons to anon, authenticated;
grant all on public.coupons to service_role;

alter table public.coupons enable row level security;
create policy "coupons_public_read_active" on public.coupons for select
  to anon, authenticated using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "coupons_admin_write" on public.coupons for all
  to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 5) Endereços salvos pelo cliente --------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  name text not null,
  cep text not null,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state text not null,
  phone text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on public.addresses(user_id);

grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;

alter table public.addresses enable row level security;
create policy "addresses_self_all" on public.addresses for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 6) Banners (home page) ------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  position smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.banners to anon, authenticated;
grant all on public.banners to service_role;

alter table public.banners enable row level security;
create policy "banners_public_read" on public.banners for select
  to anon, authenticated using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "banners_admin_write" on public.banners for all
  to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 7) Notifications (cliente + admin) ------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, read);

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;
create policy "notifications_self_select" on public.notifications for select
  to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "notifications_self_update" on public.notifications for update
  to authenticated using (user_id = auth.uid());

-- 8) Categorias (tabela dedicada, opcional) -----------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  image_url text,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories_public_read" on public.categories for select
  to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories for all
  to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 9) Seed inicial -------------------------------------------------------------
insert into public.coupons (code, type, value, min_subtotal, active) values
  ('BEMVINDO10', 'percent', 10, 100, true),
  ('FRETE50',    'fixed',   50, 200, true)
on conflict (code) do nothing;

insert into public.categories (name, slug, position) values
  ('Tecnologia',  'tecnologia',  1),
  ('Casa',        'casa',        2),
  ('Moda',        'moda',        3),
  ('Acessórios',  'acessorios',  4),
  ('Escritório',  'escritorio',  5),
  ('Bem-estar',   'bem-estar',   6)
on conflict (slug) do nothing;
