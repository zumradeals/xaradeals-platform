import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Zap, Clock, ShoppingCart, CheckCircle, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number;
  price_fcfa: number; seo_title: string | null; seo_description: string | null;
};

type Block = {
  pitch: string | null; use_case: string | null; what_you_get: string | null;
  requirements: string | null; duration_and_renewal: string | null;
  delivery_steps: string | null; support_policy: string | null; faq: string | null;
};

const blockLabels: Record<string, string> = {
  pitch: "Présentation",
  use_case: "À qui s'adresse ce produit",
  what_you_get: "Ce que vous recevez",
  requirements: "Prérequis",
  duration_and_renewal: "Durée & Renouvellement",
  delivery_steps: "Étapes de livraison",
  support_policy: "Support",
  faq: "Questions fréquentes",
};

export default function ProductPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [method, setMethod] = useState<"WAVE" | "ORANGE">("WAVE");
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("slug", productSlug)
        .single();

      if (prod) {
        setProduct(prod as Product);
        const { data: blocks } = await supabase
          .from("product_description_blocks")
          .select("*")
          .eq("product_id", prod.id)
          .single();
        if (blocks) setBlock(blocks as Block);
      }
      setLoading(false);
    };
    fetchData();
  }, [productSlug]);

  const handleOrder = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!product) return;

    setOrdering(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          items: [{ product_id: product.id, qty: 1 }],
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
      setShowCheckout(false);

      // Open WhatsApp
      window.open(waLink, "_blank");

      // Navigate to order detail
      navigate(`/account/orders/${data.order_id}`);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la commande", variant: "destructive" });
    }
    setOrdering(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-4xl">
            <Skeleton className="mb-4 h-10 w-3/4" />
            <Skeleton className="mb-8 h-6 w-1/2" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Produit introuvable.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>{product.seo_title || product.title}</title>
        <meta name="description" content={product.seo_description || ""} />
      </Helmet>
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{product.brand}</Badge>
                <Badge variant="outline" className="capitalize">
                  {product.product_family.toLowerCase().replace("_", " ")}
                </Badge>
                {product.delivery_mode === "INSTANT" && (
                  <Badge variant="outline" className="gap-1 border-success/30 text-success">
                    <Zap className="h-3 w-3" /> Livraison instantanée
                  </Badge>
                )}
              </div>
              <h1 className="mb-2 text-3xl font-bold">{product.title}</h1>
              {product.duration_months > 0 && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Durée : {product.duration_months} mois
                </p>
              )}
            </div>

            <Card className="card-shadow">
              <CardContent className="p-6 text-center">
                <div className="price-tag mb-1 text-3xl">
                  {product.price_fcfa.toLocaleString("fr-FR")} FCFA
                </div>
                <p className="mb-4 text-xs text-muted-foreground">TTC</p>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => setShowCheckout(true)}
                >
                  <MessageCircle className="h-4 w-4" /> Commander via WhatsApp
                </Button>
                <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-success" /> Licence officielle garantie
                </div>
              </CardContent>
            </Card>
          </div>

          {block && (
            <div className="space-y-6">
              {(Object.keys(blockLabels) as Array<keyof Block>).map((key) => {
                const value = block[key];
                if (!value) return null;
                return (
                  <div key={key} className="animate-fade-in">
                    <h2 className="mb-2 text-lg font-semibold">{blockLabels[key]}</h2>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {value}
                    </div>
                    <Separator className="mt-6" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Checkout dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commander via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{product.title}</p>
              <p className="price-tag text-xl">{product.price_fcfa.toLocaleString("fr-FR")} FCFA</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Mode de paiement</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as "WAVE" | "ORANGE")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="WAVE" id="wave" />
                  <Label htmlFor="wave">Wave</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ORANGE" id="orange" />
                  <Label htmlFor="orange">Orange Money</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p>📱 Vous serez redirigé vers WhatsApp pour finaliser avec notre équipe.</p>
              <p className="mt-1">💳 Payez au <strong>0718713781</strong> via {method}, puis envoyez la preuve dans votre espace compte.</p>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleOrder} disabled={ordering}>
              <MessageCircle className="h-4 w-4" />
              {ordering ? "Création..." : "Confirmer et ouvrir WhatsApp"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
