import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, Save, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Product = { id: string; title: string; brand: string; slug: string; image_url?: string | null };
type FeaturedSlot = { position: number; product_id: string | null };

export default function AdminFeatured() {
  const [products, setProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<FeaturedSlot[]>([
    { position: 1, product_id: null },
    { position: 2, product_id: null },
    { position: 3, product_id: null },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prodRes, featRes] = await Promise.all([
      supabase.from("products").select("id, title, brand, slug").eq("status", "PUBLISHED").order("title"),
      supabase.from("featured_products").select("*").order("position"),
    ]);

    const prods = (prodRes.data || []) as Product[];

    // Fetch images for products
    if (prods.length > 0) {
      const { data: imgs } = await supabase
        .from("product_images")
        .select("product_id, url")
        .in("product_id", prods.map(p => p.id))
        .order("position");
      const imgMap = new Map<string, string>();
      imgs?.forEach((img: any) => {
        if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
      });
      prods.forEach(p => { p.image_url = imgMap.get(p.id) || null; });
    }

    setProducts(prods);

    const featured = (featRes.data || []) as any[];
    const newSlots: FeaturedSlot[] = [1, 2, 3].map(pos => {
      const f = featured.find((x: any) => x.position === pos);
      return { position: pos, product_id: f?.product_id || null };
    });
    setSlots(newSlots);
  };

  const handleSlotChange = (position: number, productId: string | null) => {
    setSlots(prev => prev.map(s => s.position === position ? { ...s, product_id: productId } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing
      await supabase.from("featured_products").delete().gte("position", 0);

      // Insert selected ones
      const toInsert = slots
        .filter(s => s.product_id)
        .map(s => ({ position: s.position, product_id: s.product_id! }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("featured_products").insert(toInsert);
        if (error) throw error;
      }

      toast({ title: "Produits en vedette mis à jour !" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getProduct = (id: string | null) => products.find(p => p.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" /> Produits en vedette
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez jusqu'à 3 produits à mettre en avant sur la page d'accueil.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {slots.map(slot => {
          const product = getProduct(slot.product_id);
          return (
            <Card key={slot.position} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline">Position {slot.position}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product?.image_url ? (
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted">
                    <Package className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}

                <Select
                  value={slot.product_id || "none"}
                  onValueChange={v => handleSlotChange(slot.position, v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Aucun —</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.brand} — {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {slot.product_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => handleSlotChange(slot.position, null)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Retirer
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
