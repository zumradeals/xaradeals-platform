import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";

type Order = {
  id: string; user_id: string; status: string; total_fcfa: number; created_at: string;
  profiles?: { full_name: string | null; phone: string | null } | null;
};

type Delivery = {
  id: string; order_id: string; user_id: string; delivery_status: string; delivery_note: string | null;
};

const statuses = ["PENDING", "PAID", "PROCESSING", "DELIVERED", "CANCELLED", "REFUNDED"];
const deliveryStatuses = ["WAITING", "SENT", "FAILED"];

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  PAID: "bg-info/10 text-info",
  PROCESSING: "bg-info/10 text-info",
  DELIVERED: "bg-success/10 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery>>({});
  const [deliveryDialog, setDeliveryDialog] = useState<Order | null>(null);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("WAITING");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData as Order[]);

    const { data: delData } = await supabase.from("digital_deliveries").select("*");
    if (delData) {
      const map: Record<string, Delivery> = {};
      (delData as Delivery[]).forEach((d) => { map[d.order_id] = d; });
      setDeliveries(map);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Statut mis à jour" }); fetchAll(); }
  };

  const openDeliveryDialog = (order: Order) => {
    const existing = deliveries[order.id];
    setDeliveryNote(existing?.delivery_note || "");
    setDeliveryStatus(existing?.delivery_status || "WAITING");
    setDeliveryDialog(order);
  };

  const saveDelivery = async () => {
    if (!deliveryDialog) return;
    setSaving(true);
    const existing = deliveries[deliveryDialog.id];
    try {
      if (existing) {
        await supabase.from("digital_deliveries")
          .update({ delivery_note: deliveryNote, delivery_status: deliveryStatus })
          .eq("id", existing.id);
      } else {
        await supabase.from("digital_deliveries").insert({
          order_id: deliveryDialog.id,
          user_id: deliveryDialog.user_id,
          delivery_note: deliveryNote,
          delivery_status: deliveryStatus,
        });
      }
      toast({ title: "Livraison mise à jour" });
      setDeliveryDialog(null);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Commandes ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Aucune commande.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const delivery = deliveries[order.id];
            return (
              <Card key={order.id} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {(order as any).profiles?.full_name || "Client"} — {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      <p className="price-tag">{order.total_fcfa.toLocaleString("fr-FR")} FCFA</p>
                      {delivery && (
                        <p className="text-xs text-muted-foreground">
                          📦 {delivery.delivery_status} {delivery.delivery_note ? `— ${delivery.delivery_note.substring(0, 50)}...` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={() => openDeliveryDialog(order)}>
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!deliveryDialog} onOpenChange={() => setDeliveryDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Livraison numérique</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {deliveryStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Note de livraison (clé, instructions...)</Label>
              <Textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} rows={4} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeliveryDialog(null)}>Annuler</Button>
            <Button onClick={saveDelivery} disabled={saving}>{saving ? "..." : "Enregistrer"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
