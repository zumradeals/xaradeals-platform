import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function FavoriteButton({ productId, className }: { productId: string; className?: string }) {
  const { user } = useAuth();
  const { data: favorites } = useFavorites();
  const toggle = useToggleFavorite();
  const navigate = useNavigate();

  const isFav = favorites?.has(productId) ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    toggle.mutate({ productId, isFav });
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-all hover:scale-110",
        className
      )}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        className={cn("h-4 w-4 transition-colors", isFav ? "fill-destructive text-destructive" : "text-muted-foreground")}
      />
    </button>
  );
}
