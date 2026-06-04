'use client';

import { useCallback, useRef, useState } from 'react';

export function useCopyToClipboard(resetMs = 2000) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = useCallback(
    async (text: string) => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setIsCopied(false), resetMs);
        return true;
      } catch {
        setIsCopied(false);
        return false;
      }
    },
    [resetMs],
  );

  return { copyToClipboard, isCopied };
}
