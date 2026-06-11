-- =====================================================================
--  Bertolleti Shop — Atualização do banco (v4)
--  Rode no Supabase SQL Editor. Idempotente — pode rodar várias vezes.
--  Prepara o schema para: edição de produtos, perfil completo do cliente,
--  upload de logo, integração Stripe real, carrinhos abandonados,
--  prazo de entrega configurável e novos buckets de Storage.
-- =====================================================================

-- 1) PROFILES — campos novos pedidos pelo cliente ----------------------
--    (avatar_url já pode existir; usamos IF NOT EXISTS por segurança)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url   text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram    text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address      jsonb;
-- address esperado: { cep, street, number, complement, district, city, state, phone, name }

-- 2) PRODUCTS — vínculo com Stripe -------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stripe_product_id text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stripe_price_id   text;
CREATE INDEX IF NOT EXISTS idx_products_stripe_product ON public.products (stripe_product_id);

-- 3) ORDERS — novo status "carrinho_abandonado" + sessão Stripe -------
--    Adiciona valor ao enum order_status (se ainda não existir).
DO $$ BEGIN
  ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'carrinho_abandonado';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id    text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- 4) ABANDONED CARTS — tabela leve para mostrar no admin ---------------
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_abandoned_user ON public.abandoned_carts (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abandoned_self_rw"   ON public.abandoned_carts;
DROP POLICY IF EXISTS "abandoned_admin_all" ON public.abandoned_carts;

CREATE POLICY "abandoned_self_rw" ON public.abandoned_carts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "abandoned_admin_all" ON public.abandoned_carts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) SETTINGS — prazo de entrega + publishable key ---------------------
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_days int NOT NULL DEFAULT 14;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stripe_publishable_key text;
-- stripe_secret_key/stripe_public_key permanecem por compatibilidade,
-- mas em produção a SECRET deve ser Lovable Secret (variável de ambiente),
-- NUNCA armazenada no banco.

-- =====================================================================
-- 6) STORAGE — buckets públicos
--    Já existentes neste projeto: avatars, client-logos, product-images.
--    Novos: store-assets (logo/banner da loja), category-images.
-- =====================================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('store-assets',    'store-assets',    true),
  ('category-images', 'category-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Garante que avatars seja público (foto de perfil precisa renderizar)
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Políticas genéricas: leitura pública, escrita por dono ou admin
--   * store-assets: só admin escreve
--   * category-images: só admin escreve
--   * avatars: cada usuário escreve no próprio "<user_id>/..." e admin tudo

-- ---- store-assets ----
DROP POLICY IF EXISTS "store_assets_read"   ON storage.objects;
DROP POLICY IF EXISTS "store_assets_admin"  ON storage.objects;
CREATE POLICY "store_assets_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "store_assets_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'store-assets' AND public.has_role(auth.uid(), 'admin'));

-- ---- category-images ----
DROP POLICY IF EXISTS "category_images_read"  ON storage.objects;
DROP POLICY IF EXISTS "category_images_admin" ON storage.objects;
CREATE POLICY "category_images_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "category_images_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

-- ---- avatars (cada usuário no próprio prefixo) ----
DROP POLICY IF EXISTS "avatars_read"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_all"   ON storage.objects;

CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 7) TRIGGER: ao criar pedido, calcula data estimada de entrega
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_estimated_delivery()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  days int;
BEGIN
  IF NEW.estimated_delivery_at IS NULL THEN
    SELECT COALESCE(delivery_days, 14) INTO days FROM public.settings LIMIT 1;
    NEW.estimated_delivery_at := NEW.created_at + (days || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_set_delivery ON public.orders;
CREATE TRIGGER trg_orders_set_delivery
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_estimated_delivery();

-- =====================================================================
-- FIM v4
--   Próximos passos depois de rodar este SQL:
--   1) Configurar Lovable Secrets:
--        STRIPE_SECRET_KEY        (sk_test_... ou sk_live_...)
--        STRIPE_WEBHOOK_SECRET    (whsec_... gerado no Dashboard Stripe)
--        SUPABASE_SERVICE_ROLE_KEY
--   2) Cadastrar a Publishable Key no painel Admin → Configurações → Stripe
--   3) No Stripe Dashboard, criar Webhook apontando para a URL mostrada
--      no painel (/api/public/stripe-webhook) e selecionar eventos:
--        checkout.session.completed
--        checkout.session.expired
--        payment_intent.payment_failed
--   4) Promover um usuário a admin manualmente:
--        INSERT INTO public.user_roles (user_id, role)
--        VALUES ('<UUID_DO_USER>', 'admin');
-- =====================================================================
