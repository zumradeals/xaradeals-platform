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
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

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

-- ============================================================
-- STORAGE BUCKETS (à créer dans le dashboard)
-- product_images : public
-- payment_proofs : privé
-- ============================================================

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
