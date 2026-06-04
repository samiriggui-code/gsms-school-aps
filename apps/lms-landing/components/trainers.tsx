'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Linkedin,
  Globe,
  Award,
  BookOpen,
  Users,
  Shield,
  Flame,
  HeartPulse,
  GraduationCap,
  Library,
  ClipboardList,
  UserCog,
  Handshake,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const avatar = (n: number) => `/media/avatars/300-${n}.png`;
const AVATAR_FALLBACK = '/media/avatars/blank.png';

type TrainerId =
  | 'laurent-dubois'
  | 'sandrine-moreau'
  | 'marc-perrin'
  | 'nadia-khelifi'
  | 'jean-claude-renard'
  | 'olivier-gauthier'
  | 'claire-fontaine'
  | 'thomas-leroy'
  | 'emilie-bernard'
  | 'karim-benali'
  | 'julie-marchand'
  | 'philippe-garnier';

type TrainerMeta = {
  image: string;
  statA: number;
  statB: number;
  rating: number;
  badge: React.ElementType;
  socials: { linkedin: string; website: string };
};

const TRAINER_META: Record<TrainerId, TrainerMeta> = {
  'laurent-dubois': { image: avatar(1), statA: 12, statB: 1800, rating: 4.9, badge: Shield, socials: { linkedin: '#', website: '#' } },
  'sandrine-moreau': { image: avatar(2), statA: 10, statB: 2200, rating: 4.9, badge: Flame, socials: { linkedin: '#', website: '#' } },
  'marc-perrin': { image: avatar(3), statA: 14, statB: 3100, rating: 4.8, badge: HeartPulse, socials: { linkedin: '#', website: '#' } },
  'nadia-khelifi': { image: avatar(4), statA: 8, statB: 950, rating: 4.8, badge: HeartPulse, socials: { linkedin: '#', website: '#' } },
  'jean-claude-renard': { image: avatar(5), statA: 11, statB: 1650, rating: 4.7, badge: Flame, socials: { linkedin: '#', website: '#' } },
  'olivier-gauthier': { image: avatar(6), statA: 9, statB: 1200, rating: 4.9, badge: Shield, socials: { linkedin: '#', website: '#' } },
  'claire-fontaine': { image: avatar(7), statA: 28, statB: 420, rating: 4.9, badge: GraduationCap, socials: { linkedin: '#', website: '#' } },
  'thomas-leroy': { image: avatar(8), statA: 140, statB: 85, rating: 4.8, badge: Library, socials: { linkedin: '#', website: '#' } },
  'emilie-bernard': { image: avatar(9), statA: 24, statB: 96, rating: 4.9, badge: ClipboardList, socials: { linkedin: '#', website: '#' } },
  'karim-benali': { image: avatar(10), statA: 45, statB: 320, rating: 4.8, badge: UserCog, socials: { linkedin: '#', website: '#' } },
  'julie-marchand': { image: avatar(11), statA: 180, statB: 98, rating: 4.9, badge: Handshake, socials: { linkedin: '#', website: '#' } },
  'philippe-garnier': { image: avatar(12), statA: 85, statB: 4.7, rating: 4.7, badge: Building2, socials: { linkedin: '#', website: '#' } },
};

const VOLETS = [
  { id: 'formateur' as const, trainerIds: ['laurent-dubois', 'sandrine-moreau', 'marc-perrin', 'nadia-khelifi', 'jean-claude-renard', 'olivier-gauthier'] as TrainerId[] },
  { id: 'pedagogique' as const, trainerIds: ['claire-fontaine', 'thomas-leroy', 'emilie-bernard'] as TrainerId[] },
  { id: 'rh' as const, trainerIds: ['karim-benali', 'julie-marchand', 'philippe-garnier'] as TrainerId[] },
];

function StatBadge({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0 text-indigo-500" />
      <span className="font-semibold text-foreground tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="leading-tight">{label}</span>
    </div>
  );
}

