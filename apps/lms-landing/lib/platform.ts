'use client';

import { useEffect, useState } from 'react';

/** iPhone / iPad Safari (incl. iPadOS avec userAgent desktop) */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function useIsIOS(): boolean {
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setIos(isIOSDevice());
  }, []);
  return ios;
}

export function isFormFieldFocused(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
