import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Clock, Package, Percent } from "lucide-react";

type Product = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  product_family: string;
  delivery_mode: string;
  duration_months: number;
  price_fcfa: number;
  image_url?: string | null;
  original_price_fcfa?: number | null;
  discount_percent?: number | null;
  instant_delivery?: boolean;
  delivery_delay?: string | null;
};

const brandColors: Record<string, string> = {
  Autodesk: "bg-accent text-accent-foreground",
  Adobe: "bg-destructive/10 text-destructive",
  LinkedIn: "bg-accent text-accent-foreground",
  Microsoft: "bg-success/10 text-success",
  Lumion: "bg-accent text-accent-foreground",
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/p/${product.slug}`} className="group block">
      <Card className="h-full overflow-hidden border-border/60 transition-all duration-300 hover:border-primary/30 card-shadow hover:card-shadow-hover relative">
        {/* Product image or gradient */}
        {product.image_url ? (
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={product.image_url}
              alt={product.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-muted">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 items-end">
          {product.discount_percent && product.discount_percent > 0 && (
            <Badge className="bg-destructive text-destructive-foreground gap-1 shadow-md">
              <Percent className="h-3 w-3" /> -{product.discount_percent}%
            </Badge>
          )}
          {product.instant_delivery && (
            <Badge className="bg-success text-success-foreground gap-1 shadow-md">
              <Zap className="h-3 w-3" /> Instant
            </Badge>
          )}
        </div>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary" className={brandColors[product.brand] || "bg-accent text-accent-foreground"}>
              {product.brand}
            </Badge>
            {product.delivery_mode === "INSTANT" && !product.instant_delivery && (
              <Badge variant="outline" className="gap-1 border-success/30 text-success">
                <Zap className="h-3 w-3" /> Instant
              </Badge>
            )}
          </div>

          <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {product.duration_months > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {product.duration_months} mois
              </span>
            )}
            <span className="capitalize">
              {product.product_family.toLowerCase().replace("_", " ")}
            </span>
            {product.delivery_delay && (
              <span className="flex items-center gap-1 text-success">
                <Clock className="h-3 w-3" />
                {product.delivery_delay}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="price-tag text-xl">
              {product.price_fcfa.toLocaleString("fr-FR")} FCFA
            </span>
            {product.original_price_fcfa && product.discount_percent && product.discount_percent > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {product.original_price_fcfa.toLocaleString("fr-FR")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
