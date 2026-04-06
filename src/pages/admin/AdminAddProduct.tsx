import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { generateSlug } from "@/lib/slug-utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Globe, Eye } from "lucide-react";
import OgImageUpload from "@/components/admin/OgImageUpload";

const BRANDS = ["Autodesk", "Adobe", "LinkedIn", "Microsoft", "Lumion", "Other"] as const;
const FAMILIES = [
  { value: "SOFTWARE", label: "Logiciel" },
  { value: "SUBSCRIPTION", label: "Abonnement" },
  { value: "ACCOUNT", label: "Compte" },
] as const;
const DELIVERY_MODES = [
  { value: "INSTANT", label: "Instantanée" },
  { value: "MANUAL", label: "Manuelle" },
] as const;
const STATUSES = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "PUBLISHED", label: "Publié" },
  { value: "ARCHIVED", label: "Archivé" },
] as const;

const BLOCK_FIELDS = [
  { key: "pitch", label: "Pitch", required: true, type: "input" as const },
  { key: "use_case", label: "Cas d'utilisation", required: false, type: "textarea" as const },
  { key: "what_you_get", label: "Ce que vous obtenez", required: false, type: "textarea" as const },
  { key: "requirements", label: "Pré-requis", required: false, type: "textarea" as const },
  { key: "duration_and_renewal", label: "Durée et renouvellement", required: false, type: "textarea" as const },
  { key: "delivery_steps", label: "Étapes de livraison", required: false, type: "textarea" as const },
  { key: "support_policy", label: "Politique de support", required: false, type: "textarea" as const },
  { key: "faq", label: "FAQ", required: false, type: "textarea" as const },
] as const;

type Category = { id: string; name: string };

type FormCore = {
  title: string;
  slug: string;
  brand: string;
  product_family: string;
  delivery_mode: string;
  duration_months: number;
  price_fcfa: number;
  category_id: string;
  status: string;
  delivery_delay: string;
};

type FormSeo = {
  seo_title: string;
  seo_description: string;
  og_image_url: string;
};

type FormBlocks = Record<string, string>;

const STEP_LABELS = ["Informations", "SEO", "Description"];

