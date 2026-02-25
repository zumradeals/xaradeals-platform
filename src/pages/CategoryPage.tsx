import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number; price_fcfa: number;
};

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterFamily, setFilterFamily] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: cat } = await supabase
        .from("categories")
        .select("id, name")
        .eq("slug", categorySlug)
        .single();

      if (cat) {
        setCategoryName(cat.name);
        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", cat.id)
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false });
        if (prods) setProducts(prods as Product[]);
      }
      setLoading(false);
    };
    fetch();
  }, [categorySlug]);

  const filtered = products.filter((p) => {
    if (filterBrand !== "all" && p.brand !== filterBrand) return false;
    if (filterFamily !== "all" && p.product_family !== filterFamily) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          <h1 className="mb-2 text-3xl font-bold">{categoryName || "Catégorie"}</h1>
          <p className="mb-6 text-muted-foreground">
            {filtered.length} produit{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
          </p>

          <div className="mb-6 flex flex-wrap gap-3">
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {["Autodesk", "Adobe", "LinkedIn", "Microsoft", "Lumion"].map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterFamily} onValueChange={setFilterFamily}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="SOFTWARE">Logiciel</SelectItem>
                <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                <SelectItem value="ACCOUNT">Compte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">Aucun produit trouvé.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
