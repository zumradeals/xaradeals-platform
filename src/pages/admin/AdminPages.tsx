import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, FileText, Eye } from "lucide-react";

type SitePage = {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  content: string;
  updated_at: string;
};

export default function AdminPages() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SitePage | null>(null);
  const [form, setForm] = useState({ title: "", seo_title: "", seo_description: "", content: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPages = async () => {
    const { data } = await supabase
      .from("site_pages")
      .select("*")
      .order("title");
    if (data) setPages(data as SitePage[]);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const openEdit = (page: SitePage) => {
    setEditing(page);
    setForm({
      title: page.title,
      seo_title: page.seo_title || "",
      seo_description: page.seo_description || "",
      content: page.content,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_pages")
      .update({
        title: form.title,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        content: form.content,
      })
      .eq("id", editing.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Page mise à jour" });
      setEditing(null);
      fetchPages();
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Chargement des pages...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" /> Pages ({pages.length})
        </h2>
      </div>

      <div className="space-y-3">
        {pages.map((p) => (
          <Card key={p.id} className="card-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{p.title}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary">/{p.slug}</Badge>
                  <span>Modifié le {new Date(p.updated_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier : {editing?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titre de la page</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Titre SEO</Label>
              <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} maxLength={60} placeholder="Titre pour les moteurs de recherche" />
              <p className="text-xs text-muted-foreground">{form.seo_title.length}/60 caractères</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description SEO</Label>
              <Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} maxLength={170} rows={2} placeholder="Description pour les moteurs de recherche" />
              <p className={`text-xs ${form.seo_description.length > 160 ? "text-warning" : "text-muted-foreground"}`}>
                {form.seo_description.length}/170 caractères
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Contenu (Markdown supporté)</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} placeholder="Contenu de la page..." />
            </div>

            {/* Google preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Aperçu Google
              </p>
              <div className="rounded-lg border bg-card p-4 space-y-1">
                <p className="text-sm text-info truncate">xaradeals.com › {editing?.slug}</p>
                <p className="text-base font-medium text-primary truncate">{form.seo_title || form.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{form.seo_description || "..."}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
