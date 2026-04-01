import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Search, Image, Tag, FileText, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Product = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  category_id: string | null;
};

function computeScore(p: Product) {
  let score = 0;
  const issues: string[] = [];

  if (p.seo_title) {
    const len = p.seo_title.length;
    if (len >= 30 && len <= 60) score += 25;
    else { score += 10; issues.push(`Titre SEO : ${len} car.`); }
  } else { issues.push("Titre SEO manquant"); }

  if (p.seo_description) {
    const len = p.seo_description.length;
    if (len >= 80 && len <= 160) score += 25;
    else { score += 10; issues.push(`Desc. SEO : ${len} car.`); }
  } else { issues.push("Desc. SEO manquante"); }

  if (p.slug && p.slug.length > 3) score += 15;
  else issues.push("Slug invalide");

  if (p.category_id) score += 15;
  else issues.push("Pas de catégorie");

  if (p.og_image_url) score += 10;
  else issues.push("Image OG manquante");

  if (p.title && p.title.length >= 10) score += 10;
  else issues.push("Titre trop court");

  return { score, issues };
}

export default function AdminSeo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, slug, brand, status, seo_title, seo_description, og_image_url, category_id")
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const generateSeo = async (productId: string) => {
    setGeneratingId(productId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo", {
        body: { product_id: productId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "SEO généré ✨",
        description: `Titre: ${data.seo_title}`,
      });
      await fetchProducts();
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message || "Impossible de générer le SEO",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const generateAllMissing = async () => {
    const missing = published.filter((p) => !p.seo_title || !p.seo_description);
    if (missing.length === 0) {
      toast({ title: "Tout est déjà optimisé ✅" });
      return;
    }
    setGeneratingAll(true);
    let success = 0;
    for (const p of missing) {
      try {
        setGeneratingId(p.id);
        const { data, error } = await supabase.functions.invoke("generate-seo", {
          body: { product_id: p.id },
        });
        if (!error && !data?.error) success++;
        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 1500));
      } catch {
        // continue
      }
    }
    setGeneratingId(null);
    setGeneratingAll(false);
    await fetchProducts();
    toast({
      title: `${success}/${missing.length} produits optimisés ✨`,
    });
  };

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  const published = products.filter((p) => p.status === "PUBLISHED");
  const scores = published.map((p) => computeScore(p));
  const avgScore = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
  const excellent = scores.filter((s) => s.score >= 80).length;
  const warning = scores.filter((s) => s.score >= 50 && s.score < 80).length;
  const critical = scores.filter((s) => s.score < 50).length;

  const issueCount: Record<string, number> = {};
  scores.forEach((s) => s.issues.forEach((i) => { issueCount[i] = (issueCount[i] || 0) + 1; }));
  const topIssues = Object.entries(issueCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const noSeoTitle = published.filter((p) => !p.seo_title).length;
  const noSeoDesc = published.filter((p) => !p.seo_description).length;
  const noOgImage = published.filter((p) => !p.og_image_url).length;
  const noCategory = published.filter((p) => !p.category_id).length;
  const missingCount = published.filter((p) => !p.seo_title || !p.seo_description).length;

  return (
    <div className="space-y-6">
      {/* AI Generation banner */}
      {missingCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">{missingCount} produit{missingCount > 1 ? "s" : ""} sans SEO complet</p>
                <p className="text-xs text-muted-foreground">Générez automatiquement titres et descriptions SEO via IA</p>
              </div>
            </div>
            <Button onClick={generateAllMissing} disabled={generatingAll} className="gap-2">
              {generatingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generatingAll ? "Génération en cours…" : "Générer tout"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-3xl font-bold">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">Score SEO moyen</p>
            <Progress value={avgScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-success" />
            <p className="text-3xl font-bold">{excellent}</p>
            <p className="text-xs text-muted-foreground">Produits optimisés (≥80%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
            <p className="text-3xl font-bold">{warning}</p>
            <p className="text-xs text-muted-foreground">À améliorer (50-79%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
            <p className="text-3xl font-bold">{critical}</p>
            <p className="text-xs text-muted-foreground">Critiques (&lt;50%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{noSeoTitle}/{published.length}</p>
              <p className="text-xs text-muted-foreground">Sans titre SEO</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{noSeoDesc}/{published.length}</p>
              <p className="text-xs text-muted-foreground">Sans description SEO</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Image className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{noOgImage}/{published.length}</p>
              <p className="text-xs text-muted-foreground">Sans image OG</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{noCategory}/{published.length}</p>
              <p className="text-xs text-muted-foreground">Sans catégorie</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top issues */}
      {topIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Problèmes les plus fréquents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topIssues.map(([issue, count]) => (
                <li key={issue} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">• {issue}</span>
                  <Badge variant="outline">{count} produit{count > 1 ? "s" : ""}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Per-product list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail par produit publié</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {published.map((p) => {
            const { score, issues } = computeScore(p);
            const Icon = score >= 80 ? CheckCircle : score >= 50 ? AlertTriangle : XCircle;
            const color = score >= 80 ? "text-success" : score >= 50 ? "text-yellow-500" : "text-destructive";
            const needsSeo = !p.seo_title || !p.seo_description;
            const isGenerating = generatingId === p.id;
            return (
              <div key={p.id} className="flex items-start gap-3 rounded-lg border p-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{p.title}</p>
                    <Badge variant="outline" className={`shrink-0 ${color}`}>{score}%</Badge>
                  </div>
                  {issues.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{issues.join(" · ")}</p>
                  )}
                  {p.seo_title && (
                    <p className="text-xs text-muted-foreground mt-1 italic">📌 {p.seo_title}</p>
                  )}
                </div>
                {needsSeo && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    disabled={isGenerating || generatingAll}
                    onClick={() => generateSeo(p.id)}
                  >
                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    IA
                  </Button>
                )}
              </div>
            );
          })}
          {published.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun produit publié.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
