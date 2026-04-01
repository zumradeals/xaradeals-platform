
-- Add delivery mode columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'MANUAL',
ADD COLUMN IF NOT EXISTS instant_delivery boolean NOT NULL DEFAULT false;

-- Product delivery templates (fixed content reused for every order)
CREATE TABLE public.product_delivery_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  link text,
  code text,
  credentials text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

ALTER TABLE public.product_delivery_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage delivery templates" ON public.product_delivery_templates FOR ALL USING (has_role(auth.uid(), 'ADMIN'::app_role)) WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));
CREATE POLICY "Public can read delivery templates" ON public.product_delivery_templates FOR SELECT USING (true);

CREATE TRIGGER update_delivery_templates_updated_at BEFORE UPDATE ON public.product_delivery_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product keys stock (unique codes assigned one per order)
CREATE TABLE public.product_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  key_value text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  assigned_to_order uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage product keys" ON public.product_keys FOR ALL USING (has_role(auth.uid(), 'ADMIN'::app_role)) WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE INDEX idx_product_keys_available ON public.product_keys(product_id, is_used) WHERE is_used = false;
