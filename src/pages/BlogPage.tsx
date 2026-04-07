import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { Calendar, ArrowRight, Tag, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";

const PER_PAGE = 6;

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string | null;
  tags: string[];
  published_at: string | null;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") || "";
  const activeCategory = searchParams.get("cat") || "";
  const activeTag = searchParams.get("tag") || "";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, category, tags, published_at")
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false });
      if (data) setPosts(data as Post[]);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // Extract unique categories and tags
  const { categories, tags } = useMemo(() => {
    const cats = new Set<string>();
    const tgs = new Set<string>();
    posts.forEach((p) => {
      if (p.category) cats.add(p.category);
      (p.tags || []).forEach((t) => tgs.add(t));
    });
    return { categories: Array.from(cats).sort(), tags: Array.from(tgs).sort() };
  }, [posts]);

  // Filter posts
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.title.toLowerCase().includes(q) && !(p.excerpt || "").toLowerCase().includes(q)) return false;
      if (activeCategory && p.category !== activeCategory) return false;
      if (activeTag && !(p.tags || []).includes(activeTag)) return false;
      return true;
    });
  }, [posts, search, activeCategory, activeTag]);

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => { setSearchParams({}); setPage(1); };
  const hasFilters = search || activeCategory || activeTag;

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Helmet>
        <title>Blog — XaraDeals | Guides, tutoriels et actualités logicielles</title>
        <meta name="description" content="Découvrez nos articles, guides et tutoriels sur les logiciels Autodesk, Adobe, Microsoft et outils IA. Astuces, comparatifs et bons plans." />
        <link rel="canonical" href="https://xaradeals.com/blog" />
      </Helmet>
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <ScrollReveal>
            <h1 className="mb-2 text-3xl font-bold">Blog XaraDeals</h1>
            <p className="mb-6 text-muted-foreground">
              Guides, tutoriels et actualités sur les logiciels et abonnements numériques.
            </p>
          </ScrollReveal>

          {/* Search + Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => updateParam("q", e.target.value)}
                placeholder="Rechercher un article..."
                className="pl-10"
              />
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Catégories :</span>
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => updateParam("cat", activeCategory === cat ? "" : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Tags :</span>
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={activeTag === tag ? "default" : "secondary"}
                    className="cursor-pointer transition-colors"
                    onClick={() => updateParam("tag", activeTag === tag ? "" : tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <X className="h-3 w-3" /> Effacer les filtres
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {hasFilters ? "Aucun article ne correspond à votre recherche." : "Aucun article publié pour le moment."}
            </p>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {filtered.length} article{filtered.length > 1 ? "s" : ""} — Page {safePage}/{totalPages}
              </p>
              {paginated.map((post, i) => (
                <ScrollReveal key={post.id} delay={i * 0.05}>
                  <Link to={`/blog/${post.slug}`} className="group block">
                    <Card className="overflow-hidden transition-all hover:border-primary/30 card-shadow hover:card-shadow-hover">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {post.cover_image_url && (
                            <div className="sm:w-1/3 aspect-video sm:aspect-auto overflow-hidden bg-muted">
                              <img
                                src={post.cover_image_url}
                                alt={post.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                          )}
                          <div className={`flex-1 p-5 ${post.cover_image_url ? "" : "w-full"}`}>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              {post.category && (
                                <Badge variant="secondary">{post.category}</Badge>
                              )}
                              {post.published_at && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(post.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                                </span>
                              )}
                            </div>
                            <h2 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">
                              {post.title}
                            </h2>
                            {post.excerpt && (
                              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {post.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  {post.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>
                                  ))}
                                </div>
                              )}
                              <span className="flex items-center gap-1 text-sm font-medium text-primary">
                                Lire <ArrowRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1]) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === safePage ? "default" : "outline"}
                          size="icon"
                          onClick={() => setPage(p)}
                          className="h-9 w-9"
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
