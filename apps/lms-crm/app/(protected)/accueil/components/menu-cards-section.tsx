'use client';

import { useSession } from 'next-auth/react';
import { MenuCard, type MenuCardTone } from '@/components/common/menu-card';
import { useAppContext } from '@/lib/app-context';
import { crmPermissionForPath } from '@/config/menu-crm-access';
import { useTranslation } from '@/hooks/useTranslation';
import { sessionHasPermission } from '@/lib/auth/crm-permissions';
import { translateMenuTitle } from '@/lib/menu-i18n';
import { Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap,
  Users,
  Euro,
  MessageSquare,
  LifeBuoy,
  Shield,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

type AccueilCardDef = {
  moduleKey: string;
  path: string;
  descriptionKey: string;
  icon: LucideIcon;
  moduleCount: number;
  subSections: string[];
  subSectionPaths: string[];
  tone: MenuCardTone;
};

const ACCUEIL_CARDS: AccueilCardDef[] = [
  {
    moduleKey: 'pilotage-supervision',
    path: '/pilotage-supervision',
    descriptionKey: 'accueil.cards.pilotage-supervision',
    icon: TrendingUp,
    moduleCount: 1,
    subSections: ['pilotage'],
    subSectionPaths: ['/pilotage-supervision/pilotage'],
    tone: 'cyan',
  },
  {
    moduleKey: 'gestion-ressources',
    path: '/gestion-ressources',
    descriptionKey: 'accueil.cards.gestion-ressources',
    icon: Users,
    moduleCount: 3,
    subSections: ['compagnie', 'rh', 'equipements'],
    subSectionPaths: [
      '/gestion-ressources/compagnie',
      '/gestion-ressources/rh',
      '/gestion-ressources/equipements',
    ],
    tone: 'sky',
  },
  {
    moduleKey: 'gestion-academique',
    path: '/gestion-academique',
    descriptionKey: 'accueil.cards.gestion-academique',
    icon: GraduationCap,
    moduleCount: 1,
    subSections: ['vie-scolaire'],
    subSectionPaths: ['/gestion-academique/vie-scolaire'],
    tone: 'violet',
  },
  {
    moduleKey: 'administration-facturation',
    path: '/administration-facturation',
    descriptionKey: 'accueil.cards.administration-facturation',
    icon: Euro,
    moduleCount: 1,
    subSections: ['finance'],
    subSectionPaths: ['/administration-facturation/finance'],
    tone: 'emerald',
  },
  {
    moduleKey: 'communication-contenu',
    path: '/communication-contenu',
    descriptionKey: 'accueil.cards.communication-contenu',
    icon: MessageSquare,
    moduleCount: 3,
    subSections: ['cms', 'marketing', 'seo'],
    subSectionPaths: [
      '/communication-contenu/cms',
      '/communication-contenu/marketing',
      '/communication-contenu/seo',
    ],
    tone: 'fuchsia',
  },
  {
    moduleKey: 'support-qualite',
    path: '/support-qualite',
    descriptionKey: 'accueil.cards.support-qualite',
    icon: LifeBuoy,
    moduleCount: 2,
    subSections: ['support', 'qualite'],
    subSectionPaths: ['/support-qualite/support', '/support-qualite/qualite'],
    tone: 'orange',
  },
  {
    moduleKey: 'securite-configuration',
    path: '/securite-configuration',
    descriptionKey: 'accueil.cards.securite-configuration',
    icon: Shield,
    moduleCount: 3,
    subSections: ['acces', 'parametres', 'gouvernance-donnees'],
    subSectionPaths: [
      '/securite-configuration/acces',
      '/securite-configuration/parametres',
      '/securite-configuration/gouvernance-donnees',
    ],
    tone: 'indigo',
  },
];

function filterCardByPermissions(
  card: AccueilCardDef,
  session: ReturnType<typeof useSession>['data'],
): AccueilCardDef | null {
  const visibleIndices = card.subSectionPaths
    .map((subPath, index) => {
      const slug = crmPermissionForPath(subPath);
      if (!slug) return index;
      return sessionHasPermission(session, slug) ? index : -1;
    })
    .filter((index) => index >= 0);

  if (visibleIndices.length === 0) {
    const moduleSlug = crmPermissionForPath(card.path);
    if (moduleSlug && !sessionHasPermission(session, moduleSlug)) {
      return null;
    }
    if (!moduleSlug) return null;
  }

  return {
    ...card,
    subSections: visibleIndices.map((i) => card.subSections[i]),
    subSectionPaths: visibleIndices.map((i) => card.subSectionPaths[i]),
    moduleCount: visibleIndices.length || card.moduleCount,
  };
}

export const MenuCardsSection = () => {
  const { t } = useTranslation();
  const { isLoading } = useAppContext();
  const { data: session } = useSession();

  if (isLoading) {
    return (
      <div className="grid gap-5 lg:gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2 opacity-50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 mt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const menuItems = ACCUEIL_CARDS.map((card) => filterCardByPermissions(card, session)).filter(
    (card): card is AccueilCardDef => card !== null,
  );

  return (
    <div className="grid gap-5 lg:gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground">{t('accueil.menuCardsTitle')}</h2>
          <p className="text-muted-foreground">{t('accueil.menuCardsSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <MenuCard
                key={item.moduleKey}
                moduleKey={item.moduleKey}
                title={translateMenuTitle({ path: item.path, title: '' }, t)}
                description={t(item.descriptionKey)}
                icon={item.icon}
                path={item.path}
                badge={t('menuCard.modules', { count: item.moduleCount })}
                backgroundImage="bg-3"
                subSections={item.subSections}
                subSectionLabels={item.subSectionPaths.map((subPath) =>
                  translateMenuTitle({ path: subPath, title: '' }, t),
                )}
                tone={item.tone}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-warning/30 rounded-[2.5rem] bg-warning/5 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-5 rounded-3xl bg-warning/10 mb-6 border border-warning/20 shadow-xl shadow-warning/5 group-hover:scale-110 transition-transform duration-500">
                  <Lock className="size-12 text-warning animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight uppercase">
                  {t('accueil.noModulesTitle')}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
                  {t('accueil.noModulesDescription')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
