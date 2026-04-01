
CREATE TABLE public.featured_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id),
  UNIQUE(position)
);

ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read featured products"
  ON public.featured_products FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage featured products"
  ON public.featured_products FOR ALL
  USING (has_role(auth.uid(), 'ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));
