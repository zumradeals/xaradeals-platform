
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'CLIENT');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role public.app_role NOT NULL DEFAULT 'CLIENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  )
$$;

-- Admin can read all profiles
CREATE POLICY "Admin can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update categories" ON public.categories FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete categories" ON public.categories FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('Autodesk','Adobe','LinkedIn','Microsoft','Lumion','Other')),
  product_family TEXT NOT NULL CHECK (product_family IN ('SOFTWARE','SUBSCRIPTION','ACCOUNT')),
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('INSTANT','MANUAL')),
  duration_months INT NOT NULL DEFAULT 0,
  price_fcfa INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published products" ON public.products FOR SELECT USING (status = 'PUBLISHED' OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- Product description blocks
CREATE TABLE public.product_description_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pitch TEXT,
  use_case TEXT,
  what_you_get TEXT,
  requirements TEXT,
  duration_and_renewal TEXT,
  delivery_steps TEXT,
  support_policy TEXT,
  faq TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_description_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read description blocks" ON public.product_description_blocks FOR SELECT USING (true);
CREATE POLICY "Admin can insert description blocks" ON public.product_description_blocks FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update description blocks" ON public.product_description_blocks FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete description blocks" ON public.product_description_blocks FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','PROCESSING','DELIVERED','CANCELLED','REFUNDED')),
  total_fcfa INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  qty INT NOT NULL DEFAULT 1,
  unit_price_fcfa INT NOT NULL,
  line_total_fcfa INT NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN')))
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Digital deliveries
CREATE TABLE public.digital_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  delivery_status TEXT NOT NULL DEFAULT 'WAITING' CHECK (delivery_status IN ('WAITING','SENT','FAILED')),
  delivery_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deliveries" ON public.digital_deliveries FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can insert deliveries" ON public.digital_deliveries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update deliveries" ON public.digital_deliveries FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_description_blocks_updated_at BEFORE UPDATE ON public.product_description_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_digital_deliveries_updated_at BEFORE UPDATE ON public.digital_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('Autodesk', 'autodesk'),
  ('Adobe', 'adobe'),
  ('LinkedIn Premium', 'linkedin-premium'),
  ('Microsoft Office 365', 'microsoft-office-365'),
  ('Lumion', 'lumion');

-- Seed products
INSERT INTO public.products (title, slug, brand, product_family, delivery_mode, duration_months, price_fcfa, status, category_id, seo_title, seo_description) VALUES
  ('AutoCAD 2024 - Licence 1 An', 'autocad-2024-licence-1-an', 'Autodesk', 'SOFTWARE', 'INSTANT', 12, 85000, 'PUBLISHED',
    (SELECT id FROM public.categories WHERE slug = 'autodesk'),
    'AutoCAD 2024 - Licence annuelle | XaraDeals',
    'Obtenez AutoCAD 2024 avec licence officielle 1 an. Livraison instantanée. Prix imbattable en FCFA.'),
  ('Adobe Creative Cloud - 1 An', 'adobe-creative-cloud-1-an', 'Adobe', 'SUBSCRIPTION', 'MANUAL', 12, 120000, 'PUBLISHED',
    (SELECT id FROM public.categories WHERE slug = 'adobe'),
    'Adobe Creative Cloud - Abonnement 1 an | XaraDeals',
    'Abonnement Adobe Creative Cloud complet pour 1 an. Photoshop, Illustrator, Premiere Pro et plus.'),
  ('LinkedIn Premium Business - 6 Mois', 'linkedin-premium-business-6-mois', 'LinkedIn', 'ACCOUNT', 'MANUAL', 6, 45000, 'PUBLISHED',
    (SELECT id FROM public.categories WHERE slug = 'linkedin-premium'),
    'LinkedIn Premium Business 6 mois | XaraDeals',
    'Boostez votre réseau professionnel avec LinkedIn Premium Business. Accès InMail, insights et plus.');

-- Seed description blocks for each product
INSERT INTO public.product_description_blocks (product_id, pitch, use_case, what_you_get, requirements, duration_and_renewal, delivery_steps, support_policy, faq) VALUES
  ((SELECT id FROM public.products WHERE slug = 'autocad-2024-licence-1-an'),
   'La référence mondiale du dessin technique et de la conception 2D/3D.',
   'Architectes, ingénieurs, designers industriels et étudiants en génie civil.',
   'Licence officielle AutoCAD 2024 valide 12 mois + accès aux mises à jour.',
   'Windows 10/11 64-bit, 8 Go RAM minimum, 10 Go espace disque.',
   'Licence valide 12 mois à compter de l''activation. Renouvellement disponible.',
   '1. Paiement confirmé → 2. Réception du lien + clé par email → 3. Installation → 4. Activation.',
   'Support par email sous 24h. Assistance à l''installation incluse.',
   'Q: Puis-je installer sur plusieurs PC ? R: Non, licence mono-poste.\nQ: Mise à jour incluse ? R: Oui, pendant la durée de la licence.'),
  ((SELECT id FROM public.products WHERE slug = 'adobe-creative-cloud-1-an'),
   'Toute la suite créative Adobe : Photoshop, Illustrator, Premiere Pro, After Effects et 20+ apps.',
   'Graphistes, vidéastes, photographes, community managers et agences créatives.',
   'Accès complet à toutes les applications Adobe Creative Cloud pendant 12 mois.',
   'Windows 10/11 ou macOS 12+, 16 Go RAM recommandés, connexion internet.',
   'Abonnement 12 mois. Renouvellement à tarif préférentiel.',
   '1. Paiement → 2. Création/liaison de votre compte Adobe → 3. Activation sous 24-48h.',
   'Support par email et WhatsApp. Aide à la configuration incluse.',
   'Q: Toutes les apps sont incluses ? R: Oui, accès complet.\nQ: Combien d''appareils ? R: 2 appareils simultanés.'),
  ((SELECT id FROM public.products WHERE slug = 'linkedin-premium-business-6-mois'),
   'Développez votre réseau professionnel et générez des opportunités business.',
   'Entrepreneurs, commerciaux, recruteurs et professionnels en recherche d''emploi.',
   'Compte LinkedIn Premium Business actif pendant 6 mois avec toutes les fonctionnalités.',
   'Compte LinkedIn existant requis.',
   '6 mois à compter de l''activation. Renouvellement possible.',
   '1. Paiement → 2. Envoi de vos identifiants LinkedIn → 3. Activation sous 24h.',
   'Support WhatsApp disponible 7j/7.',
   'Q: Mon compte est-il sécurisé ? R: Oui, nous utilisons des méthodes sûres.\nQ: Puis-je annuler ? R: Non, pas de remboursement après activation.');
