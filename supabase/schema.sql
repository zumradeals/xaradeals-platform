-- ============================================================
-- XaraDeals Platform – Schéma complet pour déploiement HAMAYNI
-- Fidèle à la base Lovable Cloud au 2026-02-26
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('ADMIN', 'CLIENT');
  END IF;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role public.app_role NOT NULL DEFAULT 'CLIENT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  brand TEXT NOT NULL,
  product_family TEXT NOT NULL,
  delivery_mode TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL,
  original_price_fcfa INTEGER,
  discount_percent INTEGER DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  duration_months INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'DRAFT',
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_description_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pitch TEXT,
  what_you_get TEXT,
  use_case TEXT,
  delivery_steps TEXT,
  requirements TEXT,
  duration_and_renewal TEXT,
  support_policy TEXT,
  faq TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  total_fcfa INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price_fcfa INTEGER NOT NULL,
  line_total_fcfa INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  method TEXT NOT NULL,
  amount_fcfa INTEGER NOT NULL,
  proof_status TEXT NOT NULL DEFAULT 'NONE',
  proof_url TEXT,
  review_note TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, deal_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  delivery_status TEXT NOT NULL DEFAULT 'WAITING',
  delivery_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  seo_title TEXT,
  seo_description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON public.site_pages(slug);

-- ============================================================
-- FONCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_digital_deliveries_updated_at ON public.digital_deliveries;
CREATE TRIGGER update_digital_deliveries_updated_at
BEFORE UPDATE ON public.digital_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_description_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- categories
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update categories" ON public.categories FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete categories" ON public.categories FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- products
CREATE POLICY "Public can read published products" ON public.products FOR SELECT USING (status = 'PUBLISHED' OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- product_images
CREATE POLICY "Public can read product images" ON public.product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND (products.status = 'PUBLISHED' OR public.has_role(auth.uid(), 'ADMIN')))
);
CREATE POLICY "Admin can insert product images" ON public.product_images FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update product images" ON public.product_images FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete product images" ON public.product_images FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- product_description_blocks
CREATE POLICY "Public can read description blocks" ON public.product_description_blocks FOR SELECT USING (true);
CREATE POLICY "Admin can insert description blocks" ON public.product_description_blocks FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update description blocks" ON public.product_description_blocks FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete description blocks" ON public.product_description_blocks FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- orders
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

-- order_items
CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN')))
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- payments
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment proof" ON public.payments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update all payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

-- favorites
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- reviews
CREATE POLICY "Public can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.orders WHERE orders.id = reviews.order_id AND orders.user_id = auth.uid() AND orders.status = 'DELIVERED')
);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can delete reviews" ON public.reviews FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- digital_deliveries
CREATE POLICY "Users can read own deliveries" ON public.digital_deliveries FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can insert deliveries" ON public.digital_deliveries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update deliveries" ON public.digital_deliveries FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

-- site_pages
CREATE POLICY "Public can read site pages" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "Admin can insert site pages" ON public.site_pages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can update site pages" ON public.site_pages FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admin can delete site pages" ON public.site_pages FOR DELETE USING (public.has_role(auth.uid(), 'ADMIN'));

-- ============================================================
-- STORAGE BUCKETS (à créer dans le dashboard)
-- product_images : public
-- payment_proofs : privé
-- ============================================================

-- Désactiver temporairement le RLS pour le seed data
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_description_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED DATA – Catégories
-- ============================================================
INSERT INTO public.categories (id, name, slug, parent_id) VALUES
  ('f154f702-f07d-49aa-a4c9-7080232b7478', 'Abonnements digitaux', 'abonnements-digitaux', NULL),
  ('6be149ad-a129-414e-b8ed-5a22fd739f71', 'Outils IA', 'outils-ia', NULL),
  ('bf77f63e-7b50-4e4a-b6dc-50eefb173bdf', 'Licences numériques', 'licences-numeriques', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, slug, parent_id) VALUES
  ('aecb15fd-8ba8-4974-adbc-f569a3465ff2', 'Business & marketing', 'business-marketing', 'f154f702-f07d-49aa-a4c9-7080232b7478'),
  ('99c54239-911a-4cc2-b378-71a2a6d88dde', 'IA productivité', 'ia-productivite', '6be149ad-a129-414e-b8ed-5a22fd739f71'),
  ('86ec3f1b-cb57-48be-88ee-1cccbb0cdfa3', 'IA rédaction', 'ia-redaction', '6be149ad-a129-414e-b8ed-5a22fd739f71'),
  ('c69c1ae2-faa3-4dbb-8d0b-472f27db576f', 'Microsoft Office', 'microsoft-office', 'bf77f63e-7b50-4e4a-b6dc-50eefb173bdf'),
  ('d1af7f99-c295-4d60-834f-8047e6ad4740', 'Microsoft Project & Visio', 'microsoft-project-visio', 'bf77f63e-7b50-4e4a-b6dc-50eefb173bdf'),
  ('55cae599-7586-4314-bd0c-5795f79c8a93', 'Autres licences', 'autres-licences', 'bf77f63e-7b50-4e4a-b6dc-50eefb173bdf'),
  ('5eb60943-f6a1-4b21-989b-eef99a412845', 'AutoDesk', 'autodesk', 'bf77f63e-7b50-4e4a-b6dc-50eefb173bdf'),
  ('fda9767c-816f-435a-b6c3-389ee0891530', 'Adobe Creative Cloud', 'adobe-creative-cloud', 'bf77f63e-7b50-4e4a-b6dc-50eefb173bdf')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED DATA – Produits
