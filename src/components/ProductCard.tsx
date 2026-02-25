import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Clock } from "lucide-react";

type Product = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  product_family: string;
  delivery_mode: string;
  duration_months: number;
  price_fcfa: number;
};

const brandColors: Record<string, string> = {
  Autodesk: "bg-info/10 text-info",
  Adobe: "bg-destructive/10 text-destructive",
  LinkedIn: "bg-info/10 text-info",
  Microsoft: "bg-success/10 text-success",
  Lumion: "bg-warning/10 text-warning",
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/p/${product.slug}`} className="group block">
      <Card className="h-full overflow-hidden border-border/60 transition-all duration-300 hover:border-primary/30 card-shadow hover:card-shadow-hover">
        <div className="h-2 hero-gradient" />
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary" className={brandColors[product.brand] || "bg-accent text-accent-foreground"}>
              {product.brand}
            </Badge>
            {product.delivery_mode === "INSTANT" && (
              <Badge variant="outline" className="gap-1 border-success/30 text-success">
                <Zap className="h-3 w-3" /> Instant
              </Badge>
            )}
          </div>

          <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            {product.duration_months > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {product.duration_months} mois
              </span>
            )}
            <span className="capitalize">
              {product.product_family.toLowerCase().replace("_", " ")}
            </span>
          </div>

          <div className="price-tag text-xl">
            {product.price_fcfa.toLocaleString("fr-FR")} FCFA
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
