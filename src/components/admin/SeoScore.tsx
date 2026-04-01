import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type Product = {
  title: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url?: string | null;
  image_url?: string | null;
  category_id: string | null;
};

function computeSeoScore(product: Product): { score: number; tips: string[] } {
  let score = 0;
  const tips: string[] = [];

  // Title SEO (25 pts)
  if (product.seo_title) {
    const len = product.seo_title.length;
    if (len >= 30 && len <= 60) {
      score += 25;
    } else if (len > 0) {
      score += 10;
      tips.push(`Titre SEO : ${len} car. (idéal 30-60)`);
    }
  } else {
    tips.push("Titre SEO manquant");
  }

  // Description SEO (25 pts)
  if (product.seo_description) {
    const len = product.seo_description.length;
    if (len >= 80 && len <= 160) {
      score += 25;
    } else if (len > 0) {
      score += 10;
      tips.push(`Description SEO : ${len} car. (idéal 80-160)`);
    }
  } else {
    tips.push("Description SEO manquante");
  }

  // Slug (15 pts)
  if (product.slug && product.slug.length > 3 && !product.slug.includes(" ")) {
    score += 15;
  } else {
    tips.push("Slug trop court ou invalide");
  }

  // Category (15 pts)
  if (product.category_id) {
    score += 15;
  } else {
    tips.push("Catégorie non assignée");
  }

  // OG Image (10 pts) — fallback to product main image
  if (product.og_image_url || product.image_url) {
    score += 10;
  } else {
    tips.push("Image OG manquante");
  }

  // Title length (10 pts)
  if (product.title && product.title.length >= 10) {
    score += 10;
  } else {
    tips.push("Titre produit trop court (<10 car.)");
  }

  return { score, tips };
}

export default function SeoScore({ product }: { product: Product }) {
  const { score, tips } = computeSeoScore(product);

  const Icon = score >= 80 ? CheckCircle : score >= 50 ? AlertTriangle : XCircle;
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-yellow-500" : "text-destructive";
  const bg = score >= 80 ? "bg-success/10" : score >= 50 ? "bg-yellow-500/10" : "bg-destructive/10";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 cursor-help ${bg} ${color} border-0`}>
            <Icon className="h-3 w-3" />
            SEO {score}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          {tips.length === 0 ? (
            <p className="text-xs">✅ SEO optimal</p>
          ) : (
            <ul className="text-xs space-y-1">
              {tips.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
