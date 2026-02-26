
-- Table for editable static page content (CMS léger)
CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  seo_title text,
  seo_description text,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site pages" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "Admin can update site pages" ON public.site_pages FOR UPDATE USING (has_role(auth.uid(), 'ADMIN'::app_role));
CREATE POLICY "Admin can insert site pages" ON public.site_pages FOR INSERT WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));
CREATE POLICY "Admin can delete site pages" ON public.site_pages FOR DELETE USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Seed the initial pages
INSERT INTO public.site_pages (slug, title, content) VALUES
  ('about', 'À propos', ''),
  ('faq', 'Questions fréquentes', ''),
  ('contact', 'Contact', ''),
  ('terms', 'Conditions générales', ''),
  ('privacy', 'Politique de confidentialité', '');

-- Trigger for updated_at
CREATE TRIGGER update_site_pages_updated_at
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
