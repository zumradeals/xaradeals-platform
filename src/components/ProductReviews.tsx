import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Star, User } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null } | null;
};

interface ProductReviewsProps {
  productId: string;
  canReview?: { orderId: string } | null;
}

function StarRating({ rating, onChange, interactive = false }: { rating: number; onChange?: (r: number) => void; interactive?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`h-5 w-5 ${star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, canReview }: ProductReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(full_name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (data) {
      setReviews(data as any);
      if (user) {
        setHasReviewed(data.some((r: any) => r.user_id === user.id));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async () => {
    if (!user || !canReview) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        order_id: canReview.orderId,
        rating: newRating,
        comment: newComment.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Merci pour votre avis !" });
      setNewComment("");
      setNewRating(5);
      fetchReviews();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Avis clients
          {avgRating && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {avgRating}/5 ({reviews.length} avis)
            </span>
          )}
        </h2>
      </div>

      {/* Review form */}
      {canReview && !hasReviewed && user && (
        <Card className="border-primary/20 bg-accent/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Donnez votre avis</p>
            <StarRating rating={newRating} onChange={setNewRating} interactive />
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Partagez votre expérience (optionnel)"
              rows={3}
            />
            <Button onClick={handleSubmit} disabled={submitting} size="sm">
              {submitting ? "Envoi..." : "Publier mon avis"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {(review as any).profiles?.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
