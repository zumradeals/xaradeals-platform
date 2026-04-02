import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductImageUpload from "@/components/admin/ProductImageUpload";
import ProductDeliveryManager from "@/components/admin/ProductDeliveryManager";
import SeoScore from "@/components/admin/SeoScore";

type Category = { id: string; name: string; slug: string };

type Product = {
  id: string; title: string; slug: string; brand: string;
  product_family: string; delivery_mode: string; duration_months: number;
  price_fcfa: number; status: string; category_id: string | null;
  seo_title: string | null; seo_description: string | null;
};

type Block = {
  id?: string; product_id?: string;
  pitch: string; use_case: string; what_you_get: string; requirements: string;
  duration_and_renewal: string; delivery_steps: string; support_policy: string; faq: string;
};

const emptyBlock: Block = {
  pitch: "", use_case: "", what_you_get: "", requirements: "",
  duration_and_renewal: "", delivery_steps: "", support_policy: "", faq: "",
};

const emptyProduct = {
  title: "", slug: "", brand: "Other" as string, product_family: "SOFTWARE" as string,
  delivery_mode: "INSTANT" as string, duration_months: 0, price_fcfa: 0,
  status: "DRAFT" as string, category_id: "" as string, seo_title: "", seo_description: "",
  original_price_fcfa: 0, discount_percent: 0, supplier_url: "",
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [block, setBlock] = useState<Block>(emptyBlock);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyStockMap, setKeyStockMap] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchAll = async () => {
    const [p, c, keys] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("product_keys").select("product_id, is_used"),
    ]);
    if (p.data) setProducts(p.data as Product[]);
    if (c.data) setCategories(c.data as Category[]);
    if (keys.data) {
      const map: Record<string, number> = {};
      (keys.data as any[]).forEach((k) => {
        if (!k.is_used) map[k.product_id] = (map[k.product_id] || 0) + 1;
      });
      setKeyStockMap(map);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setBlock(emptyBlock);
    setDialogOpen(true);
  };

  const openEdit = async (product: Product) => {
    setEditing(product);
    setForm({
      title: product.title, slug: product.slug, brand: product.brand,
      product_family: product.product_family, delivery_mode: product.delivery_mode,
      duration_months: product.duration_months, price_fcfa: product.price_fcfa,
      status: product.status, category_id: product.category_id || "",
      seo_title: product.seo_title || "", seo_description: product.seo_description || "",
      original_price_fcfa: (product as any).original_price_fcfa || 0,
      discount_percent: (product as any).discount_percent || 0,
      supplier_url: (product as any).supplier_url || "",
    });
    const { data } = await supabase
      .from("product_description_blocks")
      .select("*")
      .eq("product_id", product.id)
      .single();
    setBlock(data ? (data as Block) : emptyBlock);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate for publish
      if (form.status === "PUBLISHED") {
        if (!form.seo_title || !form.seo_description || !form.category_id || !form.title || !form.slug || !form.price_fcfa) {
          toast({ title: "Validation", description: "Pour publier, remplissez tous les champs obligatoires (titre, slug, prix, catégorie, SEO).", variant: "destructive" });
          setSaving(false);
          return;
        }
      }

      const productData = {
        title: form.title, slug: form.slug, brand: form.brand,
        product_family: form.product_family, delivery_mode: form.delivery_mode,
        duration_months: form.duration_months, price_fcfa: form.price_fcfa,
        status: form.status, category_id: form.category_id || null,
        seo_title: form.seo_title || null, seo_description: form.seo_description || null,
        original_price_fcfa: form.original_price_fcfa || null,
        discount_percent: form.discount_percent || 0,
        supplier_url: form.supplier_url || null,
      };

      let productId: string;

      if (editing) {
        const { error } = await supabase.from("products").update(productData).eq("id", editing.id);
        if (error) throw error;
        productId = editing.id;
      } else {
        const { data, error } = await supabase.from("products").insert(productData).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      // Upsert block
      const { data: existingBlock } = await supabase
        .from("product_description_blocks")
        .select("id")
        .eq("product_id", productId)
        .single();

      const blockData = {
        product_id: productId,
        pitch: block.pitch || null, use_case: block.use_case || null,
        what_you_get: block.what_you_get || null, requirements: block.requirements || null,
        duration_and_renewal: block.duration_and_renewal || null,
        delivery_steps: block.delivery_steps || null,
        support_policy: block.support_policy || null, faq: block.faq || null,
      };

      if (existingBlock) {
        await supabase.from("product_description_blocks").update(blockData).eq("id", existingBlock.id);
      } else {
        await supabase.from("product_description_blocks").insert(blockData);
      }

      toast({ title: editing ? "Produit mis à jour" : "Produit créé" });
      setDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Produit supprimé" });
    fetchAll();
  };

  const statusColor: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PUBLISHED: "bg-success/10 text-success",
    ARCHIVED: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Produits ({products.length})</h2>
        <Button onClick={() => navigate("/admin/products/new")} className="gap-2"><Plus className="h-4 w-4" /> Nouveau</Button>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <Card key={p.id} className="card-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{p.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColor[p.status] || "bg-muted"}>{p.status}</Badge>
                  <span className="text-sm text-muted-foreground">{p.brand}</span>
                  <span className="price-tag text-sm">{p.price_fcfa.toLocaleString("fr-FR")} FCFA</span>
                  <SeoScore product={p as any} />
                  {(p as any).delivery_type === "KEY_STOCK" && (keyStockMap[p.id] || 0) < 3 && (
                    <Badge className="bg-warning/10 text-warning gap-1">
                      <AlertTriangle className="h-3 w-3" /> {keyStockMap[p.id] || 0} clés
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {(p as any).supplier_url && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a href={(p as any).supplier_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="text-primary"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Ouvrir fournisseur</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="core">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="core">Informations</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="blocks">Description</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="delivery">Livraison</TabsTrigger>
            </TabsList>

            <TabsContent value="core" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Titre *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Marque</Label>
                  <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Autodesk","Adobe","LinkedIn","Microsoft","Lumion","Other"].map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Catégorie</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Famille</Label>
                  <Select value={form.product_family} onValueChange={(v) => setForm({ ...form, product_family: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOFTWARE">Logiciel</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                      <SelectItem value="ACCOUNT">Compte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Livraison</Label>
                  <Select value={form.delivery_mode} onValueChange={(v) => setForm({ ...form, delivery_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTANT">Instantanée</SelectItem>
                      <SelectItem value="MANUAL">Manuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Brouillon</SelectItem>
                      <SelectItem value="PUBLISHED">Publié</SelectItem>
                      <SelectItem value="ARCHIVED">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Prix (FCFA) *</Label>
                  <Input type="number" value={form.price_fcfa} onChange={(e) => setForm({ ...form, price_fcfa: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Durée (mois)</Label>
                  <Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Prix original (FCFA)</Label>
                  <Input type="number" value={form.original_price_fcfa || ""} onChange={(e) => setForm({ ...form, original_price_fcfa: parseInt(e.target.value) || 0 })} placeholder="Avant réduction" />
                </div>
                <div className="space-y-1">
                  <Label>Réduction (%)</Label>
                  <Input type="number" min={0} max={100} value={form.discount_percent || ""} onChange={(e) => setForm({ ...form, discount_percent: parseInt(e.target.value) || 0 })} placeholder="0" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>🔗 Lien fournisseur (privé admin)</Label>
                <Input value={(form as any).supplier_url || ""} onChange={(e) => setForm({ ...form, supplier_url: e.target.value } as any)} placeholder="https://lien-vers-le-fournisseur..." />
                {(form as any).supplier_url && (
                  <a href={(form as any).supplier_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Ouvrir le lien fournisseur ↗</a>
                )}
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-3">
              <div className="space-y-1">
                <Label>Titre SEO {form.status === "PUBLISHED" && "*"}</Label>
                <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="Titre pour les moteurs de recherche" maxLength={60} />
                <p className="text-xs text-muted-foreground">{(form.seo_title || "").length}/60 caractères</p>
              </div>
              <div className="space-y-1">
                <Label>Description SEO {form.status === "PUBLISHED" && "*"}</Label>
                <Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder="Description pour les moteurs de recherche (max 160 caractères)" rows={3} maxLength={170} />
                <p className={`text-xs ${(form.seo_description || "").length > 160 ? "text-warning" : "text-muted-foreground"}`}>
                  {(form.seo_description || "").length}/170 caractères {(form.seo_description || "").length > 160 && "(recommandé < 160)"}
                </p>
              </div>
              <OgImageUpload
                value={(form as any).og_image_url || ""}
                onChange={(url) => setForm({ ...form, og_image_url: url } as any)}
                slug={form.slug}
              />
              {/* Google snippet preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Aperçu Google</p>
                <div className="rounded-lg border bg-card p-4 space-y-1">
                  <p className="text-sm text-info truncate">xaradeals.com › p › {form.slug || "..."}</p>
                  <p className="text-base font-medium text-primary truncate">{form.seo_title || form.title || "Titre du produit"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{form.seo_description || "Description du produit..."}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="blocks" className="space-y-3">
              {(["pitch", "use_case", "what_you_get", "requirements", "duration_and_renewal", "delivery_steps", "support_policy", "faq"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                  <Textarea
                    value={(block as any)[key] || ""}
                    onChange={(e) => setBlock({ ...block, [key]: e.target.value })}
                    rows={3}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="images" className="space-y-3">
              {editing ? (
                <ProductImageUpload productId={editing.id} />
              ) : (
                <p className="text-sm text-muted-foreground">Enregistrez d'abord le produit pour ajouter des images.</p>
              )}
            </TabsContent>

            <TabsContent value="delivery" className="space-y-3">
              {editing ? (
                <ProductDeliveryManager productId={editing.id} />
              ) : (
                <p className="text-sm text-muted-foreground">Enregistrez d'abord le produit pour configurer la livraison.</p>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