-- ============================================================
INSERT INTO public.products (id, title, slug, brand, product_family, delivery_mode, price_fcfa, original_price_fcfa, discount_percent, duration_months, category_id, status, seo_title, seo_description) VALUES
  ('81af40c1-ef53-44c3-b607-31003c7a84e5', 'Notion Plus – Compte Premium 12 mois', 'notion-plus-compte-premium-12-mois', 'Notion', 'Notion Plus', 'DIGITAL', 12500, NULL, 0, 12, 'f154f702-f07d-49aa-a4c9-7080232b7478', 'PUBLISHED', 'Notion Plus – Compte Premium 12 mois | XaraDeals', 'Notion Plus compte premium prêt à l''emploi pour 12 mois. Stockage illimité et livraison immédiate via WhatsApp.'),
  ('140a97fd-f4d0-463e-812f-3c93fd23ec4b', 'n8n Cloud Starter – Licence 1 an', 'n8n-cloud-starter-licence-1-an', 'n8n', 'n8n Cloud', 'DIGITAL', 42500, NULL, 0, 12, '99c54239-911a-4cc2-b378-71a2a6d88dde', 'PUBLISHED', 'n8n Cloud Starter – Automatisation sans code (1 an)', 'n8n Cloud Starter licence 1 an. Automatisez vos workflows sans coder, 350+ connecteurs.'),
  ('0ece449e-4f3d-473a-9544-6dd8d3c3e088', 'Replit Core – Licence 1 an', 'replit-core-licence-1-an', 'Replit', 'Replit Core', 'DIGITAL', 37500, NULL, 0, 12, '99c54239-911a-4cc2-b378-71a2a6d88dde', 'PUBLISHED', 'Replit Core – Licence 1 an | IDE cloud avec IA | XaraDeals', 'Replit Core licence 1 an. IDE cloud avec IA Ghostwriter, 50+ langages.'),
  ('e91495f0-5565-4386-ab0b-7848ec5f4416', 'Bolt.new Pro – Licence 1 an', 'bolt-new-pro-licence-1-an', 'Bolt.new', 'Bolt.new Pro', 'DIGITAL', 32500, NULL, 0, 12, '99c54239-911a-4cc2-b378-71a2a6d88dde', 'PUBLISHED', 'Bolt.new Pro – Licence 1 an | Développement web avec IA', 'Bolt.new Pro licence 1 an. Codez, testez et déployez avec IA.'),
  ('483392f1-ce3a-4c30-8a63-48c2554fc796', 'Kaspersky Premium Security – 1 an', 'kaspersky-premium-security-1-an', 'Kaspersky', 'Kaspersky Premium', 'DIGITAL', 12500, NULL, 0, 12, '55cae599-7586-4314-bd0c-5795f79c8a93', 'PUBLISHED', 'Kaspersky Premium Security – Antivirus 1 an', 'Kaspersky Premium Security 1 an pour 1 appareil. Antivirus officiel, protection complète.'),
  ('1cd44054-9b6d-4d1d-afd9-28e605bb6591', 'Microsoft Office Professional Plus 2021', 'microsoft-office-pro-plus-2021', 'Microsoft', 'Office 2021', 'DIGITAL', 24500, NULL, 0, 0, 'c69c1ae2-faa3-4dbb-8d0b-472f27db576f', 'PUBLISHED', 'Microsoft Office Professional Plus 2021 – Licence à vie PC', 'Microsoft Office Professional Plus 2021 licence à vie pour PC. Suite bureautique complète.'),
  ('d09b5fc4-8773-419c-82e6-6a2c73c2b8ab', 'Microsoft Project 2019 Professional', 'microsoft-project-2019-pro', 'Microsoft', 'Project 2019', 'DIGITAL', 14500, NULL, 0, 0, 'd1af7f99-c295-4d60-834f-8047e6ad4740', 'PUBLISHED', 'Microsoft Project 2019 Professional – Licence à vie PC', 'Microsoft Project 2019 Professional licence à vie pour PC. Gestion de projet avancée.'),
  ('ba8191fd-e6c1-496e-bd8c-d92d37fadf69', 'Prime Video Premium – 12 mois', 'prime-video-premium-12-mois', 'Amazon', 'Prime Video', 'DIGITAL', 13000, NULL, 0, 12, 'f154f702-f07d-49aa-a4c9-7080232b7478', 'PUBLISHED', 'Prime Video Premium 12 mois – Compte privé | XaraDeals', 'Prime Video Premium 12 mois. Films et séries en illimité, HD/4K, compte privé.'),
  ('d0dcdcef-f7ba-42c5-b1af-861d47ac4f1f', 'LinkedIn Premium Business & Career – 3 mois', 'linkedin-premium-business-career-3-mois', 'LinkedIn', 'LinkedIn Premium', 'DIGITAL', 11500, NULL, 0, 3, 'aecb15fd-8ba8-4974-adbc-f569a3465ff2', 'PUBLISHED', 'LinkedIn Premium Business & Career (3 mois) | XaraDeals', 'LinkedIn Premium Business & Career valable 3 mois. Activation officielle.'),
  ('021a4313-a020-4736-a9e2-7564b4ffe365', 'Société UK Premium – Pack Bronze', 'societe-uk-premium-pack-bronze', 'XaraDeals', 'Société UK', 'SERVICE', 159000, NULL, 0, 0, 'aecb15fd-8ba8-4974-adbc-f569a3465ff2', 'PUBLISHED', 'Création Société UK – Entreprise clé en main | XaraDeals', 'Créez votre société UK clé en main. Pack Bronze à 159 000 FCFA.'),
  ('7b425708-257c-4f03-a9b0-bec5c7b2967e', 'ChatGPT Plus – Abonnement 1 mois', 'chatgpt-plus-abonnement-1-mois', 'OpenAI', 'ChatGPT Plus', 'DIGITAL', 7500, NULL, 0, 1, '86ec3f1b-cb57-48be-88ee-1cccbb0cdfa3', 'PUBLISHED', 'ChatGPT Plus 1 mois – Abonnement IA | XaraDeals', 'ChatGPT Plus abonnement 1 mois avec accès prioritaire et réponses rapides.'),
  ('d638f2c0-a7e5-41fd-ae8f-edfa57fc9243', 'Microsoft Office 365 Enterprise 2026', 'microsoft-office-365-enterprise-2026', 'Microsoft', 'Office 365 Enterprise', 'DIGITAL', 45000, NULL, 0, 12, 'c69c1ae2-faa3-4dbb-8d0b-472f27db576f', 'PUBLISHED', 'Microsoft Office 365 Enterprise 2026 – Licence entreprise', 'Microsoft Office 365 Enterprise 2026 pour entreprises. Sécurité avancée, collaboration Teams.'),
  ('ab41d0af-97f8-43b6-b420-71f909f62283', 'edX Premium – Compte privé 1 an', 'edx-premium-compte-prive-1-an', 'edX', 'edX Premium', 'DIGITAL', 16000, NULL, 0, 12, 'f154f702-f07d-49aa-a4c9-7080232b7478', 'PUBLISHED', 'edX Premium 1 an – Formations universitaires certifiantes', 'edX Premium avec accès aux cours universitaires et certificats officiels.'),
  ('26715272-fc13-49b8-ad83-4e8a6b4ddb24', 'Adobe Creative Cloud – Licence 1 an', 'adobe-creative-cloud-licence-1-an', 'Adobe', 'Adobe Creative Cloud', 'DIGITAL', 39000, NULL, 0, 12, 'fda9767c-816f-435a-b6c3-389ee0891530', 'PUBLISHED', 'Adobe Creative Cloud 1 an – Suite complète | XaraDeals', 'Adobe Creative Cloud – Suite complète avec Photoshop, Illustrator, Premiere Pro. Licence 1 an.'),
  ('8eb575a7-9ef6-45f6-a621-be7485a9b8f0', 'Microsoft Office 365 Compte Personnel – 1 an', 'microsoft-office-365-personnel-1-an', 'Microsoft', 'Office 365 Personnel', 'DIGITAL', 35000, NULL, 0, 12, 'c69c1ae2-faa3-4dbb-8d0b-472f27db576f', 'PUBLISHED', 'Microsoft Office 365 Compte Personnel 1 an (5 appareils)', 'Microsoft Office 365 Compte Personnel valable 1 an sur 5 appareils.'),
  ('b93b3859-0ece-409b-a1b4-87e0831fe1cd', 'Canva Pro – Abonnement Premium 1 an', 'canva-pro-abonnement-premium-1-an', 'Canva', 'Canva Pro', 'DIGITAL', 2900, NULL, 0, 12, 'bf77f63e-7b50-4e4a-b6dc-50eefb173bdf', 'PUBLISHED', 'Canva Pro 1 an (Compte privé) – Abonnement Premium | XaraDeals', 'Canva Pro Premium 1 an sur compte privé. Activation simple.'),
  ('60a6f10c-d7b0-4519-8a96-5231e85ba741', 'Microsoft Office 365 Professionnel – 1 an', 'microsoft-office-365-professionnel-1-an', 'Microsoft', 'Office 365 Pro', 'DIGITAL', 15000, NULL, 0, 12, 'c69c1ae2-faa3-4dbb-8d0b-472f27db576f', 'PUBLISHED', 'Microsoft Office 365 Professionnel 1 an (5 appareils)', 'Microsoft Office 365 Professionnel valable 1 an sur 5 appareils.'),
  ('6cfbce54-f2b9-4ea6-b1be-1fa82574380a', 'Lumion Edu Pro – Compte 1 an', 'lumion-edu-pro-compte-1-an', 'Lumion', 'SOFTWARE', 'MANUAL', 35000, 60000, 0, 12, '55cae599-7586-4314-bd0c-5795f79c8a93', 'PUBLISHED', 'Lumion Edu Pro 1 an – Visualisation architecturale 3D', 'Lumion Edu Pro pour architecture et design 3D. Licence 1 an, rendus photo-réalistes.'),
  ('bb530655-1fbd-4218-a2cb-7f3b28efe842', 'Autodesk All Apps – Licence 1 an', 'autodesk-all-apps-licence-1-an', 'Autodesk', 'Autodesk All Apps', 'DIGITAL', 25000, NULL, 0, 12, '5eb60943-f6a1-4b21-989b-eef99a412845', 'PUBLISHED', 'Autodesk All Apps – Licence 1 an | AutoCAD, Revit, 3ds Max', 'Autodesk All Apps – Suite complète avec AutoCAD, Revit, 3ds Max. Licence 1 an.'),
  ('6b59eee9-100c-4c40-bb8b-0be4391c13e1', 'Coursera Plus – Abonnement 12 mois', 'coursera-plus-abonnement-12-mois', 'Coursera', 'Coursera Plus', 'DIGITAL', 20000, NULL, 0, 12, 'f154f702-f07d-49aa-a4c9-7080232b7478', 'PUBLISHED', 'Coursera Plus 12 mois – Formations certifiantes | XaraDeals', 'Coursera Plus avec accès illimité aux cours en ligne et certificats officiels.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED DATA – Blocs de description produits
-- ============================================================
INSERT INTO public.product_description_blocks (id, product_id, pitch, use_case, what_you_get, delivery_steps, requirements, duration_and_renewal, support_policy, faq) VALUES

-- Société UK Premium – Pack Bronze
('6791d7c3-44c7-4423-89c9-bf58b866257f', '021a4313-a020-4736-a9e2-7564b4ffe365',
'Société UK Premium – Création d''entreprise au Royaume-Uni

Pack Bronze · Création complète · LTD officielle

La Société UK Premium – Pack Bronze est une solution complète pour créer votre entreprise au Royaume-Uni (LTD) de manière légale, rapide et sécurisée. XaraDeals prend en charge l''intégralité du processus.

✅ Création de société LTD officielle
✅ Enregistrement auprès de Companies House
✅ Adresse professionnelle au UK
✅ Accompagnement complet
✅ Documents officiels fournis',
'Ce service s''adresse à :

• Entrepreneurs et créateurs d''entreprise
• Freelancers souhaitant une structure légale
• E-commerçants (Shopify, Amazon, etc.)
• Consultants et prestataires de services
• Import-export et commerce international
• Startups en phase de structuration',
'Avec ce pack, vous bénéficiez de :

• Création officielle de votre société LTD au Royaume-Uni
• Enregistrement auprès de Companies House
• Certificat d''incorporation officiel
• Adresse professionnelle au UK
• Mémorandum & Articles of Association
• Accompagnement personnalisé tout au long du processus

⚠️ Ce que ce service n''est PAS :
• Ce n''est pas un simple conseil juridique
• Ce n''est pas une simulation ou un test
• Les services comptables ne sont pas inclus dans le Pack Bronze',
'Comment commander :

1. Contactez-nous via WhatsApp
2. Envoyez vos informations et documents
3. Paiement guidé (Wave / Orange Money / virement)
4. Nous créons votre société sous quelques jours ouvrés
5. Réception de vos documents officiels

✅ Accompagnement personnalisé de A à Z',
'Pièce d''identité valide (passeport ou carte d''identité). Informations personnelles pour l''enregistrement.',
'Service ponctuel – pas d''abonnement. La société est créée de manière permanente.',
'Accompagnement personnalisé tout au long du processus. Support dédié par WhatsApp.',
'Combien de temps prend la création ?
Quelques jours ouvrés après réception de tous les documents.

La société est-elle officielle ?
Oui, elle est enregistrée auprès de Companies House, l''organisme officiel britannique.

Dois-je me déplacer au Royaume-Uni ?
Non, tout se fait à distance.

La comptabilité est-elle incluse ?
Non, le Pack Bronze couvre la création uniquement. Des services comptables sont disponibles séparément.'),

-- Replit Core
('67c30ddb-f310-42c1-983b-114167aee4e8', '0ece449e-4f3d-473a-9544-6dd8d3c3e088',
'Replit Core – Environnement de développement cloud

Licence 12 mois · IDE complet · IA Ghostwriter

Replit Core transforme votre navigateur en un véritable environnement de développement professionnel. Codez, testez, collaborez et déployez vos projets grâce au cloud Replit et à l''IA Ghostwriter.

✅ IDE cloud professionnel complet
✅ IA Ghostwriter pour le code assisté
✅ Support de +50 langages de programmation
✅ Déploiement intégré
✅ Assistance humaine disponible',
'Cette licence s''adresse à :

• Développeurs web et software
• Freelances et agences
• Étudiants en programmation
• Formateurs et écoles de code
• Startups techniques',
'Avec cette offre, vous bénéficiez de :

• Une licence Replit Core valable 12 mois
• IDE cloud avec +50 langages supportés
• IA Ghostwriter pour l''autocomplétion et le débogage
• Ressources de calcul augmentées (CPU, RAM, stockage)
• Déploiement intégré
• Collaboration en temps réel

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas la version gratuite de Replit
• Ce n''est pas un hébergement web uniquement
• Ce n''est pas limité à un seul langage',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre accès Replit Core
4. Codez immédiatement

✅ Assistance humaine incluse',
'Navigateur web moderne. Connexion internet.',
'Valable 12 mois. Renouvellement via notre support.',
'Assistance disponible. Support WhatsApp.',
'L''IA Ghostwriter est-elle incluse ?
Oui, Ghostwriter est intégré à Replit Core.

Combien de langages sont supportés ?
Plus de 50 langages : Python, JavaScript, TypeScript, Go, Rust, etc.

Puis-je collaborer avec d''autres ?
Oui, Replit supporte la collaboration en temps réel.'),

-- n8n Cloud Starter
('f9173ce5-970b-4b89-87f1-1b46bc8b6afc', '140a97fd-f4d0-463e-812f-3c93fd23ec4b',
'n8n Cloud Starter – Automatisation sans code

Licence 12 mois · Workflows visuels · Connexions illimitées

n8n Cloud Starter est une plateforme d''automatisation visuelle qui vous permet de connecter vos applications et automatiser vos processus 24h/24, sans écrire une seule ligne de code.

✅ Plateforme d''automatisation puissante
✅ Interface visuelle drag & drop
✅ +400 intégrations disponibles
✅ Exécution automatique 24h/24
✅ Assistance humaine disponible',
'Cette licence s''adresse à :

• Freelances et agences digitales
• Startups et PME
• Équipes techniques et non techniques
• Entrepreneurs souhaitant automatiser leurs processus',
'Avec cette offre, vous bénéficiez de :

• Une licence n8n Cloud Starter valable 12 mois
• Création de workflows visuels illimités
• +400 connecteurs (Google, Slack, Notion, etc.)
• Exécutions automatiques programmées
• Historique des exécutions
• Support communautaire

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas un outil de développement classique
• Ce n''est pas limité à quelques automatisations
• Ce n''est pas la version self-hosted',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre accès n8n Cloud
4. Créez vos premières automatisations

✅ Assistance humaine incluse',
'Navigateur web. Aucune installation requise.',
'Valable 12 mois. Renouvellement possible.',
'Assistance disponible. Support WhatsApp.',
'Faut-il savoir coder ?
Non, n8n utilise une interface visuelle drag & drop.

Combien d''automatisations puis-je créer ?
Le plan Starter permet de créer plusieurs workflows selon les limites du plan.

Quelles applications puis-je connecter ?
Plus de 400 : Google Sheets, Slack, Notion, Gmail, etc.'),

-- Microsoft Office Pro Plus 2021
('2a8604f4-83d0-4bcb-b4fc-6df3e5511cc4', '1cd44054-9b6d-4d1d-afd9-28e605bb6591',
'Microsoft Office Professional Plus 2021 – Licence à vie

Licence perpétuelle · Sans abonnement · Installation unique

Microsoft Office Professional Plus 2021 est une suite bureautique complète avec licence à vie, sans abonnement mensuel. Accès permanent aux applications essentielles de Microsoft.

✅ Licence perpétuelle, pas d''abonnement
✅ Word, Excel, PowerPoint, Outlook, Access, Publisher
✅ Installation unique, utilisation illimitée
✅ Clé d''activation officielle
✅ Assistance humaine pour l''installation',
'Cette licence s''adresse à :

• PME et entreprises
• Professionnels indépendants et consultants
• Freelances
• Étudiants et enseignants
• Utilisateurs préférant un achat unique sans abonnement',
'Avec cette offre, vous bénéficiez de :

• Une clé de licence Office Professional Plus 2021 perpétuelle
• Word, Excel, PowerPoint, Outlook
• Access et Publisher (exclusifs à la version Pro Plus)
• Mises à jour de sécurité
• Aucun paiement récurrent

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas un abonnement (c''est un achat unique)
• Ce n''est pas une version d''essai
• Ce n''est pas compatible Mac (Windows uniquement)',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre clé d''activation
4. Installation accompagnée si besoin

✅ Assistance humaine incluse',
'PC sous Windows 10 ou Windows 11. Connexion internet pour l''activation initiale.',
'Licence perpétuelle – aucun renouvellement nécessaire. La licence reste valable indéfiniment.',
'Assistance humaine pour l''installation et l''activation. Support par WhatsApp.',
'Est-ce une licence à vie ?
Oui. Vous payez une seule fois et utilisez Office 2021 sans limitation de durée.

Est-ce compatible avec Mac ?
Non, cette version est réservée à Windows (10/11).

Quelles applications sont incluses ?
Word, Excel, PowerPoint, Outlook, Access et Publisher.

Comment se fait l''activation ?
Vous recevez une clé d''activation et nous vous accompagnons pour l''installation.'),

-- Adobe Creative Cloud
('8f45a500-0046-4bb6-935d-bba497ba532f', '26715272-fc13-49b8-ad83-4e8a6b4ddb24',
'Adobe Creative Cloud – Suite créative complète

Abonnement 12 mois · Toutes les applications · Usage professionnel

Accédez pendant 12 mois à l''intégralité de la suite Adobe Creative Cloud : Photoshop, Illustrator, Premiere Pro, After Effects, InDesign, Lightroom et plus de 20 applications professionnelles.

La référence mondiale pour la création graphique, la retouche photo, le montage vidéo et le design éditorial.

✅ Suite Adobe Creative Cloud complète et authentique
✅ Plus de 20 applications professionnelles
✅ Mises à jour incluses pendant 12 mois
✅ Stockage cloud Adobe inclus
✅ Assistance humaine disponible avant et après activation',
'Cet abonnement s''adresse à :

• Designers graphiques et directeurs artistiques
• Vidéastes et monteurs professionnels
• Photographes et retoucheurs
• Créateurs de contenu et influenceurs
• Agences de communication et studios créatifs
• Freelances dans le domaine créatif',
'Avec cette offre, vous bénéficiez de :

• Accès complet à toute la suite Creative Cloud pendant 12 mois
• Photoshop, Illustrator, Premiere Pro, After Effects, InDesign, Lightroom, XD, Audition, etc.
• Polices Adobe Fonts incluses
• Stockage cloud Adobe
• Mises à jour automatiques des applications
• Accès sur ordinateur (PC/Mac)

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas une version d''essai ou limitée
• Ce n''est pas une licence pour une seule application
• Ce n''est pas un crack ou une version piratée',
'Comment commander (simple et accompagné) :

1. Cliquez sur Commander via WhatsApp
2. Le message est automatiquement préparé
3. Nous vous guidons pour le paiement (Wave / Orange Money)
4. Activation rapide et accompagnée

Après validation du paiement :
• Réception de vos identifiants Adobe Creative Cloud
• Instructions d''installation détaillées
• Activation accompagnée si besoin

✅ Pas de formulaire compliqué
✅ Assistance humaine incluse',
'Ordinateur PC ou Mac compatible avec les applications Adobe. Connexion internet pour l''installation et l''activation. Espace disque suffisant selon les applications utilisées.',
'L''abonnement est valable 12 mois à compter de l''activation. Contactez notre support pour toute question de renouvellement.',
'Assistance humaine disponible avant et après activation. Support par WhatsApp pour l''installation et la prise en main.',
'Toutes les applications Adobe sont-elles incluses ?
Oui. Vous avez accès à l''intégralité de la suite Creative Cloud : Photoshop, Illustrator, Premiere Pro, After Effects, InDesign, Lightroom et toutes les autres.

Sur combien d''appareils puis-je utiliser la licence ?
La licence est utilisable selon les conditions standard Adobe (généralement 2 appareils).

Les mises à jour sont-elles incluses ?
Oui, vous bénéficiez des mises à jour pendant toute la durée de l''abonnement.

Comment se fait l''activation ?
Après paiement, nous vous transmettons les identifiants et vous accompagnons pour l''installation.'),

-- Kaspersky Premium Security
('b2863902-ac9e-4a7b-bf73-b52c6456a137', '483392f1-ce3a-4c30-8a63-48c2554fc796',
'Kaspersky Premium Security – Protection complète

Licence 12 mois · Antivirus avancé · Protection totale

Kaspersky Premium Security offre une protection complète contre toutes les menaces numériques : virus, malwares, ransomwares, phishing et attaques en ligne.

✅ Protection antivirus complète et avancée
✅ Anti-ransomware et anti-phishing
✅ VPN illimité inclus
✅ Gestionnaire de mots de passe
✅ Assistance humaine disponible',
'Cette licence s''adresse à :

• Utilisateurs particuliers soucieux de leur sécurité
• Familles souhaitant protéger leurs appareils
• Professionnels et télétravailleurs
• Utilisateurs de PC et smartphone',
'Avec cette offre, vous bénéficiez de :

• Une licence Kaspersky Premium Security valable 12 mois
• Protection antivirus et anti-malware en temps réel
• Protection anti-ransomware
• VPN illimité et sécurisé
• Gestionnaire de mots de passe
• Protection des paiements en ligne
• Contrôle parental

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas la version gratuite de Kaspersky
• Ce n''est pas une version d''essai
• Ce n''est pas limité à un seul appareil',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre clé d''activation
4. Installation accompagnée

✅ Assistance humaine incluse',
'Compatible Windows, Mac, Android et iOS.',
'Valable 12 mois. Renouvellement possible.',
'Assistance pour l''installation. Support WhatsApp.',
'Sur combien d''appareils puis-je l''installer ?
Le nombre d''appareils dépend de la licence choisie. Contactez-nous pour les détails.

Le VPN est-il vraiment illimité ?
Oui, avec la version Premium, le VPN est sans limite de données.

Est-ce compatible Mac et smartphone ?
Oui, compatible Windows, Mac, Android et iOS.'),

-- Microsoft Office 365 Professionnel
('00339488-47fd-4c59-bd1b-6a9b4081d548', '60a6f10c-d7b0-4519-8a96-5231e85ba741',
'Microsoft Office 365 Professionnel – Solution bureautique pro

Abonnement 12 mois · 5 appareils · Applications complètes

Microsoft Office 365 Professionnel pendant 12 mois avec toutes les applications bureautiques essentielles. Solution idéale pour la bureautique, les études et le travail quotidien.

✅ Suite Office 365 Professionnel complète
✅ Word, Excel, PowerPoint, Outlook, Teams
✅ Stockage cloud OneDrive inclus
✅ Utilisable sur 5 appareils
✅ Assistance humaine disponible',
'Cet abonnement s''adresse à :

• Étudiants et enseignants
• Professionnels indépendants et freelances
• PME et petites équipes
• Utilisateurs bureautiques classiques',
'Avec cette offre, vous bénéficiez de :

• Un abonnement Office 365 Professionnel valable 12 mois
• Word, Excel, PowerPoint, Outlook, OneNote, Teams
• Stockage cloud OneDrive
• Applications desktop, web et mobile
• Mises à jour automatiques
• Accès sur 5 appareils (PC, Mac, tablette, smartphone)

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas une licence à vie
• Ce n''est pas une version d''essai
• Ce n''est pas un compte partagé',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Le message est automatiquement préparé
3. Paiement guidé (Wave / Orange Money)
4. Activation rapide

Après validation :
• Réception de vos identifiants
• Installation accompagnée

✅ Assistance humaine incluse',
'Compatible PC (Windows 10/11), Mac, iOS et Android. Connexion internet requise pour l''activation.',
'Valable 12 mois à compter de l''activation. Renouvellement possible via notre support.',
'Assistance humaine disponible. Support par WhatsApp.',
'Quelle est la différence avec la version Personnel ?
La version Professionnel inclut davantage de fonctionnalités collaboratives comme Microsoft Teams.

Sur combien d''appareils puis-je l''utiliser ?
Jusqu''à 5 appareils simultanément.

Comment se fait l''activation ?
Après paiement, nous vous transmettons vos identifiants et vous accompagnons.'),

-- Coursera Plus
('4cf18f08-d5a6-4ce4-a464-79fb9bd07a63', '6b59eee9-100c-4c40-bb8b-0be4391c13e1',
'Coursera Plus – Formation en ligne certifiante

Abonnement 12 mois · Certificats à votre nom · Accès illimité

Accédez à Coursera Plus pendant 12 mois complets et profitez d''un accès illimité à des centaines de formations professionnelles dans les domaines les plus demandés du marché.

Avec cet abonnement, vous pouvez suivre des cours dispensés par des universités et entreprises de renommée mondiale et obtenir des certificats officiels à votre nom pour chaque formation validée.

✅ Abonnement Coursera Plus authentique
✅ Accès illimité pendant 12 mois
✅ Certificats officiels vérifiés à votre nom
✅ Apprentissage flexible, à votre rythme
✅ Assistance humaine disponible avant et après activation',
'Coursera Plus s''adresse à :

• Professionnels souhaitant se perfectionner
• Étudiants voulant renforcer leurs compétences
• Freelancers et créateurs de contenu
• Entreprises formant leurs équipes',
'Avec cette offre, vous bénéficiez de :

• Un abonnement Coursera Plus valable 12 mois
• Accès illimité à des centaines de cours
• Certificats vérifiés pour chaque cours terminé
• Accès aux spécialisations complètes et projets pratiques
• Formations dispensées par des universités internationales et des entreprises comme Google, Meta, IBM, etc.
• Accès sur ordinateur, tablette et smartphone

Domaines couverts notamment :
• Marketing digital
• Technologie & programmation
• Data science & intelligence artificielle
• Gestion de projet & management
• Comptabilité, finance & business

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas une version d''essai
• Ce n''est pas un cours unique
• Ce n''est pas un accès limité à quelques formations',
'Comment commander (simple et accompagné) :

1. Cliquez sur Commander via WhatsApp
2. Le message est automatiquement préparé
3. Nous vous guidons pour le paiement (Wave / Orange Money)
4. Activation rapide et accompagnée

Après validation du paiement :
• Réception de votre accès Coursera Plus
• Activation rapide
• Vous pouvez commencer à apprendre immédiatement

✅ Pas de formulaire compliqué
✅ Assistance humaine incluse',
'Aucun prérequis technique particulier. Les cours sont conçus pour être suivis à votre rythme, depuis n''importe quel appareil (ordinateur, tablette, smartphone). Une connexion internet est nécessaire.',
'L''abonnement est valable 12 mois à compter de l''activation. Contactez notre support pour toute question de renouvellement.',
'Assistance humaine disponible avant et après activation. Contactez-nous par WhatsApp pour toute question.',
'Les certificats sont-ils officiels et à mon nom ?
Oui. Chaque cours validé donne droit à un certificat officiel Coursera à votre nom.

Quelle est la durée de l''abonnement ?
L''abonnement est valable 12 mois à compter de l''activation.

Puis-je apprendre à mon rythme ?
Oui. Les cours sont accessibles 24h/24, selon votre disponibilité.

Comment se fait l''activation ?
Après paiement, nous vous transmettons les informations d''accès et vous accompagnons si besoin.'),

-- Lumion Edu Pro
('fd8b8236-fb3a-4fc4-a18c-3db83b2a2a9a', '6cfbce54-f2b9-4ea6-b1be-1fa82574380a',
'Lumion Edu Pro – Visualisation architecturale 3D

Compte 12 mois · Rendu réaliste · Édition éducation

Accédez pendant 12 mois à Lumion Edu Pro, l''un des logiciels de visualisation architecturale 3D les plus rapides et performants au monde. Rendus réalistes en temps réel.

✅ Compte Lumion Edu Pro authentique
✅ Rendu 3D photoréaliste en temps réel
✅ Bibliothèque de matériaux et objets 3D
✅ Compatible avec les fichiers AutoCAD, Revit, SketchUp
✅ Assistance humaine disponible',
'Ce logiciel s''adresse à :

• Architectes et urbanistes
• Étudiants en architecture et design
• Professionnels de la visualisation 3D
• Bureaux d''architecture
• Agences de design et immobilier',
'Avec cette offre, vous bénéficiez de :

• Un compte Lumion Edu Pro valable 12 mois
• Rendu photoréaliste en temps réel
• Bibliothèque de milliers de matériaux, objets et environnements
• Import direct depuis AutoCAD, Revit, SketchUp, ArchiCAD
• Vidéos et panoramas 360°
• Mises à jour incluses

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas une version d''essai limitée
• Ce n''est pas la version Community (gratuite)
• Ce n''est pas compatible Mac nativement',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de vos identifiants Lumion
4. Installation accompagnée

✅ Assistance humaine incluse',
'PC sous Windows 10/11 avec carte graphique dédiée (NVIDIA recommandée). 16 Go de RAM minimum recommandés.',
'Compte valable 12 mois. Renouvellement via notre support.',
'Assistance pour l''installation et la configuration. Support WhatsApp.',
'Lumion est-il compatible Mac ?
Lumion fonctionne nativement sous Windows. Sur Mac, il faut utiliser Boot Camp ou Parallels.

Puis-je importer mes fichiers AutoCAD/Revit ?
Oui, Lumion prend en charge l''import direct depuis AutoCAD, Revit, SketchUp et d''autres.

Quelle carte graphique est recommandée ?
Une carte NVIDIA dédiée avec au moins 6 Go de VRAM est recommandée.'),

-- ChatGPT Plus
('d397aefa-cba2-4581-9bd8-2f82fcf0d005', '7b425708-257c-4f03-a9b0-bec5c7b2967e',
'ChatGPT Plus – Intelligence artificielle avancée

Abonnement 1 mois · Compte privé · Accès prioritaire

Accédez à ChatGPT Plus pendant 1 mois complet avec un compte privé dédié. Profitez de performances améliorées, de réponses plus rapides et d''un accès prioritaire aux derniers modèles d''OpenAI.

✅ Compte ChatGPT Plus privé et authentique
✅ Accès prioritaire même en période de forte demande
✅ Modèles les plus performants (GPT-4, etc.)
✅ Réponses plus rapides et détaillées
✅ Assistance humaine disponible avant et après activation',
'Cet abonnement s''adresse à :

• Professionnels utilisant l''IA au quotidien
• Étudiants et chercheurs
• Créateurs de contenu et rédacteurs
• Développeurs et automatisateurs
• Entrepreneurs et consultants',
'Avec cette offre, vous bénéficiez de :

• Un compte ChatGPT Plus privé valable 1 mois
• Accès aux modèles les plus avancés d''OpenAI
• Réponses plus rapides et prioritaires
• Accès aux nouvelles fonctionnalités en avant-première
• Génération d''images avec DALL-E
• Analyse de documents et fichiers

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas la version gratuite de ChatGPT
• Ce n''est pas un accès API
• Ce n''est pas un compte partagé',
'Comment commander (simple et accompagné) :

1. Cliquez sur Commander via WhatsApp
2. Le message est automatiquement préparé
3. Nous vous guidons pour le paiement (Wave / Orange Money)
4. Activation rapide et accompagnée

Après validation du paiement :
• Réception de vos identifiants ChatGPT Plus
• Connexion immédiate possible
• Assistance si besoin

✅ Pas de formulaire compliqué
✅ Assistance humaine incluse',
'Aucun prérequis technique. Accessible depuis n''importe quel navigateur web ou l''application mobile ChatGPT. Connexion internet requise.',
'L''abonnement est valable 1 mois à compter de l''activation. Renouvelable chaque mois via notre support.',
'Assistance humaine disponible avant et après activation. Contactez-nous par WhatsApp pour toute question.',
'Est-ce un compte privé ?
Oui. Vous recevez un compte ChatGPT Plus privé, dédié uniquement à vous.

Puis-je utiliser GPT-4 ?
Oui. L''abonnement Plus donne accès aux modèles les plus avancés d''OpenAI.

Comment se fait l''activation ?
Après paiement, nous vous transmettons les identifiants de connexion immédiatement.

Puis-je renouveler après 1 mois ?
Oui, contactez notre support pour renouveler votre abonnement.'),

-- Notion Plus
('871aea9e-ed9f-4ba8-98fb-950cb3540346', '81af40c1-ef53-44c3-b607-31003c7a84e5',
'Notion Plus – Productivité et organisation premium

Compte Premium 12 mois · Prêt à l''emploi · Espace illimité

Notion Plus est la version premium de l''outil de productivité le plus utilisé par les entrepreneurs, équipes et créateurs. Compte déjà activé, prêt à être utilisé immédiatement.

✅ Compte Notion Plus authentique et activé
✅ Espace de travail illimité
✅ Historique des versions étendu
✅ Uploads de fichiers illimités
✅ Assistance humaine disponible',
'Cet abonnement s''adresse à :

• Entrepreneurs et dirigeants
• Freelances et consultants
• Étudiants et chercheurs
• Agences et équipes marketing
• Créateurs de contenu
• Toute personne souhaitant organiser projets, tâches et documents',
'Avec cette offre, vous bénéficiez de :

• Un compte Notion Plus valable 12 mois
• Pages et blocs illimités
• Uploads de fichiers sans limite de taille
• Historique des versions (30 jours)
• Invités illimités en lecture
• Intégrations avec Slack, Google Drive, etc.
• Templates premium

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas la version gratuite de Notion
• Ce n''est pas la version Team ou Enterprise
• Ce n''est pas une version d''essai',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre compte Notion Plus
4. Utilisation immédiate

✅ Assistance humaine incluse',
'Aucun prérequis. Accessible via navigateur web et applications desktop/mobile.',
'Valable 12 mois. Renouvellement possible via notre support.',
'Assistance disponible. Support WhatsApp.',
'Le compte est-il déjà activé ?
Oui, vous recevez un compte Notion Plus prêt à l''emploi.

Puis-je inviter des collaborateurs ?
Oui, vous pouvez inviter des personnes en lecture.

Notion est-il accessible sur mobile ?
Oui, via les applications iOS et Android.'),

-- Microsoft Office 365 Personnel
('4b906871-27eb-4936-a0d1-51c3d78b3ab0', '8eb575a7-9ef6-45f6-a621-be7485a9b8f0',
'Microsoft Office 365 Compte Personnel – Bureautique complète

Abonnement 12 mois · 5 appareils · Compte privé

Profitez de Microsoft Office 365 pendant 12 mois sur un compte personnel privé. Utilisable sur jusqu''à 5 appareils (PC, Mac, smartphone, tablette) avec toutes les applications essentielles.

✅ Compte Office 365 personnel authentique
✅ Word, Excel, PowerPoint, Outlook, OneDrive
✅ 1 To de stockage cloud OneDrive
✅ Utilisable sur 5 appareils simultanément
✅ Assistance humaine disponible avant et après activation',
'Cet abonnement s''adresse à :

• Étudiants et enseignants
• Professionnels et indépendants
• Petites entreprises et startups
• Travailleurs à distance
• Utilisateurs multi-appareils',
'Avec cette offre, vous bénéficiez de :

• Un compte Microsoft 365 Personnel valable 12 mois
• Word, Excel, PowerPoint, Outlook, OneNote
• 1 To de stockage cloud OneDrive
• Applications desktop et mobile
• Mises à jour automatiques de sécurité et fonctionnalités
• Accès sur PC, Mac, tablette et smartphone (5 appareils)

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas une version d''essai
• Ce n''est pas une licence à vie (abonnement 12 mois)
• Ce n''est pas un compte partagé',
'Comment commander (simple et accompagné) :

1. Cliquez sur Commander via WhatsApp
2. Le message est automatiquement préparé
3. Nous vous guidons pour le paiement (Wave / Orange Money)
4. Activation rapide et accompagnée

Après validation du paiement :
• Réception de vos identifiants Microsoft 365
• Instructions d''installation
• Activation accompagnée si besoin

✅ Pas de formulaire compliqué
✅ Assistance humaine incluse',
'Compatible PC (Windows 10/11), Mac, iOS et Android. Connexion internet pour l''installation initiale et la synchronisation.',
'L''abonnement est valable 12 mois à compter de l''activation. Contactez notre support pour le renouvellement.',
'Assistance humaine disponible avant et après activation. Support par WhatsApp.',
'Sur combien d''appareils puis-je installer Office ?
Jusqu''à 5 appareils simultanément (PC, Mac, tablette, smartphone).

Le stockage OneDrive est-il inclus ?
Oui, 1 To de stockage cloud OneDrive est inclus.

Les mises à jour sont-elles incluses ?
Oui, vous recevez toutes les mises à jour pendant 12 mois.

Comment se fait l''activation ?
Après paiement, nous vous transmettons vos identifiants et vous accompagnons.'),

-- edX Premium
('1ab6ede8-b032-4e1b-a373-81c178184dc1', 'ab41d0af-97f8-43b6-b420-71f909f62283',
'edX Premium – Formations universitaires de haut niveau

Compte privé 12 mois · Harvard, MIT, Stanford · Certificats

Accédez à edX Premium pendant 12 mois. Suivez des formations universitaires de haut niveau proposées par Harvard, MIT, Stanford et d''autres institutions prestigieuses.

✅ Compte edX Premium privé et authentique
✅ Cours de Harvard, MIT, Stanford et plus
✅ Certificats vérifiés disponibles
✅ Apprentissage à votre rythme
✅ Assistance humaine disponible',
'Ce compte s''adresse à :

• Étudiants souhaitant compléter leur formation
• Professionnels en reconversion
• Freelancers et entrepreneurs
• Porteurs de projets et chercheurs',
'Avec cette offre, vous bénéficiez de :

• Un compte edX Premium valable 12 mois
• Accès aux cours des meilleures universités mondiales
• Certificats vérifiés pour les cours complétés
• Programmes MicroMasters et Professional Certificate
• Apprentissage flexible à votre rythme

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas la version gratuite (audit)
• Ce n''est pas un diplôme universitaire
• Ce n''est pas limité à un seul cours',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre compte edX Premium
4. Commencez à apprendre immédiatement

✅ Assistance humaine incluse',
'Aucun prérequis. Accessible depuis navigateur web et applications mobiles.',
'Valable 12 mois. Renouvellement possible.',
'Assistance disponible. Support WhatsApp.',
'Les certificats sont-ils reconnus ?
Oui, les certificats vérifiés edX sont reconnus internationalement.

Quelles universités proposent des cours ?
Harvard, MIT, Stanford, Berkeley et des dizaines d''autres.

Puis-je apprendre à mon rythme ?
Oui, les cours sont accessibles 24h/24.'),

-- Canva Pro
('dbf8c0d2-8674-4bd3-ab37-490aa3e7eebe', 'b93b3859-0ece-409b-a1b4-87e0831fe1cd',
'Canva Pro – Design professionnel simplifié

Abonnement 12 mois · Compte privé · Templates premium

Canva Pro est l''outil de design le plus utilisé au monde pour créer rapidement des visuels professionnels. Abonnement 12 mois activé sur un compte privé dédié.

✅ Compte Canva Pro privé et authentique
✅ Accès à tous les templates et éléments premium
✅ Suppression d''arrière-plan, redimensionnement magique
✅ Kit de marque et planification de contenus
✅ Assistance humaine disponible',
'Cet abonnement s''adresse à :

• Entrepreneurs et dirigeants
• Community managers et social media managers
• Créateurs de contenu et influenceurs
• Étudiants
• PME, startups et freelances design & marketing',
'Avec cette offre, vous bénéficiez de :

• Un compte Canva Pro privé valable 12 mois
• Accès à plus de 100 millions de photos, vidéos et éléments premium
• Templates professionnels illimités
• Suppression d''arrière-plan en un clic
• Redimensionnement magique pour tous les formats
• Kit de marque (logos, couleurs, polices)
• Planificateur de contenus réseaux sociaux
• 1 To de stockage cloud

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas la version gratuite de Canva
• Ce n''est pas un compte partagé
• Ce n''est pas une version d''essai',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de vos identifiants Canva Pro
4. Connexion immédiate

✅ Assistance humaine incluse',
'Aucun prérequis. Accessible depuis n''importe quel navigateur web ou l''application mobile Canva.',
'Valable 12 mois à compter de l''activation. Renouvellement possible.',
'Assistance disponible avant et après activation. Support WhatsApp.',
'Est-ce un compte privé ?
Oui, un compte Canva Pro dédié uniquement à vous.

Puis-je utiliser Canva sur mobile ?
Oui, via l''application Canva sur iOS et Android.

Le stockage cloud est-il inclus ?
Oui, 1 To de stockage est inclus avec Canva Pro.'),

-- Prime Video Premium
('0b881e3c-0711-4981-acd9-a5c17c362d0b', 'ba8191fd-e6c1-496e-bd8c-d92d37fadf69',
'Prime Video Premium – Streaming illimité

Abonnement 12 mois · Compte privé · Films, séries et animés

Profitez d''un accès complet à Prime Video Premium pour regarder films, séries et animés en illimité, sans coupure et en haute qualité. Compte privé livré rapidement.

✅ Compte Prime Video privé et authentique
✅ Films, séries et contenus exclusifs Amazon
✅ Qualité HD et 4K disponible
✅ Compatible TV, mobile et ordinateur
✅ Assistance humaine disponible',
'Cet abonnement s''adresse à :

• Familles
• Couples
• Amateurs de films et séries
• Utilisateurs TV, mobile et ordinateur',
'Avec cette offre, vous bénéficiez de :

• Un compte Prime Video Premium valable 12 mois
• Accès illimité aux films, séries et contenus exclusifs
• Streaming en HD et 4K
• Téléchargement hors ligne
• Multi-écrans

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas une version d''essai
• Ce n''est pas un compte partagé entre plusieurs personnes
• Ce n''est pas Amazon Prime complet (uniquement Prime Video)',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de vos identifiants
4. Connexion immédiate

✅ Assistance humaine incluse',
'Connexion internet. Compatible Smart TV, smartphone, tablette, PC et Mac.',
'Valable 12 mois. Renouvellement via notre support.',
'Assistance disponible. Support WhatsApp.',
'La qualité 4K est-elle disponible ?
Oui, sur les appareils compatibles.

Puis-je télécharger des contenus hors ligne ?
Oui, via l''application mobile.

Est-ce un compte privé ?
Oui, un compte dédié uniquement à vous.'),

-- Autodesk All Apps
('da39f87f-3c91-49e4-9f3e-d8d52bca4b75', 'bb530655-1fbd-4218-a2cb-7f3b28efe842',
'Autodesk All Apps – Suite professionnelle complète

Licence 12 mois · Toutes les applications · BIM & CAO

Autodesk All Apps est la suite professionnelle de référence pour l''architecture, l''ingénierie, le BTP, le BIM et le design industriel. Accédez à l''ensemble des logiciels Autodesk pendant 12 mois.

✅ Suite Autodesk complète et authentique
✅ AutoCAD, Revit, 3ds Max, Maya, Inventor et plus
✅ Licence éducation ou professionnelle
✅ Mises à jour incluses
✅ Assistance humaine disponible',
'Cette suite s''adresse à :

• Architectes et urbanistes
• Ingénieurs et bureaux d''études
• Entreprises du BTP
• Designers et modélisateurs 3D
• Étudiants en architecture et ingénierie',
'Avec cette offre, vous bénéficiez de :

• Accès à toutes les applications Autodesk pendant 12 mois
• AutoCAD, Revit, 3ds Max, Maya, Inventor, Civil 3D, Fusion 360
• Rendu 3D et modélisation BIM
• Stockage cloud Autodesk
• Mises à jour automatiques

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas une version d''essai
• Ce n''est pas limité à une seule application
• Ce n''est pas un crack ou une version piratée',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de vos identifiants Autodesk
4. Installation accompagnée

✅ Assistance humaine incluse',
'PC sous Windows 10/11 (certaines applications sont aussi disponibles sur Mac). Configuration matérielle adaptée au rendu 3D recommandée.',
'Licence valable 12 mois à compter de l''activation. Renouvellement possible.',
'Assistance pour l''installation et l''activation. Support WhatsApp.',
'Toutes les applications Autodesk sont-elles incluses ?
Oui, vous avez accès à AutoCAD, Revit, 3ds Max, Maya, Inventor et toutes les autres.

Est-ce compatible Mac ?
Certaines applications comme AutoCAD sont disponibles sur Mac, d''autres sont Windows uniquement.

Les mises à jour sont-elles incluses ?
Oui, pendant toute la durée de la licence.'),

-- Microsoft Project 2019
('cf9c7fec-69b9-4c51-9fb1-7138b91aa9a1', 'd09b5fc4-8773-419c-82e6-6a2c73c2b8ab',
'Microsoft Project 2019 Professional – Gestion de projet avancée

Licence perpétuelle · Planification · Suivi des tâches

Microsoft Project 2019 Professional est un logiciel de gestion de projet complet. Planification, gestion des ressources, suivi des tâches et rapports détaillés.

✅ Licence perpétuelle, sans abonnement
✅ Planification avancée de projets
✅ Diagrammes de Gantt et suivi des tâches
✅ Gestion des ressources et budgets
✅ Rapports détaillés et tableaux de bord',
'Ce logiciel s''adresse à :

• Chefs de projet et directeurs de programme
• Entreprises PME et grandes organisations
• Professionnels du BTP et de l''ingénierie
• Consultants en gestion de projet
• Freelancers gérant des projets complexes',
'Avec cette offre, vous bénéficiez de :

• Une licence perpétuelle Microsoft Project 2019 Professional
• Planification de projets avec diagrammes de Gantt
• Gestion des ressources humaines et matérielles
• Suivi budgétaire et des coûts
• Rapports et tableaux de bord personnalisables
• Exportation vers Excel et PDF

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas un abonnement mensuel
• Ce n''est pas compatible Mac
• Ce n''est pas la version en ligne (application desktop)',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre clé d''activation
4. Installation accompagnée

✅ Assistance humaine incluse',
'PC sous Windows 10 ou Windows 11. Connexion internet pour l''activation.',
'Licence perpétuelle – aucun renouvellement nécessaire.',
'Assistance pour l''installation et la prise en main. Support WhatsApp.',
'Est-ce une licence à vie ?
Oui, vous payez une seule fois.

Est-ce compatible Mac ?
Non, Windows uniquement (10/11).

Puis-je exporter mes rapports ?
Oui, vers Excel, PDF et d''autres formats.'),

-- LinkedIn Premium
('c6c7f8e2-de27-4e80-b1f9-8105ac34a609', 'd0dcdcef-f7ba-42c5-b1af-861d47ac4f1f',
'LinkedIn Premium Business & Career – Visibilité professionnelle

Abonnement 3 mois · Activation sur votre compte · Lien redeem officiel

Boostez votre visibilité professionnelle avec LinkedIn Premium. Abonnement officiel activé via lien redeem directement sur votre propre compte LinkedIn.

✅ Abonnement LinkedIn Premium officiel
✅ Activé sur votre propre compte LinkedIn
✅ InMail, insights et formation LinkedIn Learning
✅ Visibilité accrue auprès des recruteurs
✅ Assistance humaine disponible',
'Cet abonnement s''adresse à :

• Entrepreneurs et dirigeants
• Freelances et consultants
• Chercheurs d''emploi
• Professionnels en évolution de carrière
• Commerciaux et recruteurs',
'Avec cette offre, vous bénéficiez de :

• Un abonnement LinkedIn Premium Business & Career de 3 mois
• Envoi d''InMails à des personnes hors de votre réseau
• Visibilité sur qui consulte votre profil
• Insights sur les entreprises et postes
• Accès à LinkedIn Learning (formations en ligne)
• Badge Premium visible sur votre profil

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas un nouveau compte LinkedIn
• Ce n''est pas un abonnement Recruiter ou Sales Navigator
• Ce n''est pas une version d''essai',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre lien redeem officiel
4. Activez sur votre compte LinkedIn en un clic

✅ Activation simple et rapide',
'Un compte LinkedIn existant. Le lien redeem est activé directement sur votre profil.',
'Valable 3 mois à compter de l''activation du lien redeem. Renouvellement possible.',
'Assistance pour l''activation du lien redeem. Support WhatsApp.',
'L''abonnement s''active-t-il sur mon propre compte ?
Oui, vous recevez un lien redeem à activer sur votre compte LinkedIn personnel.

LinkedIn Learning est-il inclus ?
Oui, vous avez accès aux formations LinkedIn Learning.

Puis-je renouveler après 3 mois ?
Oui, contactez notre support pour renouveler.'),

-- Microsoft Office 365 Enterprise
('bdb852d8-fa49-4866-8b27-584fa9118ff3', 'd638f2c0-a7e5-41fd-ae8f-edfa57fc9243',
'Microsoft Office 365 Enterprise 2026 – Solution entreprise

Abonnement 12 mois · Sécurité avancée · Administration centralisée

Microsoft Office 365 Enterprise 2026 est une solution bureautique professionnelle et sécurisée, conçue pour les entreprises et organisations ayant besoin d''outils fiables et administrables à grande échelle.

✅ Suite Office 365 Enterprise complète
✅ Sécurité et conformité renforcées
✅ Administration centralisée
✅ Microsoft Teams et outils collaboratifs
✅ Assistance humaine disponible',
'Cette solution s''adresse à :

• Grandes entreprises et organisations
• PME structurées
• Équipes en télétravail ou mode hybride
• Services IT et administrateurs système',
'Avec cette offre, vous bénéficiez de :

• Un abonnement Office 365 Enterprise valable 12 mois
• Word, Excel, PowerPoint, Outlook, Teams, SharePoint
• Fonctionnalités avancées de sécurité et conformité
• Administration centralisée des utilisateurs
• Stockage cloud entreprise
• Mises à jour automatiques

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas la version Personnel ou Famille
• Ce n''est pas une licence individuelle
• Ce n''est pas une version d''essai',
'Comment commander :

1. Contactez-nous via WhatsApp
2. Nous évaluons vos besoins entreprise
3. Paiement guidé (Wave / Orange Money / virement)
4. Déploiement et activation accompagnés

✅ Accompagnement entreprise personnalisé',
'Compatible PC et Mac. Infrastructure réseau adaptée pour le déploiement entreprise.',
'Valable 12 mois. Renouvellement via notre support.',
'Accompagnement dédié pour les entreprises. Support prioritaire par WhatsApp.',
'Quelle est la différence avec Office 365 Personnel ?
La version Enterprise offre des fonctionnalités avancées de sécurité, conformité et administration centralisée.

Combien d''utilisateurs peut-on ajouter ?
Contactez notre support pour un devis adapté à votre organisation.

Comment se fait le déploiement ?
Nous vous accompagnons pour le déploiement complet auprès de vos équipes.'),

-- Bolt.new Pro
('a2c165bd-d049-4bc3-895c-9c5cc7cd4eaa', 'e91495f0-5565-4386-ab0b-7848ec5f4416',
'Bolt.new Pro – Développement web avec IA

Licence 12 mois · IDE cloud · IA intégrée

Bolt.new Pro est une plateforme de développement web moderne qui permet de coder, tester et déployer des applications directement depuis votre navigateur, avec assistance IA intégrée.

✅ Plateforme de développement cloud complète
✅ IA intégrée pour le code assisté
✅ Déploiement en un clic
✅ Pas d''installation locale requise
✅ Assistance humaine disponible',
'Cette licence s''adresse à :

• Développeurs web et full-stack
• Freelances et agences
• Startups en phase de prototypage
• Étudiants en programmation
• Écoles de code et formations tech',
'Avec cette offre, vous bénéficiez de :

• Une licence Bolt.new Pro valable 12 mois
• IDE cloud complet dans votre navigateur
• Assistance IA pour le codage
• Déploiement automatique
• Templates et projets de démarrage
• Collaboration en temps réel

⚠️ Ce que ce produit n''est PAS :
• Ce n''est pas un simple éditeur de texte
• Ce n''est pas une version gratuite limitée
• Ce n''est pas un hébergement web uniquement',
'Comment commander :

1. Cliquez sur Commander via WhatsApp
2. Paiement guidé (Wave / Orange Money)
3. Réception de votre accès Bolt.new Pro
4. Commencez à coder immédiatement

✅ Assistance humaine incluse',
'Navigateur web moderne (Chrome, Firefox, Edge). Connexion internet.',
'Valable 12 mois. Renouvellement via notre support.',
'Assistance disponible. Support WhatsApp.',
'Faut-il installer quelque chose ?
Non, tout fonctionne dans votre navigateur.

L''IA est-elle incluse ?
Oui, l''assistance IA est intégrée à la plateforme.

Puis-je déployer mes projets ?
Oui, le déploiement en un clic est inclus.')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED DATA – Pages du site
-- ============================================================
INSERT INTO public.site_pages (id, title, slug) VALUES
  ('b59fbbbf-3ecd-446b-98db-38d3d9320867', 'À propos', 'about'),
  ('5b1fd530-e425-4b5a-8a7c-70546b0f66bd', 'Contact', 'contact'),
  ('3c82db30-e731-43ca-8de9-862e9c091944', 'Questions fréquentes', 'faq'),
  ('c02781d6-32c1-46c7-878d-92386eb2ac3a', 'Politique de confidentialité', 'privacy'),
  ('97a5b9b4-9e66-4b6a-bbf4-db7d0921b884', 'Conditions générales', 'terms')
ON CONFLICT (id) DO NOTHING;

-- Réactiver le RLS après le seed data
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_description_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
