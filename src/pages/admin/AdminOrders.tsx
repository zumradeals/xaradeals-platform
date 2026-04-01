import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, Truck, Download } from "lucide-react";

const statusColors: Record<string, string> = {
  WAITING_PAYMENT_PROOF: "bg-warning/10 text-warning",
  UNDER_REVIEW: "bg-info/10 text-info",
  PAID: "bg-success/10 text-success",
  DELIVERED: "bg-success/10 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  PENDING: "bg-muted text-muted-foreground",
};

type Order = {
  id: string; user_id: string; status: string; total_fcfa: number; created_at: string;
  profiles?: { full_name: string | null; phone: string | null } | null;
};

type Payment = {
  id: string; order_id: string; user_id: string; method: string; amount_fcfa: number;
  proof_url: string | null; proof_status: string; review_note: string | null;
};

type OrderItem = {
  id: string; order_id: string; qty: number; unit_price_fcfa: number; line_total_fcfa: number;
  products?: { title: string } | null;
};

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment>>({});
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [rejectNote, setRejectNote] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionDialog, setActionDialog] = useState<"reject" | "deliver" | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData as Order[]);

    const { data: payData } = await supabase.from("payments").select("*");
    if (payData) {
      const map: Record<string, Payment> = {};
      (payData as Payment[]).forEach((p) => { map[p.order_id] = p; });
      setPayments(map);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openDetail = async (order: Order) => {
    setDetailOrder(order);
    const { data } = await supabase
      .from("order_items")
      .select("*, products(title)")
      .eq("order_id", order.id);
    if (data) setDetailItems(data as OrderItem[]);
  };

  const approvePayment = async () => {
    if (!detailOrder || !user) return;
    setSaving(true);
    const payment = payments[detailOrder.id];
    if (payment) {
      await supabase.from("payments").update({
        proof_status: "APPROVED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }).eq("id", payment.id);
    }
    await supabase.from("orders").update({ status: "PAID" }).eq("id", detailOrder.id);
    toast({ title: "Paiement approuvé" });
    setDetailOrder(null);
    fetchAll();
    setSaving(false);
  };

  const rejectPayment = async () => {
    if (!detailOrder || !user || !rejectNote.trim()) return;
    setSaving(true);
    const payment = payments[detailOrder.id];
    if (payment) {
      await supabase.from("payments").update({
        proof_status: "REJECTED",
        review_note: rejectNote,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }).eq("id", payment.id);
    }
    await supabase.from("orders").update({ status: "WAITING_PAYMENT_PROOF" }).eq("id", detailOrder.id);
    toast({ title: "Paiement rejeté" });
    setActionDialog(null);
    setRejectNote("");
    setDetailOrder(null);
    fetchAll();
    setSaving(false);
  };

  const markDelivered = async () => {
    if (!detailOrder) return;
    setSaving(true);
    // Upsert delivery
    const { data: existing } = await supabase
      .from("digital_deliveries")
      .select("id")
      .eq("order_id", detailOrder.id)
      .maybeSingle();

    const deliveryData = JSON.stringify({
      link: deliveryLink.trim() || undefined,
      code: deliveryCode.trim() || undefined,
      credentials: deliveryCredentials.trim() || undefined,
      instructions: deliveryInstructions.trim() || undefined,
    });

    if (existing) {
      await supabase.from("digital_deliveries").update({
        delivery_status: "SENT",
        delivery_note: deliveryData,
      }).eq("id", existing.id);
    } else {
      await supabase.from("digital_deliveries").insert({
        order_id: detailOrder.id,
        user_id: detailOrder.user_id,
        delivery_status: "SENT",
        delivery_note: deliveryData,
      });
    }
    await supabase.from("orders").update({ status: "DELIVERED" }).eq("id", detailOrder.id);
    toast({ title: "Commande livrée ✅" });
    setActionDialog(null);
    setDeliveryLink("");
    setDeliveryCode("");
    setDeliveryCredentials("");
    setDeliveryInstructions("");
    setDetailOrder(null);
    fetchAll();
    setSaving(false);
  };

  const getProofUrl = (payment: Payment) => {
    if (!payment.proof_url) return null;
    const { data } = supabase.storage.from("payment_proofs").getPublicUrl(payment.proof_url);
    return data?.publicUrl;
  };

  const filterOrders = (status: string) => orders.filter((o) => o.status === status);

  const OrderCard = ({ order }: { order: Order }) => {
    const payment = payments[order.id];
    const ref = `XD-${order.id.substring(0, 6).toUpperCase()}`;
    return (
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {ref} — {(order as any).profiles?.full_name || "Client"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("fr-FR")}
                {payment ? ` • ${payment.method}` : ""}
              </p>
              <p className="price-tag">{order.total_fcfa.toLocaleString("fr-FR")} FCFA</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColors[order.status] || "bg-muted"}>{order.status}</Badge>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => openDetail(order)}>
                <Eye className="h-3 w-3" /> Détail
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Commandes ({orders.length})</h2>

      <Tabs defaultValue="review">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="review">À vérifier ({filterOrders("UNDER_REVIEW").length})</TabsTrigger>
          <TabsTrigger value="waiting">En attente ({filterOrders("WAITING_PAYMENT_PROOF").length})</TabsTrigger>
          <TabsTrigger value="paid">Payées ({filterOrders("PAID").length})</TabsTrigger>
          <TabsTrigger value="delivered">Livrées ({filterOrders("DELIVERED").length})</TabsTrigger>
        </TabsList>

        {[
          { value: "review", status: "UNDER_REVIEW" },
          { value: "waiting", status: "WAITING_PAYMENT_PROOF" },
          { value: "paid", status: "PAID" },
          { value: "delivered", status: "DELIVERED" },
        ].map(({ value, status }) => (
          <TabsContent key={value} value={value}>
            {filterOrders(status).length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Aucune commande.</p>
            ) : (
              <div className="space-y-3">
                {filterOrders(status).map((o) => <OrderCard key={o.id} order={o} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detailOrder && !actionDialog} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Commande {detailOrder ? `XD-${detailOrder.id.substring(0, 6).toUpperCase()}` : ""}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p>Client : <strong>{(detailOrder as any).profiles?.full_name || "—"}</strong></p>
                <p>Tél : {(detailOrder as any).profiles?.phone || "—"}</p>
                <p>Date : {new Date(detailOrder.created_at).toLocaleDateString("fr-FR")}</p>
                <Badge className={statusColors[detailOrder.status] || "bg-muted"}>{detailOrder.status}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Articles</p>
                {detailItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{(item as any).products?.title || "Produit"} × {item.qty}</span>
                    <span>{item.line_total_fcfa.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                ))}
                <div className="border-t pt-1 flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span className="price-tag">{detailOrder.total_fcfa.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>

              {payments[detailOrder.id] && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Paiement — {payments[detailOrder.id].method}</p>
                  <p className="text-sm">Preuve : <Badge variant="outline">{payments[detailOrder.id].proof_status}</Badge></p>
                  {payments[detailOrder.id].proof_url && (
                    <a
                      href={getProofUrl(payments[detailOrder.id]) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary underline"
                    >
                      <Download className="h-3 w-3" /> Voir la preuve
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {detailOrder.status === "UNDER_REVIEW" && (
                  <>
                    <Button className="gap-1" onClick={approvePayment} disabled={saving}>
                      <CheckCircle className="h-4 w-4" /> Approuver
                    </Button>
                    <Button variant="destructive" className="gap-1" onClick={() => setActionDialog("reject")}>
                      <XCircle className="h-4 w-4" /> Rejeter
                    </Button>
                  </>
                )}
                {detailOrder.status === "PAID" && (
                  <Button className="gap-1" onClick={() => setActionDialog("deliver")}>
                    <Truck className="h-4 w-4" /> Marquer livrée
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={actionDialog === "reject"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeter le paiement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Raison du rejet (obligatoire)</Label>
            <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Preuve illisible, montant incorrect..." />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={rejectPayment} disabled={saving || !rejectNote.trim()}>Rejeter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliver dialog */}
      <Dialog open={actionDialog === "deliver"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Livraison numérique</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>🔗 Lien d'accès (URL du produit)</Label>
              <Input value={deliveryLink} onChange={(e) => setDeliveryLink(e.target.value)} placeholder="https://exemple.com/acces-produit" />
            </div>
            <div className="space-y-1.5">
              <Label>🔑 Code / Clé de licence</Label>
              <Input value={deliveryCode} onChange={(e) => setDeliveryCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>👤 Identifiants (email / mot de passe)</Label>
              <Textarea value={deliveryCredentials} onChange={(e) => setDeliveryCredentials(e.target.value)} rows={2} placeholder="Email: user@example.com&#10;Mot de passe: ..." className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>📝 Instructions supplémentaires</Label>
              <Textarea value={deliveryInstructions} onChange={(e) => setDeliveryInstructions(e.target.value)} rows={3} placeholder="Étapes d'activation, remarques..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button onClick={markDelivered} disabled={saving || (!deliveryLink && !deliveryCode && !deliveryCredentials && !deliveryInstructions)}>
              {saving ? "..." : "Confirmer livraison"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
