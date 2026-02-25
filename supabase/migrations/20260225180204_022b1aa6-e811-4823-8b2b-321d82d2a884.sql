
-- Create product_images table
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Public can read images of published products
CREATE POLICY "Public can read product images"
ON public.product_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_images.product_id
    AND (products.status = 'PUBLISHED' OR has_role(auth.uid(), 'ADMIN'::app_role))
  )
);

-- Admin can insert images
CREATE POLICY "Admin can insert product images"
ON public.product_images FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- Admin can update images
CREATE POLICY "Admin can update product images"
ON public.product_images FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Admin can delete images
CREATE POLICY "Admin can delete product images"
ON public.product_images FOR DELETE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Create index
CREATE INDEX idx_product_images_product ON public.product_images(product_id, position);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product_images', 'product_images', true);

-- Storage policies
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product_images');

CREATE POLICY "Admin can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product_images' AND has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admin can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product_images' AND has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admin can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product_images' AND has_role(auth.uid(), 'ADMIN'::app_role));
