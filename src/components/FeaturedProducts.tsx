import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number; price_fcfa: number;
  image_url?: string | null; original_price_fcfa?: number | null;
  discount_percent?: number | null; instant_delivery?: boolean;
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: featured } = await supabase
        .from("featured_products")
        .select("product_id, position")
        .order("position");

      if (!featured || featured.length === 0) { setLoading(false); return; }

      const ids = featured.map((f: any) => f.product_id);
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .in("id", ids)
        .eq("status", "PUBLISHED");

      if (!prods || prods.length === 0) { setLoading(false); return; }

      // Fetch images
      const { data: imgs } = await supabase
        .from("product_images")
        .select("product_id, url")
        .in("product_id", prods.map(p => p.id))
        .order("position");

      const imgMap = new Map<string, string>();
      imgs?.forEach((img: any) => {
        if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
      });
      prods.forEach(p => { (p as any).image_url = imgMap.get(p.id) || null; });

      // Sort by featured position
      const posMap = new Map(featured.map((f: any) => [f.product_id, f.position]));
      prods.sort((a, b) => (posMap.get(a.id) || 0) - (posMap.get(b.id) || 0));

      setProducts(prods as Product[]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <ScrollReveal>
          <div className="mb-10 flex items-center justify-center gap-3">
            <Star className="h-6 w-6 text-primary fill-primary" />
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              Sélection en vedette
            </h2>
            <Star className="h-6 w-6 text-primary fill-primary" />
          </div>
        </ScrollReveal>
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ScrollReveal key={product.id} delay={i * 0.1}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
