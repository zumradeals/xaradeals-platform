
-- Create payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  method text NOT NULL,
  amount_fcfa integer NOT NULL,
  proof_url text,
  proof_status text NOT NULL DEFAULT 'NONE',
  review_note text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Users can update own payment proof" ON public.payments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update all payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment_proofs', 'payment_proofs', false);

CREATE POLICY "Users can upload own payment proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own payment proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment_proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'ADMIN'::app_role)));

CREATE POLICY "Admin can view all payment proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment_proofs' AND has_role(auth.uid(), 'ADMIN'::app_role));
