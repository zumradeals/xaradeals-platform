import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, ExternalLink } from "lucide-react";

export default function AdminSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSetting();

  const [whatsappGroup, setWhatsappGroup] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (settings) {
      setWhatsappGroup(settings.whatsapp_group_url || "");
      setWhatsappNumber(settings.whatsapp_direct_number || "");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await Promise.all([
        update.mutateAsync({ key: "whatsapp_group_url", value: whatsappGroup }),
        update.mutateAsync({ key: "whatsapp_direct_number", value: whatsappNumber }),
      ]);
      toast({ title: "Paramètres enregistrés" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer", variant: "destructive" });
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold mb-4">WhatsApp</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Numéro WhatsApp (chat direct)</Label>
            <Input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="2250718713781"
            />
            <p className="text-xs text-muted-foreground">Format international sans + ni espaces</p>
          </div>
          <div className="space-y-2">
            <Label>Lien du groupe / canal WhatsApp</Label>
            <Input
              value={whatsappGroup}
              onChange={(e) => setWhatsappGroup(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Les visiteurs verront un bouton pour rejoindre le groupe.
              Laissez vide pour masquer le bouton groupe.
            </p>
            {whatsappGroup && (
              <a href={whatsappGroup} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> Tester le lien
              </a>
            )}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={update.isPending} className="gap-2">
        <Save className="h-4 w-4" /> Enregistrer
      </Button>
    </div>
  );
}
