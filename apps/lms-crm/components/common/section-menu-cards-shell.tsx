'use client';

import type { LucideIcon } from 'lucide-react';
import { MenuCard, menuCardPagesBadge, type MenuCardTone } from '@/components/common/menu-card';
import { useTranslation } from '@/hooks/useTranslation';
import { translateMenuTitle } from '@/lib/menu-i18n';

export type SectionMenuCardItem = {
  moduleKey: string;
  path: string;
  descriptionKey: string;
  icon: LucideIcon;
  backgroundImage: string;
  subSections: string[];
  subSectionLabels?: string[];
  tone: MenuCardTone;
  badgeCount?: number;
};

type SectionMenuCardsShellProps = {
  titleKey: string;
  subtitleKey: string;
  subtitleValues?: Record<string, string | number>;
  items: SectionMenuCardItem[];
};

export function SectionMenuCardsShell({
  titleKey,
  subtitleKey,
  subtitleValues,
  items,
}: SectionMenuCardsShellProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-5 lg:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">{t(titleKey)}</h2>
        <p className="text-muted-foreground">{t(subtitleKey, subtitleValues)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8">
        {items.map((item) => (
          <MenuCard
            key={item.moduleKey}
            moduleKey={item.moduleKey}
            title={translateMenuTitle({ path: item.path, title: '' }, t)}
            description={t(item.descriptionKey)}
            icon={item.icon}
            path={item.path}
            badge={menuCardPagesBadge(item.badgeCount ?? item.subSections.length)}
            backgroundImage={item.backgroundImage}
            subSections={item.subSections}
            subSectionLabels={item.subSectionLabels}
            tone={item.tone}
          />
        ))}
      </div>
    </div>
  );
}
