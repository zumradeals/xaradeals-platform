import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, Clock, AlertCircle, Truck } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  WAITING_PAYMENT_PROOF: { label: "En attente de preuve", color: "bg-warning/10 text-warning", icon: Clock },
  UNDER_REVIEW: { label: "En cours de vérification", color: "bg-info/10 text-info", icon: AlertCircle },
  PAID: { label: "Payée", color: "bg-success/10 text-success", icon: CheckCircle },
  DELIVERED: { label: "Livrée", color: "bg-success/10 text-success", icon: Truck },
  CANCELLED: { label: "Annulée", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
  PENDING: { label: "En attente", color: "bg-muted text-muted-foreground", icon: Clock },
};

const statusTimeline = ["WAITING_PAYMENT_PROOF", "UNDER_REVIEW", "PAID", "DELIVERED"];

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user]);

  useEffect(() => {
    if (!user || !orderId) return;
    const fetchData = async () => {
      setLoading(true);
      const [orderRes, paymentRes, itemsRes, deliveryRes] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("payments").select("*").eq("order_id", orderId).single(),
        supabase.from("order_items").select("*, products(title)").eq("order_id", orderId),
        supabase.from("digital_deliveries").select("*").eq("order_id", orderId).maybeSingle(),
      ]);
      if (orderRes.data) setOrder(orderRes.data);
      if (paymentRes.data) setPayment(paymentRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
      if (deliveryRes.data) setDelivery(deliveryRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user, orderId]);

  const orderRef = order ? `XD-${order.id.substring(0, 6).toUpperCase()}` : "";

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !payment) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${payment.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("payment_proofs")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      toast({ title: "Erreur", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("payment_proofs").getPublicUrl(path);

    // Update payment
    await supabase
      .from("payments")
      .update({ proof_url: path, proof_status: "SUBMITTED" })
      .eq("id", payment.id);

    // Update order status
    await supabase
      .from("orders")
      .update({ status: "UNDER_REVIEW" })
      .eq("id", order.id);

    toast({ title: "Preuve envoyée !" });
    // Refresh
    const { data: updPay } = await supabase.from("payments").select("*").eq("id", payment.id).single();
    const { data: updOrd } = await supabase.from("orders").select("*").eq("id", order.id).single();
    if (updPay) setPayment(updPay);
    if (updOrd) setOrder(updOrd);
    setUploading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8"><div className="container max-w-2xl"><Skeleton className="h-64" /></div></main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">Commande introuvable.</p></main>
        <Footer />
      </div>
    );
  }

  const currentStatusIdx = statusTimeline.indexOf(order.status);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl space-y-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/account")}>← Mon compte</Button>
            <h1 className="mt-2 text-2xl font-bold">Commande {orderRef}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Status timeline */}
          <div className="flex items-center gap-1">
            {statusTimeline.map((s, i) => {
              const active = i <= currentStatusIdx && currentStatusIdx >= 0;
              return (
                <div key={s} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`h-2 w-full rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
                  <span className={`text-[10px] ${active ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {statusConfig[s]?.label || s}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status badge */}
          <Badge className={statusConfig[order.status]?.color || "bg-muted"}>
            {statusConfig[order.status]?.label || order.status}
          </Badge>

          {/* Items */}
          <Card className="card-shadow">
            <CardHeader><CardTitle className="text-base">Articles</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{(item as any).products?.title || "Produit"} × {item.qty}</span>
                  <span className="price-tag">{item.line_total_fcfa.toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="price-tag">{order.total_fcfa.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          {payment && (
            <Card className="card-shadow">
              <CardHeader><CardTitle className="text-base">Paiement</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">Méthode : <strong>{payment.method}</strong></p>
                <p className="text-sm">Montant : <strong>{payment.amount_fcfa.toLocaleString("fr-FR")} FCFA</strong></p>

                {payment.proof_status === "NONE" && (
                  <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Payez au <strong>0718713781</strong> (Wave / Orange Money), puis envoyez la preuve ici.
                    </p>
                    <label className="cursor-pointer">
                      <Button variant="outline" className="gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          {uploading ? "Envoi..." : "Envoyer la preuve"}
                        </span>
                      </Button>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleUploadProof}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}

                {payment.proof_status === "SUBMITTED" && (
                  <div className="rounded-lg bg-info/10 p-3 text-sm text-info flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Preuve envoyée, en cours de vérification.
                  </div>
                )}

                {payment.proof_status === "APPROVED" && (
                  <div className="rounded-lg bg-success/10 p-3 text-sm text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Paiement approuvé.
                  </div>
                )}

                {payment.proof_status === "REJECTED" && (
                  <div className="space-y-2">
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      Preuve rejetée{payment.review_note ? ` : ${payment.review_note}` : ""}. Veuillez renvoyer une preuve valide.
                    </div>
                    <label className="cursor-pointer">
                      <Button variant="outline" className="gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          {uploading ? "Envoi..." : "Renvoyer la preuve"}
                        </span>
                      </Button>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleUploadProof}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery */}
          {delivery && delivery.delivery_status === "SENT" && (
            <Card className="card-shadow border-success/30">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4 text-success" /> Livraison</CardTitle></CardHeader>
              <CardContent>
                {delivery.delivery_note && (
                  <div className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm">
                    {delivery.delivery_note}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
