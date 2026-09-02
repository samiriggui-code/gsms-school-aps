'use client';

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { UserIcon, Loader2, Check } from "lucide-react";
import { Separator } from "@repo/ui/separator";
import Link from 'next/link'; 
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

import { User as Conformite } from "@/app/models/user";

export function Upload({ conformite }: { conformite: Conformite }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(conformite.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageChanged, setIsImageChanged] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsImageChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedImage) return;
    
    setIsSaving(true);
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/conformite/${conformite.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: selectedImage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }

      toast.success("Avatar mis à jour avec succès");
      setIsImageChanged(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour de l'avatar");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-5">
      <div className="w-full h-[240px] bg-accent/70 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
        <div className="relative flex items-center justify-center w-full h-full">
          {selectedImage ? (
            <img src={selectedImage} alt={conformite.name || ''} className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
                <UserIcon className="size-[40px] text-muted-foreground/60" />
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
          { label: "Nom complet", value: conformite.name },
          { label: "Email", value: conformite.email },
          { label: "Catégorie", value: conformite.userCategory },
          { label: "Fonction", value: conformite.jobFunction || '-' },
          { label: "ID Conformite", value: conformite.id.substring(0, 8) }
        ].map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-normal text-secondary-foreground/80">{item.label}</span>
              {item.label === "Email" ? (
                <Link
                  href={`mailto:${item.value}`}
                  className="text-2sm font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[150px]"
                >
                  {item.value || ''}
                </Link>
              ) : (
                <span className="text-2sm font-semibold text-foreground">{item.value}</span>
              )}
            </div>
            {index < 4 && <Separator className="my-2.5 opacity-50" />}
          </div>
        ))}
      </div>
    </div>
  );
}   
