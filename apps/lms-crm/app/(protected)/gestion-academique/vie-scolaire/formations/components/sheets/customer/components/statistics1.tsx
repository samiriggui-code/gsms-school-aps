/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Card, CardContent } from '@repo/ui/card';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';

/** Métriques vitrine (fusion référence + offre). Si absent, affiche les placeholders démo historiques. */
export type FormationOverviewMetrics = {
  durationDisplay?: string;
  traineeCapacityDisplay?: string;
  /** `null` = pas de prix renseigné (affiche « — »), nombre = prix catalogue effectif */
  priceAmount?: number | null;
  priceCurrency?: string;
  successRateDisplay?: string;
  /** 4ᵉ carte : formateur session (même gabarit que les autres tuiles). */
  sessionTrainer?: {
    name: string | null;
    email: string;
    avatar: string | null;
  };
};

export type Statistics1Props = {
  metrics?: FormationOverviewMetrics | null;
};

function formatPriceAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(2)));
}

type StatItem = {
  kind: 'stat';
  key: string;
  total: string;
  label: string;
  badgeLabel: string;
  badgeColor: 'success' | 'warning' | 'secondary';
  text: string;
  number: string;
};

type TrainerItem = {
  kind: 'trainer';
  key: 'trainer';
  name: string | null;
  email: string;
  avatar: string | null;
};

export function Statistics1({ metrics }: Statistics1Props = {}) {
  const useLive = Boolean(metrics);

  const dur = useLive ? metrics?.durationDisplay?.trim() || '—' : '175h';
  const cap = useLive ? metrics?.traineeCapacityDisplay?.trim() || '—' : '4-12';

  let priceTotal: string;
  let priceSuffix: string;
  if (useLive) {
    const p = metrics?.priceAmount;
    const currency = metrics?.priceCurrency?.trim() || 'EUR';
    if (p != null && Number.isFinite(Number(p))) {
      try {
        priceTotal = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency,
          maximumFractionDigits: Number.isInteger(Number(p)) ? 0 : 2,
        }).format(Number(p));
        priceSuffix = '';
      } catch {
        priceTotal = formatPriceAmount(Number(p));
        priceSuffix = ' €';
      }
    } else {
      priceTotal = '—';
      priceSuffix = '';
    }
  } else {
    priceTotal = '1190';
    priceSuffix = '€';
  }

  const currBadge = useLive ? metrics?.priceCurrency?.trim() || 'EUR' : 'EUR';

  const sr = useLive ? metrics?.successRateDisplay?.trim() || '—' : '97%';

  const tr = metrics?.sessionTrainer;
  const useTrainerFourth =
    Boolean(tr) && Boolean((tr?.name?.trim() || tr?.email?.trim()) ?? false);

  const fourth: StatItem | TrainerItem = useTrainerFourth
    ? {
        kind: 'trainer',
        key: 'trainer',
        name: tr!.name,
        email: tr!.email,
        avatar: tr!.avatar ?? null,
      }
    : {
        kind: 'stat',
        key: 'success',
        total: sr,
        label: 'Taux de reussite',
        badgeLabel: useLive ? 'Réf.' : '94%',
        badgeColor: 'success',
        text: useLive ? 'fiche métier' : 'satisfaction client',
        number: '',
      };

  const items: (StatItem | TrainerItem)[] = [
    {
      kind: 'stat',
      key: 'hours',
      total: dur,
      label: "Nombre d'heures",
      badgeLabel: 'Réf.',
      badgeColor: 'success',
      text: useLive ? 'fiche / offre' : 'formation certifiante',
      number: '',
    },
    {
      kind: 'stat',
      key: 'cap',
      total: cap,
      label: 'Effectif stagiaires',
      badgeLabel: 'Réf.',
      badgeColor: 'success',
      text: useLive ? 'fiche métier' : 'par session',
      number: '',
    },
    {
      kind: 'stat',
      key: 'price',
      total: priceTotal,
      label: 'Prix de la formation',
      badgeLabel: currBadge,
      badgeColor: 'warning',
      text: 'à partir de',
      number: priceSuffix,
    },
    fourth,
  ];

  return (
    <Card className="mb-5 rounded-md bg-accent/70 p-1">
      <CardContent className="rounded-md border border-border bg-background p-0">
        <div className="grid md:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={item.key}
              className={`flex flex-col justify-between gap-5 p-4.5 pb-3.5 ${index > 0 ? 'border-border md:border-s' : ''}`}
            >
              {item.kind === 'trainer' ? (
                <>
                  <div className="flex min-h-[8.5rem] flex-1 flex-col items-center justify-center gap-2">
                    <SessionUserAvatar
                      name={item.name}
                      email={item.email}
                      avatar={item.avatar}
                      square
                      sizeClassName="size-24 shrink-0"
                    />
                    <span className="line-clamp-2 w-full text-center text-xs font-semibold leading-snug text-foreground">
                      {item.name?.trim() || item.email}
                    </span>
                    <span className="w-full text-center text-xs font-normal text-secondary-foreground/70">
                      Formateur référent
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <Badge variant="success" size="sm" appearance="light" className="w-fit">
                      <TrendingUp /> Réf.
                    </Badge>
                    <span className="text-xs font-normal text-secondary-foreground">session</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xl font-semibold text-foreground lg:text-2xl">
                      {item.total}
                      <span className="text-xl font-semibold text-secondary-foreground/30 lg:text-2xl">
                        {item.number}
                      </span>
                    </span>
                    <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={item.badgeColor as any} size="sm" appearance="light" className="w-fit">
                      <TrendingUp /> {item.badgeLabel}
                    </Badge>
                    <span className="text-xs font-normal text-secondary-foreground">{item.text}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
