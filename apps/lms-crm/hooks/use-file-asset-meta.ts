'use client';

import { useState } from 'react';
import type { FileAssetMetaInput } from '@/components/governance/file-asset-meta-sheet';

/**
 * Hook pour ouvrir le sheet de métadonnées documents après un upload.
 *
 * Exemple :
 *   const { metaSheetProps, openMeta } = useFileAssetMeta({ onAllSaved: refetch });
 *   // après mutation réussie :
 *   openMeta([{ fileAssetId, fileName, label }, ...]);
 *   // dans le JSX :
 *   <FileAssetMetaSheet {...metaSheetProps} />
 */
export function useFileAssetMeta(options?: { onAllSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<FileAssetMetaInput[]>([]);

  function openMeta(inputs: FileAssetMetaInput[]) {
    if (!inputs.length) return;
    setAssets(inputs);
    setOpen(true);
  }

  const metaSheetProps = {
    open,
    onOpenChange: (v: boolean) => setOpen(v),
    assets,
    onAllSaved: () => {
      options?.onAllSaved?.();
    },
  };

  return { metaSheetProps, openMeta };
}