export default function AdminAddProduct() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slugManual, setSlugManual] = useState(false);

  const [core, setCore] = useState<FormCore>({
    title: "", slug: "", brand: "Other", product_family: "SOFTWARE",
    delivery_mode: "INSTANT", duration_months: 0, price_fcfa: 0,
    category_id: "", status: "DRAFT", delivery_delay: "",
  });

  const [seo, setSeo] = useState<FormSeo>({
    seo_title: "", seo_description: "", og_image_url: "",
  });

  const [blocks, setBlocks] = useState<FormBlocks>({
    pitch: "", use_case: "", what_you_get: "", requirements: "",
    duration_and_renewal: "", delivery_steps: "", support_policy: "", faq: "",
  });

  // Redirect non-admin
  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/", { replace: true });
  }, [authLoading, isAdmin, navigate]);

  // Fetch categories
  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual) {
      setCore((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [core.title, slugManual]);

  // Validation
  const publishErrors = useMemo(() => {
    const errs: string[] = [];
    if (!core.title.trim()) errs.push("Titre manquant");
    if (!core.slug.trim()) errs.push("Slug manquant");
    if (core.price_fcfa <= 0) errs.push("Prix invalide");
    if (!core.category_id) errs.push("Catégorie manquante");
    if (!seo.seo_title.trim()) errs.push("Titre SEO manquant");
    if (!seo.seo_description.trim()) errs.push("Description SEO manquante");
    if (!blocks.pitch.trim()) errs.push("Pitch manquant");
    return errs;
  }, [core, seo, blocks]);

  const coreErrors = useMemo(() => {
    const errs: string[] = [];
    if (!core.title.trim()) errs.push("Le titre est requis");
    if (!core.slug.trim()) errs.push("Le slug est requis");
    if (core.price_fcfa <= 0) errs.push("Le prix doit être supérieur à 0");
    return errs;
  }, [core]);

  const canProceedStep0 = coreErrors.length === 0;
  const canSubmit = core.status === "PUBLISHED" ? publishErrors.length === 0 : coreErrors.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);

    try {
      // Check slug uniqueness server-side
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", core.slug)
        .maybeSingle();

      if (existing) {
        toast({ title: "Erreur", description: "Ce slug existe déjà. Veuillez en choisir un autre.", variant: "destructive" });
        setSaving(false);
        setStep(0);
        return;
      }

      // Insert product
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          title: core.title.trim(),
          slug: core.slug.trim(),
          brand: core.brand,
          product_family: core.product_family,
          delivery_mode: core.delivery_mode,
          duration_months: core.duration_months,
          price_fcfa: core.price_fcfa,
          category_id: core.category_id || null,
          status: core.status,
          seo_title: seo.seo_title.trim() || null,
          seo_description: seo.seo_description.trim() || null,
          og_image_url: seo.og_image_url.trim() || null,
          delivery_delay: core.delivery_delay.trim() || null,
        })
        .select("id")
        .single();

      if (productError) throw productError;

      // Insert description blocks
      const { error: blockError } = await supabase
        .from("product_description_blocks")
        .insert({
          product_id: product.id,
          pitch: blocks.pitch.trim() || null,
          use_case: blocks.use_case.trim() || null,
          what_you_get: blocks.what_you_get.trim() || null,
          requirements: blocks.requirements.trim() || null,
          duration_and_renewal: blocks.duration_and_renewal.trim() || null,
          delivery_steps: blocks.delivery_steps.trim() || null,
          support_policy: blocks.support_policy.trim() || null,
          faq: blocks.faq.trim() || null,
        });

      if (blockError) {
        // Rollback: delete the product
        await supabase.from("products").delete().eq("id", product.id);
        throw blockError;
      }

      toast({ title: "Produit créé avec succès !" });
      navigate("/admin");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (authLoading) return null;

  const progress = ((step + 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-heading font-bold">Nouveau produit</h1>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => (i <= step || canProceedStep0) && setStep(i)}
                className={`transition-colors ${i === step ? "font-semibold text-primary" : i < step ? "text-foreground" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 0: Core */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations du produit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titre *</Label>
                <Input
                  value={core.title}
                  onChange={(e) => setCore({ ...core, title: e.target.value })}
                  placeholder="Ex: AutoCAD 2025 - Licence 1 an"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Slug *</Label>
                  <button
                    type="button"
                    onClick={() => setSlugManual(!slugManual)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {slugManual ? "Auto-générer" : "Modifier manuellement"}
                  </button>
                </div>
                <Input
                  value={core.slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setCore({ ...core, slug: e.target.value });
                  }}
                  disabled={!slugManual}
                  className="font-mono text-sm"
                />
                {core.slug && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" /> /p/{core.slug}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Marque *</Label>
                  <Select value={core.brand} onValueChange={(v) => setCore({ ...core, brand: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Catégorie</Label>
                  <Select value={core.category_id} onValueChange={(v) => setCore({ ...core, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Famille</Label>
                  <Select value={core.product_family} onValueChange={(v) => setCore({ ...core, product_family: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FAMILIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Livraison</Label>
                  <Select value={core.delivery_mode} onValueChange={(v) => setCore({ ...core, delivery_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DELIVERY_MODES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <Select value={core.status} onValueChange={(v) => setCore({ ...core, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prix (FCFA) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={core.price_fcfa || ""}
                    onChange={(e) => setCore({ ...core, price_fcfa: parseInt(e.target.value) || 0 })}
                    placeholder="Ex: 15000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Durée (mois)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={core.duration_months}
                    onChange={(e) => setCore({ ...core, duration_months: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>⏱️ Délai de livraison</Label>
                <Input
                  value={core.delivery_delay}
                  onChange={(e) => setCore({ ...core, delivery_delay: e.target.value })}
                  placeholder="Ex: Instant, 1-2h, 24h, 48h..."
                />
                <p className="text-xs text-muted-foreground">Visible par les clients sur la fiche produit</p>
              </div>

              {coreErrors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                  {coreErrors.map((e) => (
                    <p key={e} className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {e}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep(1)} disabled={!canProceedStep0}>
                  Suivant <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: SEO */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Référencement SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titre SEO {core.status === "PUBLISHED" && "*"}</Label>
                <Input
                  value={seo.seo_title}
                  onChange={(e) => setSeo({ ...seo, seo_title: e.target.value })}
                  placeholder="Titre pour les moteurs de recherche"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{seo.seo_title.length}/60 caractères</p>
              </div>

              <div className="space-y-1.5">
                <Label>Description SEO {core.status === "PUBLISHED" && "*"}</Label>
                <Textarea
                  value={seo.seo_description}
                  onChange={(e) => setSeo({ ...seo, seo_description: e.target.value })}
                  placeholder="Description pour les moteurs de recherche (max 160 caractères)"
                  rows={3}
                  maxLength={170}
                />
                <p className={`text-xs ${seo.seo_description.length > 160 ? "text-warning" : "text-muted-foreground"}`}>
                  {seo.seo_description.length}/170 caractères {seo.seo_description.length > 160 && "(recommandé < 160)"}
                </p>
              </div>

              <OgImageUpload
                value={seo.og_image_url}
                onChange={(url) => setSeo({ ...seo, og_image_url: url })}
                slug={core.slug}
              />

              {/* Google snippet preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Eye className="h-4 w-4" /> Aperçu Google
                </div>
                <div className="rounded-lg border bg-card p-4 space-y-1">
                  <p className="text-sm text-info truncate">
                    xaradeals.com › p › {core.slug || "..."}
                  </p>
                  <p className="text-base font-medium text-primary truncate">
                    {seo.seo_title || core.title || "Titre du produit"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {seo.seo_description || "Description du produit..."}
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Retour
                </Button>
                <Button onClick={() => setStep(2)}>
                  Suivant <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Description Blocks */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description structurée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {BLOCK_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>
                    {field.label} {field.required && "*"}
                  </Label>
                  {field.type === "input" ? (
                    <Input
                      value={blocks[field.key] || ""}
                      onChange={(e) => setBlocks({ ...blocks, [field.key]: e.target.value })}
                      placeholder={`Saisissez le ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <Textarea
                      value={blocks[field.key] || ""}
                      onChange={(e) => setBlocks({ ...blocks, [field.key]: e.target.value })}
                      rows={3}
                      placeholder={`Saisissez ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}

              {/* Validation summary for PUBLISHED */}
              {core.status === "PUBLISHED" && publishErrors.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="h-4 w-4" /> Publication bloquée
                  </p>
                  {publishErrors.map((e) => (
                    <p key={e} className="text-sm text-muted-foreground">• {e}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Retour
                </Button>
                <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
                  {saving ? "Enregistrement..." : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      {core.status === "PUBLISHED" ? "Publier" : "Enregistrer"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
