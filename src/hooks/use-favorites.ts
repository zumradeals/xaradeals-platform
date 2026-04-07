import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useFavorites() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("deal_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data || []).map((f: any) => f.deal_id));
    },
  });

  return query;
}

export function useFavoriteProducts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("deal_id")
        .eq("user_id", user!.id);
      if (!favs || favs.length === 0) return [];

      const ids = favs.map((f: any) => f.deal_id);
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", ids)
        .eq("status", "PUBLISHED");

      if (!products) return [];

      // Fetch images
      const { data: imgs } = await supabase
        .from("product_images")
        .select("product_id, url")
        .in("product_id", products.map((p) => p.id))
        .order("position");

      const imgMap = new Map<string, string>();
      imgs?.forEach((img: any) => {
        if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
      });

      return products.map((p) => ({ ...p, image_url: imgMap.get(p.id) || null }));
    },
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFav }: { productId: string; isFav: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("deal_id", productId);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, deal_id: productId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favorite-products"] });
    },
  });
}
