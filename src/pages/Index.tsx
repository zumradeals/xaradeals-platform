import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Shield, Zap, Headphones } from "lucide-react";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number; price_fcfa: number;
  image_url?: string | null;
};

export default function Index() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("products").select("*").eq("status", "PUBLISHED").order("created_at", { ascending: false }).limit(6),
      ]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      
      const prods = (prodRes.data || []) as Product[];
      if (prods.length > 0) {
        const { data: imgs } = await supabase
          .from("product_images")
          .select("product_id, url")
          .in("product_id", prods.map((p) => p.id))
          .order("position")
        
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <HeroSection />

      {/* Trust badges */}
      <section className="border-b border-border bg-card py-6">
        <div className="container flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Livraison instantanée</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Licences officielles</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <span>Support 7j/7</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container">
          <h2 className="mb-6 text-2xl font-bold">Nos catégories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/c/${cat.slug}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-secondary/30 py-12">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Produits populaires</h2>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
