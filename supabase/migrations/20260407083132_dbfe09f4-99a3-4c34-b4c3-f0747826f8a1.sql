
-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'PERCENT', -- 'PERCENT' or 'FIXED'
  discount_value INTEGER NOT NULL DEFAULT 0,
  min_order_fcfa INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER, -- NULL = unlimited
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage coupons" ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Authenticated can read active coupons" ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Coupon usages table
CREATE TABLE public.coupon_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all coupon usages" ON public.coupon_usages FOR SELECT
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Users can read own coupon usages" ON public.coupon_usages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coupon usages" ON public.coupon_usages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on coupons
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
