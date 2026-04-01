import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Key, Link, Package, AlertTriangle } from "lucide-react";

type Props = { productId: string };

type Template = {
  id?: string;
  link: string;
  code: string;
  credentials: string;
  instructions: string;
};

type ProductKey = {
  id: string;
  key_value: string;
  is_used: boolean;
  assigned_to_order: string | null;
};

const emptyTemplate: Template = { link: "", code: "", credentials: "", instructions: "" };

export default function ProductDeliveryManager({ productId }: Props) {
  const { toast } = useToast();
  const [deliveryType, setDeliveryType] = useState("MANUAL");
  const [instantDelivery, setInstantDelivery] = useState(false);
  const [template, setTemplate] = useState<Template>(emptyTemplate);
  const [keys, setKeys] = useState<ProductKey[]>([]);
  const [newKeys, setNewKeys] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [prodRes, tplRes, keysRes] = await Promise.all([
        supabase.from("products").select("delivery_type, instant_delivery").eq("id", productId).single(),
        supabase.from("product_delivery_templates").select("*").eq("product_id", productId).maybeSingle(),
        supabase.from("product_keys").select("*").eq("product_id", productId).order("created_at", { ascending: false }),
      ]);
      if (prodRes.data) {
        setDeliveryType((prodRes.data as any).delivery_type || "MANUAL");
        setInstantDelivery((prodRes.data as any).instant_delivery || false);
      }
      if (tplRes.data) {
        const d = tplRes.data as any;
        setTemplate({ id: d.id, link: d.link || "", code: d.code || "", credentials: d.credentials || "", instructions: d.instructions || "" });
      }
      if (keysRes.data) setKeys(keysRes.data as ProductKey[]);
    };
    load();
  }, [productId]);

  const availableKeys = keys.filter((k) => !k.is_used).length;
  const usedKeys = keys.filter((k) => k.is_used).length;

  const saveConfig = async () => {
    setSaving(true);
    // Update product
    await supabase.from("products").update({
      delivery_type: deliveryType,
      instant_delivery: instantDelivery,
    } as any).eq("id", productId);

    // Save template if TEMPLATE mode
    if (deliveryType === "TEMPLATE") {
      const tplData = {
        product_id: productId,
        link: template.link || null,
        code: template.code || null,
        credentials: template.credentials || null,
        instructions: template.instructions || null,
      };
      if (template.id) {
        await supabase.from("product_delivery_templates").update(tplData).eq("id", template.id);
      } else {
        const { data } = await supabase.from("product_delivery_templates").insert(tplData).select("id").single();
        if (data) setTemplate({ ...template, id: data.id });
      }
    }

    toast({ title: "Configuration sauvegardée ✅" });
    setSaving(false);
  };

  const addKeys = async () => {
    const lines = newKeys.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from("product_keys").insert(
      lines.map((key_value) => ({ product_id: productId, key_value }))
    );
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${lines.length} clé(s) ajoutée(s) ✅` });
      setNewKeys("");
      const { data } = await supabase.from("product_keys").select("*").eq("product_id", productId).order("created_at", { ascending: false });
      if (data) setKeys(data as ProductKey[]);
    }
    setSaving(false);
  };

  const deleteKey = async (id: string) => {
    await supabase.from("product_keys").delete().eq("id", id);
    setKeys(keys.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Mode selection */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Mode de livraison</Label>
          <Select value={deliveryType} onValueChange={setDeliveryType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MANUAL">🖐️ Manuel — L'admin livre manuellement chaque commande</SelectItem>
              <SelectItem value="TEMPLATE">📋 Template — Même contenu pour chaque client</SelectItem>
              <SelectItem value="KEY_STOCK">🔑 Stock de clés — Une clé unique par commande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={instantDelivery} onCheckedChange={setInstantDelivery} />
          <div>
            <Label className="cursor-pointer">⚡ Livraison instantanée</Label>
            <p className="text-xs text-muted-foreground">Livrer automatiquement après validation du paiement</p>
          </div>
        </div>
      </div>

      {/* Template editor */}
      {deliveryType === "TEMPLATE" && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Link className="h-4 w-4" /> Template de livraison</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>🔗 Lien d'accès</Label>
              <Input value={template.link} onChange={(e) => setTemplate({ ...template, link: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>🔑 Code / Clé</Label>
              <Input value={template.code} onChange={(e) => setTemplate({ ...template, code: e.target.value })} placeholder="Code réutilisable..." className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label>👤 Identifiants</Label>
              <Textarea value={template.credentials} onChange={(e) => setTemplate({ ...template, credentials: e.target.value })} rows={2} placeholder="Email: ...&#10;Mot de passe: ..." className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label>📝 Instructions</Label>
              <Textarea value={template.instructions} onChange={(e) => setTemplate({ ...template, instructions: e.target.value })} rows={3} placeholder="Étapes d'activation..." />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key stock manager */}
      {deliveryType === "KEY_STOCK" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="h-4 w-4" /> Stock de clés
              <Badge variant="outline" className="ml-auto">{availableKeys} dispo / {usedKeys} utilisées</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableKeys < 3 && availableKeys >= 0 && (
              <Alert variant="destructive" className="border-warning bg-warning/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {availableKeys === 0
                    ? "⚠️ Stock épuisé ! Ajoutez des clés pour continuer les ventes."
                    : `⚠️ Stock faible : seulement ${availableKeys} clé(s) disponible(s).`}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label>Ajouter des clés (une par ligne)</Label>
              <Textarea value={newKeys} onChange={(e) => setNewKeys(e.target.value)} rows={4} placeholder={"XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY\nZZZZ-ZZZZ-ZZZZ"} className="font-mono text-sm" />
              <Button size="sm" onClick={addKeys} disabled={saving || !newKeys.trim()} className="gap-1">
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>

            {keys.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground">Clés en stock</p>
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                    <code className="font-mono text-xs truncate flex-1">{k.key_value}</code>
                    <div className="flex items-center gap-2 ml-2">
                      {k.is_used ? (
                        <Badge className="bg-muted text-muted-foreground text-[10px]">Utilisée</Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success text-[10px]">Dispo</Badge>
                      )}
                      {!k.is_used && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteKey(k.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={saveConfig} disabled={saving} className="gap-2">
        <Package className="h-4 w-4" /> {saving ? "Sauvegarde..." : "Sauvegarder la config livraison"}
      </Button>
    </div>
  );
}
