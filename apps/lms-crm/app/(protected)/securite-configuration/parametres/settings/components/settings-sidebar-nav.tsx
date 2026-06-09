'use client';

import { ScrollspyMenu } from '@/partials/navbar/scrollspy-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { SETTINGS_SCROLLSPY_ITEMS } from '../lib/settings-anchors';

export function SettingsSidebarNav({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();

  const items = SETTINGS_SCROLLSPY_ITEMS.map((item) => ({
    title: t(item.titleKey),
    target: item.target,
    active: 'active' in item ? item.active : undefined,
  }));

  return (
    <div className={cn(className)} key={i18n.language}>
      <ScrollspyMenu items={items} />
    </div>
  );
}
