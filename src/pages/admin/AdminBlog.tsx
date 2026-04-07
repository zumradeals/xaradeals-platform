import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, FileText, ImagePlus, Loader2, X } from "lucide-react";
import { generateSlug } from "@/lib/slug-utils";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string | null;
  tags: string[];
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
};

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  category: "",
  tags: "",
  status: "DRAFT",
  seo_title: "",
  seo_description: "",
};

export default function AdminBlog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { toast } = useToast();

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as BlogPost[]);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop() || "webp";
      const path = `covers/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("blog_images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("blog_images").getPublicUrl(path);
      set("cover_image_url", urlData.publicUrl);
      toast({ title: "Image uploadée ✓" });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploadingCover(false);
    e.target.value = "";
  };

  const removeCover = () => set("cover_image_url", "");

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image_url: post.cover_image_url || "",
      category: post.category || "",
      tags: (post.tags || []).join(", "),
      status: post.status,
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Titre et contenu requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = form.slug.trim() || generateSlug(form.title);
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image_url: form.cover_image_url.trim() || null,
      category: form.category.trim() || null,
      tags,
      status: form.status,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      author_id: user?.id || null,
      published_at: form.status === "PUBLISHED" ? new Date().toISOString() : null,
    };

    let error;
    if (editId) {
      const res = await supabase.from("blog_posts").update(payload).eq("id", editId);
      error = res.error;
    } else {
      const res = await supabase.from("blog_posts").insert(payload);
      error = res.error;
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Article mis à jour ✓" : "Article créé ✓" });
      setShowForm(false);
      fetchPosts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("blog_posts").delete().eq("id", id);
    toast({ title: "Article supprimé" });
    fetchPosts();
  };

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" /> Blog ({posts.length})
        </h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvel article
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id} className="card-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{post.title}</p>
                  <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                    {post.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  /{post.slug}
                  {post.category && ` • ${post.category}`}
                  {post.published_at && ` • ${new Date(post.published_at).toLocaleDateString("fr-FR")}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {post.status === "PUBLISHED" && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun article. Créez votre premier article de blog !</p>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Comment choisir sa licence Adobe..." />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="Auto-généré depuis le titre" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Extrait</Label>
              <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} placeholder="Résumé court de l'article (affiché en listing)" />
            </div>

            <div className="space-y-2" data-color-mode="light">
              <Label>Contenu *</Label>
              <Suspense fallback={<div className="h-64 rounded-lg border bg-muted animate-pulse" />}>
                <MDEditor
                  value={form.content}
                  onChange={(val) => set("content", val || "")}
                  height={400}
                  preview="live"
                  textareaProps={{ placeholder: "Rédigez votre article ici..." }}
                />
              </Suspense>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Image de couverture</Label>
                {form.cover_image_url ? (
                  <div className="relative w-full max-w-xs">
                    <img src={form.cover_image_url} alt="Couverture" className="rounded-lg border object-cover aspect-video w-full" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={removeCover}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                    {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploadingCover ? "Upload en cours…" : "Cliquez pour uploader une image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                  </label>
                )}
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Tutoriels, Guides, Actualités..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tags (séparés par virgule)</Label>
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="adobe, licence, tutoriel" />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                    <SelectItem value="PUBLISHED">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SEO */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">🔍 SEO</p>
              <div className="space-y-2">
                <Label>Titre SEO</Label>
                <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder="Titre optimisé pour Google (30-60 car.)" />
                <p className="text-xs text-muted-foreground">{(form.seo_title || form.title).length}/60 caractères</p>
              </div>
              <div className="space-y-2">
                <Label>Description SEO</Label>
                <Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={2} placeholder="Description pour Google (80-160 car.)" />
                <p className="text-xs text-muted-foreground">{(form.seo_description || form.excerpt || "").length}/160 caractères</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Enregistrement…" : editId ? "Mettre à jour" : "Créer l'article"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
