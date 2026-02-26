import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap, Shield, MessageCircle, ClipboardList,
  Search, CreditCard, CheckCircle,
  DollarSign, Lock, HeartHandshake,
} from "lucide-react";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number; price_fcfa: number;
  image_url?: string | null;
  original_price_fcfa?: number | null;
  discount_percent?: number | null;
};

const categoryShowcase = [
  { name: "Autodesk", slug: "autodesk", icon: "🏗️" },
  { name: "Adobe", slug: "adobe-creative-cloud", icon: "🎨" },
  { name: "Microsoft 365", slug: "microsoft-office", icon: "💼" },
  { name: "LinkedIn Premium", slug: "abonnements-digitaux", icon: "🔗" },
  { name: "Lumion", slug: "licences-numeriques", icon: "🏠" },
  { name: "Outils IA", slug: "outils-ia", icon: "🤖" },
];

const steps = [
  { icon: Search, title: "Choisissez votre licence", desc: "Parcourez notre catalogue et sélectionnez le logiciel adapté à vos besoins." },
  { icon: CreditCard, title: "Payez via Wave ou Orange", desc: "Réglez en toute sécurité avec les moyens de paiement locaux." },
  { icon: CheckCircle, title: "Recevez votre activation", desc: "Votre licence est activée et livrée rapidement après confirmation." },
];

const whyUs = [
  { icon: DollarSign, title: "Prix adaptés au marché local", desc: "Des tarifs compétitifs en FCFA, sans frais cachés." },
  { icon: Lock, title: "Processus simple et sécurisé", desc: "Paiement mobile sécurisé et livraison numérique fiable." },
  { icon: HeartHandshake, title: "Support humain réactif", desc: "Une équipe disponible 7j/7 via WhatsApp pour vous accompagner." },
];

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const prodRes = await supabase
        .from("products")
        .select("*")
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false })
        .limit(6);

      const prods = (prodRes.data || []) as Product[];
      if (prods.length > 0) {
        const { data: imgs } = await supabase
          .from("product_images")
          .select("product_id, url")
          .in("product_id", prods.map((p) => p.id))
          .order("position");

        const imgMap = new Map<string, string>();
        imgs?.forEach((img: any) => {
          if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
        });
        prods.forEach((p) => { p.image_url = imgMap.get(p.id) || null; });
      }
      setProducts(prods);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Trust Bar */}
      <ScrollReveal>
        <section className="border-b border-border bg-card py-8">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-medium">Activation rapide</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Paiement Mobile Money sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Support WhatsApp local</span>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span className="font-medium">Historique de commande sécurisé</span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Une plateforme conçue pour les professionnels et étudiants en Afrique de l'Ouest.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* 3. Categories Showcase */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
              Nos principales catégories
            </h2>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryShowcase.map((cat, i) => (
              <ScrollReveal key={cat.slug} delay={i * 0.08}>
                <Link
                  to={`/c/${cat.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 card-shadow hover:card-shadow-hover"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-sm text-muted-foreground">Voir les offres →</span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Products */}
      <section className="bg-secondary py-16 sm:py-20">
        <div className="container">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
              Produits populaires
            </h2>
          </ScrollReveal>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <ScrollReveal key={product.id} delay={i * 0.08}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. How it Works */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <ScrollReveal>
            <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
              Comment ça fonctionne
            </h2>
          </ScrollReveal>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Étape {i + 1}
                  </span>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Why XaraDeals */}
      <ScrollReveal>
        <section className="border-y border-border bg-card py-16 sm:py-20">
          <div className="container">
            <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
              Pourquoi choisir XaraDeals ?
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {whyUs.map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.15}>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 7. WhatsApp CTA */}
      <ScrollReveal>
        <section className="bg-accent py-16 sm:py-20">
          <div className="container max-w-2xl text-center">
            <MessageCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Besoin d'aide pour choisir ?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Notre équipe vous accompagne directement sur WhatsApp.
            </p>
            <Button asChild size="lg" className="gap-2 font-semibold">
              <a href="https://wa.me/2250718713781" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Discuter sur WhatsApp
              </a>
            </Button>
          </div>
        </section>
      </ScrollReveal>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
