-- ============================================================================
-- Bertolleti Shop — Database schema (PostgreSQL / Supabase)
-- ============================================================================
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- Gera enums, tabelas, índices, triggers, funções, RLS e storage.
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- Enums --------------------------------------------------------------------
create type public.user_role as enum ('admin', 'client');
create type public.order_status as enum (
  'aguardando_pagamento', 'pago', 'preparando', 'enviado', 'entregue', 'cancelado'
);
create type public.payment_method as enum ('pix', 'card');

-- Profiles (1-1 com auth.users) -------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

-- Roles (separado do profile p/ evitar escalonamento) ---------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Settings (singleton) ----------------------------------------------------
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Bertolleti Shop',
  store_description text,
  pix_key text,
  pix_holder text,
  stripe_public_key text,
  stripe_secret_key text,  -- mova para Edge Function secrets em produção
  shipping_flat numeric(10,2) not null default 24.90,
  free_shipping_above numeric(10,2) not null default 299.00,
  whatsapp text,
  email text,
  updated_at timestamptz not null default now()
);

-- Products ----------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sku text unique,
  category text,
  images text[] not null default '{}',
  active boolean not null default true,
  featured boolean not null default false,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_active on public.products(active);
create index idx_products_category on public.products(category);
create index idx_products_featured on public.products(featured);

-- Orders ------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  user_email text not null,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status public.order_status not null default 'aguardando_pagamento',
  payment_method public.payment_method not null,
  pix_code text,
  stripe_session_id text,
  address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created on public.orders(created_at desc);

-- Order items -------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null,
  image text
);

create index idx_order_items_order on public.order_items(order_id);

-- Trigger: baixa de estoque automática ao inserir order_items -------------
create or replace function public.decrement_stock()
returns trigger language plpgsql as $$
begin
  update public.products
    set stock = stock - new.quantity
    where id = new.product_id;
  if (select stock from public.products where id = new.product_id) < 0 then
    raise exception 'Estoque insuficiente para o produto %', new.product_id;
  end if;
  return new;
end;
$$;

create trigger trg_decrement_stock
  after insert on public.order_items
  for each row execute function public.decrement_stock();

-- Trigger: updated_at ------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger trg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger trg_settings_updated before update on public.settings
  for each row execute function public.touch_updated_at();

-- Trigger: cria profile automaticamente ao signup -------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'client')
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- GRANTS ------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select on public.products to anon, authenticated;
grant all on public.products to service_role;

grant select on public.settings to anon, authenticated;
grant all on public.settings to service_role;

grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;

grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;

-- RLS ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;

-- profiles: usuário lê/edita o próprio; admin lê todos
create policy "profiles_self_select" on public.profiles for select
  to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles_self_update" on public.profiles for update
  to authenticated using (id = auth.uid());

-- user_roles: usuário lê os seus; somente admin gerencia
create policy "user_roles_self_select" on public.user_roles for select
  to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_all" on public.user_roles for all
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- products: público lê ativos; admin gerencia tudo
create policy "products_public_read" on public.products for select
  to anon, authenticated using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "products_admin_write" on public.products for all
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- orders: cliente vê só os seus; admin vê todos; cliente insere os seus
create policy "orders_self_select" on public.orders for select
  to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "orders_self_insert" on public.orders for insert
  to authenticated with check (user_id = auth.uid());
create policy "orders_admin_update" on public.orders for update
  to authenticated using (public.has_role(auth.uid(), 'admin'));

-- order_items: idem orders via join
create policy "order_items_select" on public.order_items for select
  to authenticated using (
    exists (select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  );
create policy "order_items_insert" on public.order_items for insert
  to authenticated with check (
    exists (select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid())
  );

-- settings: público lê (necessário p/ exibir chave PIX no checkout); admin escreve
create policy "settings_public_read" on public.settings for select
  to anon, authenticated using (true);
create policy "settings_admin_write" on public.settings for all
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- STORAGE -----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product_images_admin_write" on storage.objects for all
  to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

-- SEED --------------------------------------------------------------------
insert into public.settings (store_name, store_description, pix_key, pix_holder, shipping_flat, free_shipping_above)
values ('Bertolleti Shop', 'Curadoria premium em produtos para uma vida com mais design.',
        'contato@bertolleti.com', 'Bertolleti Comércio LTDA', 24.90, 299.00)
on conflict do nothing;
