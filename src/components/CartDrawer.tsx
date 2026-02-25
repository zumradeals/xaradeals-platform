import { useNavigate } from "react-router-dom";
import { useCart } from "@/lib/cart-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingCart, MessageCircle } from "lucide-react";

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, totalItems, totalPrice, isOpen, setIsOpen } = useCart();

  const goToCheckout = () => {
    setIsOpen(false);
    navigate("/cart");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="flex w-80 flex-col sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Panier ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Votre panier est vide</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-3 rounded-lg border p-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="h-16 w-16 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                      <ShoppingCart className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      {(item.price_fcfa * item.qty).toLocaleString("fr-FR")} F
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-between">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.product_id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.product_id, item.qty - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.product_id, item.qty + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <Button className="w-full gap-2" size="lg" onClick={goToCheckout}>
                <MessageCircle className="h-4 w-4" /> Commander via WhatsApp
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
