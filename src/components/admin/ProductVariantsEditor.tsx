import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";

type Variant = {
  id?: string;
  label: string;
  duration_months: number;
  price_fcfa: number;
  position: number;
};

const PRESETS = [
  { label: "1 mois", duration_months: 1 },
  { label: "3 mois", duration_months: 3 },
  { label: "6 mois", duration_months: 6 },
  { label: "1 an", duration_months: 12 },
];

interface Props {
  productId: string | null;
  /** For use in add-product wizard before product is saved */
  localVariants?: Variant[];
  onLocalChange?: (variants: Variant[]) => void;
}

export default function ProductVariantsEditor({ productId, localVariants, onLocalChange }: Props) {
  const [variants, setVariants] = useState<Variant[]>(localVariants || []);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const isLocal = !productId;

  useEffect(() => {
    if (productId) {
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("position")
        .then(({ data }) => {
          if (data) setVariants(data as Variant[]);
        });
    }
  }, [productId]);

  useEffect(() => {
    if (localVariants) setVariants(localVariants);
  }, [localVariants]);

  const update = (idx: number, field: keyof Variant, value: any) => {
    const next = variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v));
    setVariants(next);
    if (isLocal && onLocalChange) onLocalChange(next);
  };

  const addVariant = () => {
    const next = [...variants, { label: "", duration_months: 1, price_fcfa: 0, position: variants.length }];
    setVariants(next);
    if (isLocal && onLocalChange) onLocalChange(next);
  };

  const addPreset = (preset: typeof PRESETS[number]) => {
    if (variants.some((v) => v.duration_months === preset.duration_months)) return;
    const next = [...variants, { label: preset.label, duration_months: preset.duration_months, price_fcfa: 0, position: variants.length }];
    setVariants(next);
    if (isLocal && onLocalChange) onLocalChange(next);
  };

  const removeVariant = async (idx: number) => {
    const v = variants[idx];
    if (v.id && productId) {
      await supabase.from("product_variants").delete().eq("id", v.id);
    }
    const next = variants.filter((_, i) => i !== idx).map((v, i) => ({ ...v, position: i }));
    setVariants(next);
    if (isLocal && onLocalChange) onLocalChange(next);
  };

  const saveAll = async () => {
    if (!productId) return;
    setSaving(true);
    try {
      // Delete removed ones
      const existingIds = variants.filter((v) => v.id).map((v) => v.id!);
      if (existingIds.length > 0) {
        await supabase.from("product_variants").delete().eq("product_id", productId).not("id", "in", `(${existingIds.join(",")})`);
      } else {
        await supabase.from("product_variants").delete().eq("product_id", productId);
      }

      for (const [i, v] of variants.entries()) {
        const data = { product_id: productId, label: v.label, duration_months: v.duration_months, price_fcfa: v.price_fcfa, position: i };
        if (v.id) {
          await supabase.from("product_variants").update(data).eq("id", v.id);
        } else {
          const { data: created } = await supabase.from("product_variants").insert(data).select("id").single();
          if (created) variants[i].id = created.id;
        }
      }
      toast({ title: "Variantes enregistrées !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Variantes de prix</Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </Button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.duration_months}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={variants.some((v) => v.duration_months === p.duration_months)}
            onClick={() => addPreset(p)}
          >
            + {p.label}
          </Button>
        ))}
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Aucune variante. Le prix principal du produit sera utilisé.
        </p>
      )}

      <div className="space-y-3">
        {variants.map((v, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border p-3 bg-card">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                value={v.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="Label (ex: 1 an)"
                className="text-sm"
              />
              <Input
                type="number"
                min={0}
                value={v.duration_months}
                onChange={(e) => update(i, "duration_months", parseInt(e.target.value) || 0)}
                placeholder="Mois"
                className="text-sm"
              />
              <Input
                type="number"
                min={0}
                value={v.price_fcfa || ""}
                onChange={(e) => update(i, "price_fcfa", parseInt(e.target.value) || 0)}
                placeholder="Prix FCFA"
                className="text-sm"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {!isLocal && variants.length > 0 && (
        <Button onClick={saveAll} disabled={saving} className="w-full">
          {saving ? "Enregistrement..." : "Enregistrer les variantes"}
        </Button>
      )}
    </div>
  );
}
