
-- Fix: Convert public SELECT policies from RESTRICTIVE to PERMISSIVE
-- so anonymous users can read data on external deployments

-- categories
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);

-- products
DROP POLICY IF EXISTS "Public can read published products" ON public.products;
CREATE POLICY "Public can read published products" ON public.products FOR SELECT
  USING ((status = 'PUBLISHED'::text) OR has_role(auth.uid(), 'ADMIN'::app_role));

-- product_description_blocks
DROP POLICY IF EXISTS "Public can read description blocks" ON public.product_description_blocks;
CREATE POLICY "Public can read description blocks" ON public.product_description_blocks FOR SELECT USING (true);

-- product_images
DROP POLICY IF EXISTS "Public can read product images" ON public.product_images;
CREATE POLICY "Public can read product images" ON public.product_images FOR SELECT
  USING ((EXISTS ( SELECT 1 FROM products WHERE products.id = product_images.product_id AND (products.status = 'PUBLISHED'::text OR has_role(auth.uid(), 'ADMIN'::app_role)))));

-- reviews
DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Public can read reviews" ON public.reviews FOR SELECT USING (true);

-- site_pages
DROP POLICY IF EXISTS "Public can read site pages" ON public.site_pages;
CREATE POLICY "Public can read site pages" ON public.site_pages FOR SELECT USING (true);
