-- ============================================================
-- Rode este SQL no SQL Editor do seu Supabase (uma única vez).
-- ============================================================

-- 1) Enum de papéis
do $$ begin
  create type public.app_role as enum ('admin','client');
exception when duplicate_object then null; end $$;

-- 2) Função security definer para checar papel (evita recursão em RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- 3) Trigger: cria profile automaticamente no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Habilita RLS em todas as tabelas
alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.wishlist      enable row level security;
alter table public.reviews       enable row level security;
alter table public.coupons       enable row level security;
alter table public.settings      enable row level security;
alter table public.addresses     enable row level security;
alter table public.banners       enable row level security;
alter table public.notifications enable row level security;
alter table public.categories    enable row level security;

-- 5) GRANTs (Supabase não concede por padrão)
grant select on public.products, public.categories, public.banners, public.reviews, public.coupons, public.settings to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.user_roles, public.products, public.orders, public.order_items, public.wishlist, public.reviews, public.coupons, public.settings, public.addresses, public.banners, public.notifications, public.categories to authenticated;
grant all on all tables in schema public to service_role;

-- 6) Policies
-- profiles: cada um lê/atualiza o seu; admin lê todos
create policy "profiles_self_select" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles_self_update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_self_insert" on public.profiles for insert to authenticated with check (id = auth.uid());

-- user_roles: usuário vê os seus; admin gerencia
create policy "user_roles_self_select" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "user_roles_admin_all"   on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- products: leitura pública; escrita admin
create policy "products_read_all"   on public.products for select to anon, authenticated using (true);
create policy "products_admin_write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- categories / banners: leitura pública; admin escreve
create policy "categories_read"  on public.categories for select to anon, authenticated using (true);
create policy "categories_admin" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "banners_read"  on public.banners for select to anon, authenticated using (active);
create policy "banners_admin" on public.banners for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- coupons: leitura pública (para validar); escrita admin
create policy "coupons_read"  on public.coupons for select to anon, authenticated using (true);
create policy "coupons_admin" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- reviews: leitura pública (aprovadas); usuário cria/edita as suas; admin gerencia tudo
create policy "reviews_read"        on public.reviews for select to anon, authenticated using (approved or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "reviews_user_insert" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "reviews_user_update" on public.reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reviews_admin_all"   on public.reviews for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- settings: leitura pública; escrita admin
create policy "settings_read"  on public.settings for select to anon, authenticated using (true);
create policy "settings_admin" on public.settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- orders: usuário vê/cria os seus; admin gerencia todos
create policy "orders_user_select" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "orders_user_insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders_admin_update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- order_items: idem orders (via subquery)
create policy "order_items_select" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "order_items_insert" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- wishlist / addresses / notifications: dono apenas
create policy "wishlist_own" on public.wishlist for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses_own" on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_own_select" on public.notifications for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "notifications_admin_write" on public.notifications for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 7) Promova você como admin (rode com seu email):
--    insert into public.user_roles (user_id, role)
--    select id, 'admin' from auth.users where email = 'SEU_EMAIL@exemplo.com';
-- ============================================================