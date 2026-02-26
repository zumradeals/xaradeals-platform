import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Package } from "lucide-react";

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("newest");

  const { data: products, isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, brand, product_family, delivery_mode, duration_months, price_fcfa, og_image_url, original_price_fcfa, discount_percent, created_at")
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const brands = [...new Set(products?.map((p) => p.brand) ?? [])].sort();

  const filtered = (products ?? [])
    .filter((p) => brand === "all" || p.brand === brand)
    .filter((p) =>
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "price-asc") return a.price_fcfa - b.price_fcfa;
      if (sort === "price-desc") return b.price_fcfa - a.price_fcfa;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <>
      <Helmet>
        <title>Boutique – XaraDeals</title>
        <meta name="description" content="Découvrez tous nos produits numériques : abonnements, licences, outils IA et plus encore." />
        <link rel="canonical" href="https://xaradeals.com/boutique" />
      </Helmet>
      <Header />
      <main className="container pb-24 pt-8 md:pb-12">
        <h1 className="mb-6 text-3xl font-bold">Boutique</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-9"
            />
          </div>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Trier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="mb-3 h-12 w-12" />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} produit{filtered.length > 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    ...p,
                    image_url: p.og_image_url,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
