import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 630;
const QUALITY = 0.85;

function compressOgImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression échouée"))),
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = URL.createObjectURL(file);
  });
}

type Props = {
  value: string;
  onChange: (url: string) => void;
  slug?: string;
};

export default function OgImageUpload({ value, onChange, slug }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">(value && value.startsWith("http") ? "url" : "upload");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await compressOgImage(file);
      const fileName = `og/${slug || "product"}-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("product_images")
        .upload(fileName, compressed, { contentType: "image/webp", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product_images")
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
      toast({ title: "Image OG uploadée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Image OG</Label>
        <button
          type="button"
          onClick={() => setMode(mode === "upload" ? "url" : "upload")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          {mode === "upload" ? (
            <><LinkIcon className="h-3 w-3" /> Saisir une URL</>
          ) : (
            <><Upload className="h-3 w-3" /> Uploader un fichier</>
          )}
        </button>
      </div>

      {mode === "url" ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex-1"
            >
              {uploading ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Upload en cours...</>
              ) : (
                <><Upload className="mr-1.5 h-4 w-4" /> Choisir une image</>
              )}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      )}

      {value && (
        <div className="rounded-lg border overflow-hidden">
          <img
            src={value}
            alt="Aperçu OG"
            className="w-full h-auto max-h-40 object-cover"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Format recommandé : 1200×630 px pour un affichage optimal sur les réseaux sociaux.
      </p>
    </div>
  );
}
