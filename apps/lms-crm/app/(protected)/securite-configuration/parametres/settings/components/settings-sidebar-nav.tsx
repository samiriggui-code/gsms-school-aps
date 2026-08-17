'use client';

import { ScrollspyMenu } from '@/partials/navbar/scrollspy-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { SETTINGS_SCROLLSPY_GROUPS } from '../lib/settings-anchors';

function translateLabel(
  t: (key: string, options?: { defaultValue?: string }) => string,
  titleKey: string,
  titleFallback: string,
) {
  const translated = t(titleKey, { defaultValue: titleFallback });
  return translated === titleKey ? titleFallback : translated;
}

export function SettingsSidebarNav({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();

  const items = SETTINGS_SCROLLSPY_GROUPS.map((group) => ({
    title: translateLabel(t, group.titleKey, group.titleFallback),
    children: group.items.map((item) => ({
      title: translateLabel(t, item.titleKey, item.titleFallback),
      target: item.target,
      active: item.active,
    })),
  }));

  return (
    <div className={cn(className)} key={i18n.language}>
      <ScrollspyMenu items={items} />
    </div>
  );
}
