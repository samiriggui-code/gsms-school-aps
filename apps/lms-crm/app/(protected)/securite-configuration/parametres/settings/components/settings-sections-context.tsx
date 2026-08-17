'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  SETTINGS_ANCHOR_IDS,
  type SettingsAnchorId,
} from '../lib/settings-anchors';

type SettingsSectionsContextValue = {
  isOpen: (id: SettingsAnchorId) => boolean;
  toggle: (id: SettingsAnchorId) => void;
  open: (id: SettingsAnchorId) => void;
};

const SettingsSectionsContext = createContext<SettingsSectionsContextValue | null>(null);

const ALL_ANCHOR_IDS = new Set<string>(Object.values(SETTINGS_ANCHOR_IDS));

function isSettingsAnchor(id: string): id is SettingsAnchorId {
  return ALL_ANCHOR_IDS.has(id);
}

export function SettingsSectionsProvider({
  children,
  defaultOpen = [SETTINGS_ANCHOR_IDS.general],
}: {
  children: ReactNode;
  defaultOpen?: SettingsAnchorId[];
}) {
  const [openSections, setOpenSections] = useState<Set<SettingsAnchorId>>(
    () => new Set(defaultOpen),
  );

  const openFromHash = useCallback((hash: string) => {
    const id = hash.replace('#', '').trim();
    if (!isSettingsAnchor(id)) return;
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    openFromHash(window.location.hash);
    const onHashChange = () => openFromHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [openFromHash]);

  const isOpen = useCallback(
    (id: SettingsAnchorId) => openSections.has(id),
    [openSections],
  );

  const toggle = useCallback((id: SettingsAnchorId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const open = useCallback((id: SettingsAnchorId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isOpen, toggle, open }),
    [isOpen, toggle, open],
  );

  return (
    <SettingsSectionsContext.Provider value={value}>
      {children}
    </SettingsSectionsContext.Provider>
  );
}

export function useSettingsSections() {
  const ctx = useContext(SettingsSectionsContext);
  if (!ctx) {
    throw new Error('useSettingsSections must be used within SettingsSectionsProvider');
  }
  return ctx;
}
