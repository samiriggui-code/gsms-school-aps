'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, Loader2, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

import { Equipment as Inventaire } from '@/app/models/equipment';

export function Upload({ inventaire }: { inventaire: Inventaire }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(inventaire.avatar || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageChanged, setIsImageChanged] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsImageChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      
      const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire/${inventaire.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      toast.success("Image de l'équipement mise à jour avec succès");
      setIsImageChanged(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour de l'image");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-5">
      <div className="w-full h-[240px] bg-accent/70 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
        <div className="relative flex items-center justify-center w-full h-full">
          {selectedImage ? (
            <img src={selectedImage} alt={inventaire.name || ''} className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
                <Package className="size-[40px] text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground font-medium">Pas d'image</span>
            </div>
          )}
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="avatar-upload-input"
          />
          
          <div className="absolute bottom-3 right-3 flex gap-2">
            {isImageChanged && (
              <Button 
                size="sm" 
                variant="primary" 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                Enregistrer
              </Button>
            )}
            
            <label htmlFor="avatar-upload-input" className="cursor-pointer">
              <Button size="sm" variant="outline" className="bg-white/90 backdrop-blur pointer-events-none" asChild>
                <span>Upload</span>
              </Button>
            </label>
          </div>
        </div>
      </div>

        {/* Info Sections */}
        <div className="">
          {[
            { label: "Désignation", value: inventaire.label },
            { label: "N° de série", value: inventaire.serialNumber },
            { label: "Type", value: inventaire.type || '-' },
            { label: "Statut", value: inventaire.status },
            { label: "ID Équipement", value: inventaire.id.substring(0, 8) }
          ].map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-normal text-secondary-foreground/80">{item.label}</span>
                <span className="text-2sm font-semibold text-foreground">{item.value}</span>
              </div>
              {index < 4 && <Separator className="my-2.5 opacity-50" />}
            </div>
          ))}
        </div>
    </div>
  );
}   
