import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, Ticket } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_fcfa: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "PERCENT",
    discount_value: 10,
    min_order_fcfa: 0,
    max_uses: "",
    expires_at: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCoupons(data as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_fcfa: form.min_order_fcfa,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon créé ✓" });
      setShowForm(false);
      setForm({ code: "", discount_type: "PERCENT", discount_value: 10, min_order_fcfa: 0, max_uses: "", expires_at: "" });
      fetchCoupons();
    }
    setSaving(false);
  };

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    fetchCoupons();
    toast({ title: "Coupon supprimé" });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copié !" });
  };

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Ticket className="h-5 w-5" /> Coupons ({coupons.length})
        </h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau coupon
        </Button>
      </div>

      <div className="space-y-3">
        {coupons.map((c) => {
          const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
          const isMaxed = c.max_uses !== null && c.used_count >= c.max_uses;
          return (
            <Card key={c.id} className="card-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-sm font-bold">{c.code}</code>
                    <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {!c.is_active && <Badge variant="secondary">Inactif</Badge>}
                    {isExpired && <Badge variant="destructive">Expiré</Badge>}
                    {isMaxed && <Badge variant="secondary">Limite atteinte</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {c.discount_type === "PERCENT" ? `-${c.discount_value}%` : `-${c.discount_value.toLocaleString("fr-FR")} FCFA`}
                    {c.min_order_fcfa > 0 && ` • Min ${c.min_order_fcfa.toLocaleString("fr-FR")} FCFA`}
                    {c.max_uses !== null && ` • ${c.used_count}/${c.max_uses} utilisations`}
                    {c.expires_at && ` • Expire le ${new Date(c.expires_at).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  <Button variant="ghost" size="icon" onClick={() => deleteCoupon(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {coupons.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun coupon créé</p>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PROMO10" className="uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Pourcentage (%)</SelectItem>
                    <SelectItem value="FIXED">Montant fixe (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valeur</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Commande min. (FCFA)</Label>
                <Input type="number" value={form.min_order_fcfa} onChange={(e) => setForm({ ...form, min_order_fcfa: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max utilisations</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Illimité" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date d'expiration</Label>
              <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <Button onClick={handleCreate} disabled={saving || !form.code.trim()} className="w-full">
              Créer le coupon
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
