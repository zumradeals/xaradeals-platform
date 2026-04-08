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
import { Label } from "@/components/ui/label";
import { Zap, Clock, ShoppingCart, CheckCircle, MessageCircle, Percent, Share2 } from "lucide-react";
import { getShareUrl } from "@/lib/share-utils";
import TrustBadges from "@/components/TrustBadges";
import FavoriteButton from "@/components/FavoriteButton";
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
  original_price_fcfa: number | null; discount_percent: number | null; og_image_url?: string | null;
  category_id: string | null; delivery_delay: string | null;
};

type ProductVariant = {
  id: string; label: string; duration_months: number; price_fcfa: number; position: number;
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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
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
        const [blocksRes, imagesRes, variantsRes] = await Promise.all([
          supabase.from("product_description_blocks").select("*").eq("product_id", prod.id).single(),
          supabase.from("product_images").select("*").eq("product_id", prod.id).order("position"),
          supabase.from("product_variants").select("*").eq("product_id", prod.id).order("position"),
        ]);
        if (blocksRes.data) setBlock(blocksRes.data as Block);
        if (imagesRes.data) setImages(imagesRes.data as ProductImage[]);
        if (variantsRes.data && (variantsRes.data as ProductVariant[]).length > 0) {
          const v = variantsRes.data as ProductVariant[];
          setVariants(v);
          setSelectedVariant(v[0]);
        }
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

  const activePrice = selectedVariant ? selectedVariant.price_fcfa : product?.price_fcfa ?? 0;
  const activeLabel = selectedVariant ? ` (${selectedVariant.label})` : "";

  const handleWhatsAppDirect = () => {
    if (!product) return;
    const clientName = user ? (profile?.full_name || user.email || "Client") : "Client";
    const msg = encodeURIComponent(
      `Bonjour XaraDeals 👋\n\nJe souhaite commander :\n• ${product.title}${activeLabel} — ${activePrice.toLocaleString("fr-FR")} FCFA\n\n💰 Total : ${activePrice.toLocaleString("fr-FR")} FCFA\n\nMon nom : ${clientName}`
    );
    window.open(`https://wa.me/2250718713781?text=${msg}`, "_blank");
    setShowCheckout(false);
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
        <link rel="canonical" href={`https://xaradeals.com/p/${product.slug}`} />
        <meta property="og:title" content={product.seo_title || product.title} />
        <meta property="og:description" content={product.seo_description || `${product.title} à ${product.price_fcfa.toLocaleString("fr-FR")} FCFA`} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://xaradeals.com/p/${product.slug}`} />
        {(product.og_image_url || images[0]?.url) && <meta property="og:image" content={product.og_image_url || images[0]?.url} />}
        <meta property="product:price:amount" content={String(product.price_fcfa)} />
        <meta property="product:price:currency" content="XOF" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.seo_description || product.title,
            brand: { "@type": "Brand", name: product.brand },
            image: images.map((img) => img.url),
            sku: product.slug,
            url: `https://xaradeals.com/p/${product.slug}`,
            offers: {
              "@type": "Offer",
              url: `https://xaradeals.com/p/${product.slug}`,
              price: product.price_fcfa,
              priceCurrency: "XOF",
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: "XaraDeals", url: "https://xaradeals.com" },
              priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://xaradeals.com/" },
              ...(categoryInfo ? [{ "@type": "ListItem", position: 2, name: categoryInfo.name, item: `https://xaradeals.com/c/${categoryInfo.slug}` }] : []),
              { "@type": "ListItem", position: categoryInfo ? 3 : 2, name: product.title },
            ],
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
              <div className="flex items-center gap-3">
                <h1 className="mb-2 text-3xl font-bold flex-1">{product.title}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    const shareUrl = getShareUrl("product", product.slug);
                    if (navigator.share) {
                      navigator.share({ title: product.title, url: shareUrl });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      toast({ title: "Lien copié !" });
                    }
                  }}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <FavoriteButton productId={product.id} className="h-10 w-10" />
              </div>
              {product.duration_months > 0 && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Durée : {product.duration_months} mois
                </p>
              )}
            </div>

            <Card className="card-shadow">
              <CardContent className="p-6 text-center">
                {/* Variant selector */}
                {variants.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Choisir une durée</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                            selectedVariant?.id === v.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <span className="block">{v.label}</span>
                          <span className="block text-xs font-bold">{v.price_fcfa.toLocaleString("fr-FR")} FCFA</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedVariant && product.discount_percent && product.discount_percent > 0 && product.original_price_fcfa ? (
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
                  {activePrice.toLocaleString("fr-FR")} FCFA
                </div>
                <p className="mb-4 text-xs text-muted-foreground">TTC{activeLabel && ` — ${selectedVariant?.label}`}</p>
                <Button
                  className="w-full gap-2 mb-2"
                  size="lg"
                  onClick={() => {
                    addItem({
                      product_id: product.id,
                      title: product.title + activeLabel,
                      slug: product.slug,
                      brand: product.brand,
                      price_fcfa: activePrice,
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
                {product.delivery_delay && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-success" />
                    <span>Délai : <strong className="text-foreground">{product.delivery_delay}</strong></span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-success" /> Licence officielle garantie
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Badges */}
          <div className="mb-8">
            <TrustBadges />
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
              <p className="text-sm font-medium">{product.title}{activeLabel}</p>
              <p className="price-tag text-xl">{activePrice.toLocaleString("fr-FR")} FCFA</p>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p>📱 Vous serez redirigé vers WhatsApp pour finaliser avec notre équipe.</p>
              <p className="mt-1">💳 Payez au <strong>0718713781</strong> via Wave ou Orange Money, puis envoyez la preuve dans votre espace compte.</p>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleWhatsAppDirect}>
              <MessageCircle className="h-4 w-4" />
              Confirmer et ouvrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
