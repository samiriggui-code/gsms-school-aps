'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import type { PublicCatalogTeamMember } from '@/lib/catalog-public-types';

const AVATAR_FALLBACK = '/media/avatars/blank.png';

const VOLET_IDS = ['direction', 'formateur', 'pedagogique', 'rh'] as const;
type VoletId = (typeof VOLET_IDS)[number];

const VOLET_BADGE_ICONS: Record<VoletId, React.ElementType[]> = {
  direction: [Award, Users, Shield],
  formateur: [Shield, Flame, HeartPulse],
  pedagogique: [GraduationCap, Library, ClipboardList],
  rh: [UserCog, Handshake, Building2],
};

function StatBadge({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="font-semibold text-foreground tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="leading-tight">{label}</span>
    </div>
  );
}

function TrainerCardDynamic({
  member,
  badgeIcon: BadgeIcon,
}: {
  member: PublicCatalogTeamMember;
  badgeIcon: React.ElementType;
}) {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState(member.avatarUrl || AVATAR_FALLBACK);

  const linkedin = member.linkedinUrl?.trim() || '#';
  const website = member.websiteUrl?.trim() || '#';

  return (
    <div className="group relative bg-background border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <div className="size-14 rounded-lg overflow-hidden ring-2 ring-primary/15 group-hover:ring-primary/30 transition-all">
            <Image
              src={imageSrc}
              alt={member.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              onError={() => setImageSrc(AVATAR_FALLBACK)}
            />
          </div>
          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
            <BadgeIcon className="size-3" />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">{member.name}</h3>
          <p className="text-sm font-medium text-primary">{member.title}</p>
        </div>
      </div>
      <p className="text-xs font-medium text-primary/80 bg-primary/10 rounded-md px-2.5 py-1 mb-3 inline-block">
        {member.certifications}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{member.bio}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 pb-5 border-b border-border">
        <StatBadge
          icon={BookOpen}
          value={member.statA}
          label={t(`landing.trainers.dynamic.labelA.${member.volet}`)}
        />
        <StatBadge
          icon={Users}
          value={member.statB}
          label={t(`landing.trainers.dynamic.labelB.${member.volet}`)}
        />
        <StatBadge icon={Award} value={member.rating} label={t('landing.trainers.ratingLabel')} />
      </div>
      <div className="flex items-center gap-2">
        <a
          href={linkedin}
          className="inline-flex items-center justify-center size-8 rounded-lg bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          aria-label={t('landing.trainers.linkedinAria', { name: member.name })}
          target={linkedin !== '#' ? '_blank' : undefined}
          rel={linkedin !== '#' ? 'noopener noreferrer' : undefined}
        >
          <Linkedin className="size-4" />
        </a>
        <a
          href={website}
          className="inline-flex items-center justify-center size-8 rounded-lg bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          aria-label={t('landing.trainers.websiteAria', { name: member.name })}
          target={website !== '#' ? '_blank' : undefined}
          rel={website !== '#' ? 'noopener noreferrer' : undefined}
        >
          <Globe className="size-4" />
        </a>
      </div>
    </div>
  );
}

const VOLET_FROM_HASH: Record<string, VoletId> = {
  '#trainers': 'direction',
  '#trainers-direction': 'direction',
  '#trainers-formateur': 'formateur',
  '#trainers-pedagogique': 'pedagogique',
  '#trainers-rh': 'rh',
};

export default function Trainers() {
  const { t } = useTranslation();
  const [volet, setVolet] = useState<VoletId>('direction');
  const [members, setMembers] = useState<PublicCatalogTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch('/api/catalog/team', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('fetch failed'))))
      .then((data: { items?: PublicCatalogTeamMember[] }) => {
        if (!cancelled) setMembers(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncVoletFromHash = () => {
      const next = VOLET_FROM_HASH[window.location.hash];
      if (next) setVolet(next);
    };
    syncVoletFromHash();
    window.addEventListener('hashchange', syncVoletFromHash);
    return () => window.removeEventListener('hashchange', syncVoletFromHash);
  }, []);

  const activeMembers = useMemo(
    () =>
      members
        .filter((m) => m.volet === volet)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [members, volet],
  );

  return (
    <section id="trainers" className="py-20 lg:py-28 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block text-sm font-semibold tracking-wider text-primary uppercase mb-3">
            {t('landing.trainers.badge')}
          </span>
          <h2 className="mb-5 text-3xl font-bold text-foreground lg:text-5xl">{t('landing.trainers.title')}</h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{t('landing.trainers.subtitle')}</p>
        </div>

        <div className="flex justify-center mb-12">
          <div
            className="inline-flex w-full max-w-3xl rounded-full bg-muted p-1.5 shadow-inner"
            role="tablist"
            aria-label={t('landing.trainers.tabsAriaLabel')}
          >
            {VOLET_IDS.map((tabId) => (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={volet === tabId}
                onClick={() => setVolet(tabId)}
                className={cn(
                  'relative flex-1 min-w-0 rounded-full px-3 py-2.5 text-center text-sm font-medium transition-all duration-200',
                  volet === tabId
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="block truncate">{t(`landing.trainers.tabs.${tabId}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : activeMembers.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t('landing.trainers.dynamic.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeMembers.map((member, index) => {
              const icons = VOLET_BADGE_ICONS[member.volet];
              const BadgeIcon = icons[index % icons.length] ?? Shield;
              return (
                <TrainerCardDynamic
                  key={member.id}
                  member={member}
                  badgeIcon={BadgeIcon}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
