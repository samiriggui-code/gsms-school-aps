'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Equipment as Inventaire } from '@/app/models/equipment';
import { Upload } from './details/upload';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';
import { 
  FileText, 
  Upload as UploadIcon, 
  Trash2, 
  Download, 
  Loader2, 
  File as FileIcon,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@repo/ui/badge';

interface InventaireDetailsDocumentsProps {
  inventaire: Inventaire;
  companyProfile: any;
}

interface FileAsset {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  category: string | null;
}

export const InventaireDetailsDocuments = ({ inventaire }: InventaireDetailsDocumentsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch documents for this equipment
  const { data: documents, isLoading } = useQuery({
    queryKey: ['equipment-documents', inventaire.id],
    queryFn: async () => {
      const response = await apiFetch(`/api/common/files?module=gestion-ressources&entityType=equipment&entityId=${inventaire.id}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const result = await response.json();
      return result.data as FileAsset[];
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', 'gestion-ressources');
      formData.append('entityType', 'equipment');
      formData.append('entityId', inventaire.id);
      formData.append('visibility', 'PUBLIC');

      const response = await apiFetch('/api/common/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-documents', inventaire.id] });
      toast.success(t('documents.uploadAdded'));
    },
    onError: () => {
      toast.error(t('documents.uploadFailed'));
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate(file, {
        onSettled: () => setIsUploading(false)
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Documents & Fiches techniques</h3>
            <p className="text-xs text-muted-foreground">Gérez les manuels, certificats et garanties liés à cet équipement</p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              className="hidden"
              id="doc-upload-input"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label htmlFor="doc-upload-input">
              <Button size="sm" className="gap-2" asChild disabled={isUploading}>
                <span>
                  {isUploading ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                  Ajouter un document
                </span>
              </Button>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg border border-dashed animate-pulse bg-muted/20" />
            ))
          ) : documents && documents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="shadow-none border border-border/50 hover:border-border transition-colors bg-background overflow-hidden group">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                          {doc.mimeType.includes('pdf') ? (
                            <FileText className="size-5 text-red-500" />
                          ) : doc.mimeType.includes('image') ? (
                            <UploadIcon className="size-5 text-indigo-500" />
                          ) : (
                            <FileIcon className="size-5 text-primary" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                            {doc.originalName}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            <span>{formatSize(doc.size)}</span>
                            <span>•</span>
                            <span>Ajouté le {formatDateTime(new Date(doc.createdAt))}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Download className="size-4 text-muted-foreground" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/5">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-xl p-10 flex flex-col items-center text-center bg-muted/5">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="size-6 text-muted-foreground/60" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Aucun document</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Téléchargez les notices, certificats de conformité ou preuves de maintenance.
              </p>
              <label htmlFor="doc-upload-input" className="mt-4">
                <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild>
                  <span>
                    <UploadIcon className="size-3" />
                    Choisir un fichier
                  </span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
