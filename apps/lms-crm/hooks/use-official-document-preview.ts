'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type {
  OfficialExportPreviewRequest,
  OfficialExportTemplateKey,
} from '@/lib/official-export/types';

type OpenOptions = {
  templateKey: OfficialExportTemplateKey;
  userId: string;
  options?: OfficialExportPreviewRequest['options'];
  /** false = aperçu sans dialogue d'impression */
  autoPrint?: boolean;
};

export function useOfficialDocumentPreview() {
  const [isOpening, setIsOpening] = useState(false);

  const openPreview = useCallback(async ({ templateKey, userId, options, autoPrint = true }: OpenOptions) => {
    setIsOpening(true);
    try {
      const response = await apiFetch('/api/common/export/official-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey,
          userId,
          options,
          print: autoPrint,
        }),
      });

      if (!response.ok) {
        throw new Error('preview_failed');
      }

      const json = (await response.json()) as { data?: { previewUrl?: string } };
      const previewUrl = json.data?.previewUrl;
      if (!previewUrl) {
        throw new Error('preview_failed');
      }

      const url = autoPrint ? previewUrl : `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}print=0`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error("Impossible d'ouvrir le document officiel.");
    } finally {
      setIsOpening(false);
    }
  }, []);

  return { openPreview, isOpening };
}
