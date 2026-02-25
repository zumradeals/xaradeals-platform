import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, GripVertical, Loader2 } from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  storage_path: string;
  position: number;
  alt_text: string | null;
};

interface ProductImageUploadProps {
  productId: string;
}

export default function ProductImageUpload({ productId }: ProductImageUploadProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("position");
    if (data) setImages(data as ProductImage[]);
    setLoading(false);
  };

  useEffect(() => {
    if (productId) fetchImages();
  }, [productId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const maxPosition = images.length > 0 ? Math.max(...images.map((i) => i.position)) : -1;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const path = `${productId}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("product_images")
          .upload(path, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product_images")
          .getPublicUrl(path);

        const { error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            url: urlData.publicUrl,
            storage_path: path,
            position: maxPosition + 1 + i,
          });

        if (insertError) throw insertError;
      }

      toast({ title: `${files.length} image(s) ajoutée(s)` });
      fetchImages();
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploading(false);
    // Reset input
    e.target.value = "";
  };

  const handleDelete = async (image: ProductImage) => {
    try {
      await supabase.storage.from("product_images").remove([image.storage_path]);
      await supabase.from("product_images").delete().eq("id", image.id);
      toast({ title: "Image supprimée" });
      fetchImages();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;

    const updated = [...images];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update positions
    const promises = updated.map((img, i) =>
      supabase.from("product_images").update({ position: i }).eq("id", img.id)
    );
    await Promise.all(promises);
    fetchImages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Images ({images.length})</p>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" className="gap-1.5" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? "Upload..." : "Ajouter"}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {images.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucune image. Cliquez sur "Ajouter" pour uploader.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, index) => (
          <Card key={img.id} className="group relative overflow-hidden">
            <img
              src={img.url}
              alt={img.alt_text || "Product image"}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                {index > 0 && (
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => moveImage(index, -1)}>
                    <GripVertical className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleDelete(img)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {index === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Principale
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