function TrainerCard({ trainerId }: { trainerId: TrainerId }) {
  const { t } = useTranslation();
  const meta = TRAINER_META[trainerId];
  const BadgeIcon = meta.badge;
  const [imageSrc, setImageSrc] = useState(meta.image);
  const name = t(`landing.trainers.cards.${trainerId}.name`);

  return (
    <div className="group relative bg-background border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <div className="size-14 rounded-lg overflow-hidden ring-2 ring-indigo-100 dark:ring-indigo-900 group-hover:ring-indigo-300 dark:group-hover:ring-indigo-700 transition-all">
            <Image
              src={imageSrc}
              alt={name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              onError={() => setImageSrc(AVATAR_FALLBACK)}
            />
          </div>
          <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-1">
            <BadgeIcon className="size-3" />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">{name}</h3>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {t(`landing.trainers.cards.${trainerId}.title`)}
          </p>
        </div>
      </div>
      <p className="text-xs font-medium text-indigo-500/80 dark:text-indigo-400/80 bg-indigo-50 dark:bg-indigo-950/40 rounded-md px-2.5 py-1 mb-3 inline-block">
        {t(`landing.trainers.cards.${trainerId}.certifications`)}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        {t(`landing.trainers.cards.${trainerId}.bio`)}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 pb-5 border-b border-border">
        <StatBadge icon={BookOpen} value={meta.statA} label={t(`landing.trainers.cards.${trainerId}.labelA`)} />
        <StatBadge icon={Users} value={meta.statB} label={t(`landing.trainers.cards.${trainerId}.labelB`)} />
        <StatBadge icon={Award} value={meta.rating} label={t('landing.trainers.ratingLabel')} />
      </div>
      <div className="flex items-center gap-2">
        <a
          href={meta.socials.linkedin}
          className="inline-flex items-center justify-center size-8 rounded-lg bg-muted/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          aria-label={t('landing.trainers.linkedinAria', { name })}
        >
          <Linkedin className="size-4" />
        </a>
        <a
          href={meta.socials.website}
          className="inline-flex items-center justify-center size-8 rounded-lg bg-muted/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          aria-label={t('landing.trainers.websiteAria', { name })}
        >
          <Globe className="size-4" />
        </a>
      </div>
    </div>
  );
}

const VOLET_FROM_HASH: Record<string, (typeof VOLETS)[number]['id']> = {
  '#trainers': 'formateur',
  '#trainers-formateur': 'formateur',
  '#trainers-pedagogique': 'pedagogique',
  '#trainers-rh': 'rh',
};

export default function Trainers() {
  const { t } = useTranslation();
  const [volet, setVolet] = useState<(typeof VOLETS)[number]['id']>('formateur');

  useEffect(() => {
    const syncVoletFromHash = () => {
      const next = VOLET_FROM_HASH[window.location.hash];
      if (next) setVolet(next);
    };
    syncVoletFromHash();
    window.addEventListener('hashchange', syncVoletFromHash);
    return () => window.removeEventListener('hashchange', syncVoletFromHash);
  }, []);

  const active = VOLETS.find((v) => v.id === volet) ?? VOLETS[0];

  return (
    <section id="trainers" className="py-20 lg:py-28 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block text-sm font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-3">
            {t('landing.trainers.badge')}
          </span>
          <h2 className="mb-5 text-3xl font-bold text-foreground lg:text-5xl">{t('landing.trainers.title')}</h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{t('landing.trainers.subtitle')}</p>
        </div>

        <div className="flex justify-center mb-12">
          <div
            className="inline-flex w-full max-w-3xl rounded-full bg-zinc-200/90 dark:bg-zinc-800/90 p-1.5 shadow-inner"
            role="tablist"
            aria-label={t('landing.trainers.tabsAriaLabel')}
          >
            {VOLETS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={volet === tab.id}
                onClick={() => setVolet(tab.id)}
                className={cn(
                  'relative flex-1 min-w-0 rounded-full px-3 py-2.5 text-center text-sm font-medium transition-all duration-200',
                  volet === tab.id
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
                )}
              >
                <span className="block truncate">{t(`landing.trainers.tabs.${tab.id}`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {active.trainerIds.map((trainerId) => (
            <TrainerCard key={`${active.id}-${trainerId}`} trainerId={trainerId} />
          ))}
        </div>
      </div>
    </section>
  );
}
