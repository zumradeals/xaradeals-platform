import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number;
  price_fcfa: number; image_url?: string | null;
  original_price_fcfa?: number | null; discount_percent?: number | null;
};

interface SimilarProductsProps {
  productId: string;
  brand: string;
  categoryId?: string | null;
}

export default function SimilarProducts({ productId, brand, categoryId }: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchSimilar = async () => {
      // Fetch by category first, then by brand as fallback
      let query = supabase
        .from("products")
        .select("*")
        .eq("status", "PUBLISHED")
        .neq("id", productId)
        .limit(6);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      } else {
        query = query.eq("brand", brand);
      }

      const { data } = await query.order("created_at", { ascending: false });
      let results = (data || []) as Product[];

      // If category gave few results, supplement with same brand
      if (results.length < 3 && categoryId) {
        const { data: brandData } = await supabase
          .from("products")
          .select("*")
          .eq("status", "PUBLISHED")
          .eq("brand", brand)
          .neq("id", productId)
          .limit(6 - results.length);

        const existingIds = new Set(results.map((r) => r.id));
        const extra = ((brandData || []) as Product[]).filter((p) => !existingIds.has(p.id));
        results = [...results, ...extra].slice(0, 6);
      }

      // Fetch images for all results
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
    };

    fetchSimilar();
  }, [productId, brand, categoryId]);

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Produits similaires</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
