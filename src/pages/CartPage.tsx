import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useCoupon } from "@/hooks/use-coupon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingCart, MessageCircle, ArrowLeft, Ticket, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function CartPage() {
  const { user, profile } = useAuth();
  const { items, removeItem, updateQty, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const { coupon, error: couponError, loading: couponLoading, applyCoupon, removeCoupon, getDiscount } = useCoupon();
  const discount = getDiscount(totalPrice);
  const finalPrice = totalPrice - discount;

  const handleWhatsApp = () => {
    const clientName = user ? (profile?.full_name || user.email || "Client") : "Client";

    const lignes = items
      .map((i) => `• ${i.title} x${i.qty} — ${(i.price_fcfa * i.qty).toLocaleString("fr-FR")} F`)
      .join("\n");

    const couponLine = coupon ? `\n🎟️ Code promo : ${coupon.code} (-${discount.toLocaleString("fr-FR")} FCFA)` : "";
    const msg = encodeURIComponent(
      `Bonjour XaraDeals 👋\n\nJe souhaite commander :\n${lignes}${couponLine}\n\n💰 Total : ${finalPrice.toLocaleString("fr-FR")} FCFA\n\nMon nom : ${clientName}`
    );

    const waLink = `https://wa.me/2250718713781?text=${msg}`;
    clearCart();
    window.open(waLink, "_blank");
  };

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
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

              {/* Summary */}
              <Card className="card-shadow border-primary/20">
                <CardContent className="p-4 space-y-3">
                  {/* Coupon */}
                  <div className="space-y-2">
                    {coupon ? (
                      <div className="flex items-center justify-between rounded-lg bg-success/10 p-2.5 text-sm">
                        <span className="flex items-center gap-1.5 text-success font-medium">
                          <Ticket className="h-4 w-4" /> {coupon.code} appliqué
                        </span>
                        <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Code promo"
                          className="uppercase"
                        />
                        <Button
                          variant="outline"
                          onClick={() => applyCoupon(couponCode, totalPrice)}
                          disabled={couponLoading || !couponCode.trim()}
                        >
                          Appliquer
                        </Button>
                      </div>
                    )}
                    {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <span>{totalItems} article{totalItems > 1 ? "s" : ""}</span>
                    <span>{totalPrice.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm text-success">
                      <span>Réduction</span>
                      <span>-{discount.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">{finalPrice.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <p>📱 Vous serez redirigé vers WhatsApp pour finaliser votre commande.</p>
                  </div>
                  <Button className="w-full gap-2" size="lg" onClick={handleWhatsApp}>
                    <MessageCircle className="h-4 w-4" />
                    Commander via WhatsApp
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
