import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Zap, Clock, ShoppingCart, CheckCircle, MessageCircle, Percent } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import ProductReviews from "@/components/ProductReviews";
import SimilarProducts from "@/components/SimilarProducts";
import ProductDescriptionBlocks from "@/components/ProductDescriptionBlocks";
import { useCart } from "@/lib/cart-context";

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number;
  price_fcfa: number; seo_title: string | null; seo_description: string | null;
  original_price_fcfa: number | null; discount_percent: number | null;
  category_id: string | null;
};

type ProductImage = {
  id: string; url: string; position: number; alt_text: string | null;
};

type Block = {
  pitch: string | null; use_case: string | null; what_you_get: string | null;
  requirements: string | null; duration_and_renewal: string | null;
  delivery_steps: string | null; support_policy: string | null; faq: string | null;
};


export default function ProductPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImg, setSelectedImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [method, setMethod] = useState<"WAVE" | "ORANGE">("WAVE");
  const [ordering, setOrdering] = useState(false);
  const [canReview, setCanReview] = useState<{ orderId: string } | null>(null);
  const [categoryInfo, setCategoryInfo] = useState<{ name: string; slug: string } | null>(null);
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
        const [blocksRes, imagesRes] = await Promise.all([
          supabase.from("product_description_blocks").select("*").eq("product_id", prod.id).single(),
          supabase.from("product_images").select("*").eq("product_id", prod.id).order("position"),
          ...(prod.category_id
            ? [supabase.from("categories").select("name, slug").eq("id", prod.category_id).single()]
            : []),
        ]);
        if (blocksRes.data) setBlock(blocksRes.data as Block);
        if (imagesRes.data) setImages(imagesRes.data as ProductImage[]);
        if (prod.category_id) {
          const catRes = await supabase.from("categories").select("name, slug").eq("id", prod.category_id).single();
          if (catRes.data) setCategoryInfo(catRes.data as { name: string; slug: string });
        }

        // Check if user can review (has a delivered order with this product)
        if (user) {
          const { data: userOrders } = await supabase
            .from("orders")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "DELIVERED");
          
          if (userOrders && userOrders.length > 0) {
            const { data: matchingItems } = await supabase
              .from("order_items")
              .select("order_id")
              .eq("product_id", prod.id)
              .in("order_id", userOrders.map((o) => o.id))
              .limit(1);
            if (matchingItems && matchingItems.length > 0) {
              setCanReview({ orderId: matchingItems[0].order_id });
            }
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [productSlug, user]);

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
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
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
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Produit introuvable.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Helmet>
        <title>{product.seo_title || `${product.title} — XaraDeals`}</title>
        <meta name="description" content={product.seo_description || `${product.title} - ${product.brand} à ${product.price_fcfa.toLocaleString("fr-FR")} FCFA. Livraison rapide, paiement Wave & Orange Money.`} />
        <link rel="canonical" href={`https://xaradeals-platform.lovable.app/p/${product.slug}`} />
        <meta property="og:title" content={product.seo_title || product.title} />
        <meta property="og:description" content={product.seo_description || `${product.title} à ${product.price_fcfa.toLocaleString("fr-FR")} FCFA`} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://xaradeals-platform.lovable.app/p/${product.slug}`} />
        {images[0]?.url && <meta property="og:image" content={images[0].url} />}
        <meta property="product:price:amount" content={String(product.price_fcfa)} />
        <meta property="product:price:currency" content="XOF" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.seo_description || product.title,
            brand: { "@type": "Brand", name: product.brand },
            image: images[0]?.url,
            offers: {
              "@type": "Offer",
              price: product.price_fcfa,
              priceCurrency: "XOF",
              availability: "https://schema.org/InStock",
              seller: { "@type": "Organization", name: "XaraDeals" },
            },
          })}
        </script>
      </Helmet>
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <Breadcrumbs items={[
            ...(categoryInfo ? [{ label: categoryInfo.name, href: `/c/${categoryInfo.slug}` }] : []),
            { label: product.title },
          ]} />
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {/* Image gallery */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border bg-muted">
                    <img
                      src={images[selectedImg]?.url}
                      alt={images[selectedImg]?.alt_text || product.title}
                      className="aspect-[4/3] w-full object-contain"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImg(i)}
                          className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === selectedImg ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                        >
                          <img src={img.url} alt={img.alt_text || ""} className="h-16 w-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                {product.discount_percent && product.discount_percent > 0 && product.original_price_fcfa ? (
                  <>
                    <Badge className="mb-2 bg-destructive text-destructive-foreground gap-1">
                      <Percent className="h-3 w-3" /> -{product.discount_percent}%
                    </Badge>
                    <div className="text-lg text-muted-foreground line-through">
                      {product.original_price_fcfa.toLocaleString("fr-FR")} FCFA
                    </div>
                  </>
                ) : null}
                <div className="price-tag mb-1 text-3xl">
                  {product.price_fcfa.toLocaleString("fr-FR")} FCFA
                </div>
                <p className="mb-4 text-xs text-muted-foreground">TTC</p>
                <Button
                  className="w-full gap-2 mb-2"
                  size="lg"
                  onClick={() => {
                    addItem({
                      product_id: product.id,
                      title: product.title,
                      slug: product.slug,
                      brand: product.brand,
                      price_fcfa: product.price_fcfa,
                      image_url: images[0]?.url || null,
                    });
                    toast({ title: "Ajouté au panier !" });
                  }}
                >
                  <ShoppingCart className="h-4 w-4" /> Ajouter au panier
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => setShowCheckout(true)}
                >
                  <MessageCircle className="h-4 w-4" /> Commander directement
                </Button>
                <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-success" /> Licence officielle garantie
                </div>
              </CardContent>
            </Card>
          </div>

          {block && <ProductDescriptionBlocks block={block} />}

          {/* Reviews */}
          <Separator className="my-8" />
          <ProductReviews productId={product.id} canReview={canReview} />

          {/* Similar Products */}
          <Separator className="my-8" />
          <SimilarProducts productId={product.id} brand={product.brand} categoryId={product.category_id} />
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
