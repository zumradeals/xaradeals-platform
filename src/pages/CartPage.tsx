import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Minus, ShoppingCart, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CartPage() {
  const { user, profile } = useAuth();
  const { items, removeItem, updateQty, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [method, setMethod] = useState<"WAVE" | "ORANGE">("WAVE");
  const [ordering, setOrdering] = useState(false);

  const handleOrder = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (items.length === 0) return;

    setOrdering(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
          method,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const clientName = profile?.full_name || user.email || "Client";
      const msg = encodeURIComponent(
        `Bonjour XaraDeals.\nJe veux payer la commande ${data.order_ref}.\nProduit(s): ${data.items_summary}\nTotal: ${data.total_fcfa.toLocaleString("fr-FR")} FCFA.\nPaiement via ${data.method}.\nMerci de me confirmer et je vais envoyer la preuve ici.\nMon nom: ${clientName}`
      );
      const waLink = `https://wa.me/2250718713781?text=${msg}`;

      toast({ title: "Commande créée !", description: `Référence : ${data.order_ref}` });
      clearCart();
      window.open(waLink, "_blank");
      navigate(`/account/orders/${data.order_id}`);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la commande", variant: "destructive" });
    }
    setOrdering(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Mon panier ({totalItems})</h1>
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-muted-foreground/20" />
              <p className="text-lg text-muted-foreground mb-4">Votre panier est vide</p>
              <Button asChild>
                <Link to="/">Découvrir nos produits</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.product_id} className="card-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="h-20 w-20 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/p/${item.slug}`} className="text-sm font-medium hover:text-primary transition-colors">
                          {item.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.brand}</p>
                        <p className="price-tag mt-1">{item.price_fcfa.toLocaleString("fr-FR")} FCFA</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, item.qty - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, item.qty + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => removeItem(item.product_id)}>
                          <Trash2 className="mr-1 h-3 w-3" /> Retirer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Payment method */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="text-sm font-medium">Mode de paiement</Label>
                  <RadioGroup value={method} onValueChange={(v) => setMethod(v as "WAVE" | "ORANGE")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="WAVE" id="cart-wave" />
                      <Label htmlFor="cart-wave">Wave</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ORANGE" id="cart-orange" />
                      <Label htmlFor="cart-orange">Orange Money</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="card-shadow border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{totalItems} article{totalItems > 1 ? "s" : ""}</span>
                    <span>{totalPrice.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <p>📱 Vous serez redirigé vers WhatsApp pour finaliser.</p>
                    <p className="mt-1">💳 Payez au <strong>0718713781</strong> via {method}.</p>
                  </div>
                  <Button className="w-full gap-2" size="lg" onClick={handleOrder} disabled={ordering}>
                    <MessageCircle className="h-4 w-4" />
                    {ordering ? "Création..." : "Confirmer et ouvrir WhatsApp"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
