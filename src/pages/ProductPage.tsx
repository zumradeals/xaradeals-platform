import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Zap, Clock, ShoppingCart, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number;
  price_fcfa: number; seo_title: string | null; seo_description: string | null;
};

type Block = {
  pitch: string | null; use_case: string | null; what_you_get: string | null;
  requirements: string | null; duration_and_renewal: string | null;
  delivery_steps: string | null; support_policy: string | null; faq: string | null;
};

const blockLabels: Record<string, string> = {
  pitch: "Présentation",
  use_case: "À qui s'adresse ce produit",
  what_you_get: "Ce que vous recevez",
  requirements: "Prérequis",
  duration_and_renewal: "Durée & Renouvellement",
  delivery_steps: "Étapes de livraison",
  support_policy: "Support",
  faq: "Questions fréquentes",
};

export default function ProductPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("slug", productSlug)
        .single();

      if (prod) {
        setProduct(prod as Product);
        const { data: blocks } = await supabase
          .from("product_description_blocks")
          .select("*")
          .eq("product_id", prod.id)
          .single();
        if (blocks) setBlock(blocks as Block);
      }
      setLoading(false);
    };
    fetch();
  }, [productSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-4xl">
            <Skeleton className="mb-4 h-10 w-3/4" />
            <Skeleton className="mb-8 h-6 w-1/2" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Produit introuvable.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>{product.seo_title || product.title}</title>
        <meta name="description" content={product.seo_description || ""} />
      </Helmet>
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{product.brand}</Badge>
                <Badge variant="outline" className="capitalize">
                  {product.product_family.toLowerCase().replace("_", " ")}
                </Badge>
                {product.delivery_mode === "INSTANT" && (
                  <Badge variant="outline" className="gap-1 border-success/30 text-success">
                    <Zap className="h-3 w-3" /> Livraison instantanée
                  </Badge>
                )}
              </div>
              <h1 className="mb-2 text-3xl font-bold">{product.title}</h1>
              {product.duration_months > 0 && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Durée : {product.duration_months} mois
                </p>
              )}
            </div>

            <Card className="card-shadow">
              <CardContent className="p-6 text-center">
                <div className="price-tag mb-1 text-3xl">
                  {product.price_fcfa.toLocaleString("fr-FR")} FCFA
                </div>
                <p className="mb-4 text-xs text-muted-foreground">TTC</p>
                <Button className="w-full gap-2" size="lg">
                  <ShoppingCart className="h-4 w-4" /> Commander
                </Button>
                <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-success" /> Licence officielle garantie
                </div>
              </CardContent>
            </Card>
          </div>

          {block && (
            <div className="space-y-6">
              {(Object.keys(blockLabels) as Array<keyof Block>).map((key) => {
                const value = block[key];
                if (!value) return null;
                return (
                  <div key={key} className="animate-fade-in">
                    <h2 className="mb-2 text-lg font-semibold">{blockLabels[key]}</h2>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {value}
                    </div>
                    <Separator className="mt-6" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
