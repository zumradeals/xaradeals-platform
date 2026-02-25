
-- === PROMOTIONS: Add promo columns to products ===
ALTER TABLE public.products
ADD COLUMN original_price_fcfa INTEGER,
ADD COLUMN discount_percent INTEGER DEFAULT 0;

-- === REVIEWS TABLE ===
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, product_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can read reviews
CREATE POLICY "Public can read reviews"
ON public.reviews FOR SELECT
USING (true);

-- Users can insert own reviews (only if they have a delivered order)
CREATE POLICY "Users can insert own reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = reviews.order_id
    AND orders.user_id = auth.uid()
    AND orders.status = 'DELIVERED'
  )
);

-- Users can update own reviews
CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own reviews
CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- Admin can delete any review
CREATE POLICY "Admin can delete reviews"
ON public.reviews FOR DELETE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
