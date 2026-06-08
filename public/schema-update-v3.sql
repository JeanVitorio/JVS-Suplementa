-- =====================================================================
--  Bertolleti Shop — Atualização do banco (v3)
--  Rodar no Supabase SQL Editor (idempotente)
-- =====================================================================

-- 1) Garantir colunas que o app espera ---------------------------------
ALTER TABLE public.settings   ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- SKU pode ficar nulo para produtos sem código (o app gera quando preciso).
ALTER TABLE public.products ALTER COLUMN sku DROP NOT NULL;

-- 2) Índices úteis -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_active      ON public.products (active);
CREATE INDEX IF NOT EXISTS idx_wishlist_user        ON public.wishlist (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user          ON public.orders   (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_position  ON public.categories (position);

-- 3) Constraint anti-duplicidade no wishlist ---------------------------
DO $$ BEGIN
  ALTER TABLE public.wishlist
    ADD CONSTRAINT wishlist_user_product_unique UNIQUE (user_id, product_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) GRANTS (Data API) -------------------------------------------------
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

-- 5) RLS de categorias (leitura pública / escrita só admin) ------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read_all"   ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all"  ON public.categories;

CREATE POLICY "categories_read_all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 6) STORAGE — bucket público "product-images"
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Políticas do bucket
DROP POLICY IF EXISTS "product_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_write"   ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete"  ON storage.objects;

CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- FIM
-- =====================================================================