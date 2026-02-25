import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number; price_fcfa: number;
  image_url?: string | null;
  original_price_fcfa?: number | null;
  discount_percent?: number | null;
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("status", "PUBLISHED")
        .or(`title.ilike.%${query}%,brand.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      const results = (prods || []) as Product[];
      if (results.length > 0) {
        const { data: imgs } = await supabase
          .from("product_images")
          .select("product_id, url")
          .in("product_id", results.map((p) => p.id))
          .order("position");

        const imgMap = new Map<string, string>();
        imgs?.forEach((img: any) => {
          if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
        });
        results.forEach((p) => { p.image_url = imgMap.get(p.id) || null; });
      }
      setProducts(results);
      setLoading(false);
    };
    fetchResults();
  }, [query]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          <h1 className="mb-2 text-3xl font-bold">Résultats de recherche</h1>
          <p className="mb-6 text-muted-foreground">
            {query ? `Recherche pour "${query}" — ${products.length} résultat${products.length !== 1 ? "s" : ""}` : "Aucun terme de recherche"}
          </p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground/20" />
              <p className="text-lg text-muted-foreground mb-4">
                {query ? "Aucun produit trouvé pour cette recherche." : "Saisissez un terme pour rechercher."}
              </p>
              <Link to="/" className="text-primary hover:underline">
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
