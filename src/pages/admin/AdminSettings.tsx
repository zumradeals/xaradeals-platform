import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SETTINGS_KEYS = [
  "whatsapp_group_url",
  "whatsapp_direct_number",
  "contact_email",
  "contact_phone",
  "address",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "twitter_url",
] as const;

export default function AdminSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSetting();

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      SETTINGS_KEYS.forEach((k) => { map[k] = settings[k] || ""; });
      setValues(map);
    }
  }, [settings]);

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await Promise.all(
        SETTINGS_KEYS.map((key) =>
          update.mutateAsync({ key, value: values[key] ?? "" })
        )
      );
      toast({ title: "Paramètres enregistrés ✓" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer", variant: "destructive" });
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Email de contact" value={values.contact_email} onChange={(v) => set("contact_email", v)} placeholder="support@xaradeals.com" />
          <Field label="Téléphone" value={values.contact_phone} onChange={(v) => set("contact_phone", v)} placeholder="+225 0718713781" />
          <Field label="Adresse" value={values.address} onChange={(v) => set("address", v)} placeholder="Abidjan, Côte d'Ivoire" />
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Numéro WhatsApp (chat direct)</Label>
            <Input value={values.whatsapp_direct_number} onChange={(e) => set("whatsapp_direct_number", e.target.value)} placeholder="2250718713781" />
            <p className="text-xs text-muted-foreground">Format international sans + ni espaces</p>
          </div>
          <div className="space-y-2">
            <Label>Lien du groupe / canal WhatsApp</Label>
            <Input value={values.whatsapp_group_url} onChange={(e) => set("whatsapp_group_url", e.target.value)} placeholder="https://chat.whatsapp.com/..." />
            <p className="text-xs text-muted-foreground">Laissez vide pour masquer le bouton groupe.</p>
            {values.whatsapp_group_url && (
              <a href={values.whatsapp_group_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> Tester le lien
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Réseaux sociaux */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Réseaux sociaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Facebook" value={values.facebook_url} onChange={(v) => set("facebook_url", v)} placeholder="https://facebook.com/xaradeals" />
          <Field label="Instagram" value={values.instagram_url} onChange={(v) => set("instagram_url", v)} placeholder="https://instagram.com/xaradeals" />
          <Field label="TikTok" value={values.tiktok_url} onChange={(v) => set("tiktok_url", v)} placeholder="https://tiktok.com/@xaradeals" />
          <Field label="X (Twitter)" value={values.twitter_url} onChange={(v) => set("twitter_url", v)} placeholder="https://x.com/xaradeals" />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={update.isPending} className="gap-2">
        <Save className="h-4 w-4" /> Enregistrer tous les paramètres
      </Button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
