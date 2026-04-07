
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  price_fcfa INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product variants"
ON public.product_variants FOR SELECT
USING (true);

CREATE POLICY "Admin can manage product variants"
ON public.product_variants FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
