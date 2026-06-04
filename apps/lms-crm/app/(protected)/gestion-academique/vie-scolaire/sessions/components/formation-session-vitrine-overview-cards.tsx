'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { FormationSessionVitrineOverview } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import { Bolt, FolderSymlink, GraduationCap, Radar, ShoppingCart, TrendingUp } from 'lucide-react';

export function FormationSessionVitrineOverviewCards({
  overview,
}: {
  overview: FormationSessionVitrineOverview;
}) {
  const { audience, prerequisites, certification, progressAxes } = overview;

  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-2">
      <Card className="rounded-md bg-accent/50 shadow-none">
        <CardContent className="flex h-full flex-col p-0">
          <h3 className="border-b border-input bg-accent/70 py-2.5 ps-2 text-sm font-medium text-foreground rounded-t-md">
            Présentation de la formation
          </h3>
          <div className="m-1 mt-0 flex h-full flex-col justify-between rounded-md border border-input bg-background px-3.5 py-5">
            <div className="mb-3 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-[36px] shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <div className="flex size-[30px] items-center justify-center rounded-md bg-accent/50">
                    <ShoppingCart className="size-5 fill-indigo-600 text-indigo-600" />
                  </div>
                </div>
                <span className="text-base font-semibold text-foreground">{overview.presentationTitle}</span>
              </div>
              {overview.presentationBody ? (
                <p className="whitespace-pre-line text-sm text-muted-foreground">{overview.presentationBody}</p>
              ) : null}
              {overview.bullets.length > 0 ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  {overview.bullets.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              {overview.cpfEligible ? (
                <Badge variant="success" size="sm" appearance="light">
                  <TrendingUp className="mr-1 size-3" />
                  Éligible CPF
                </Badge>
              ) : (
                <span className="text-2sm text-muted-foreground">Non éligible CPF (selon fiche)</span>
              )}
              <Separator className="my-3.5" />
              {overview.rncpUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={overview.rncpUrl} target="_blank" rel="noopener noreferrer">
                    Voir la fiche RNCP
                  </a>
                </Button>
              ) : (
                <span className="text-2sm text-muted-foreground">Lien RNCP non renseigné</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full rounded-md bg-accent/50 shadow-none">
        <CardContent className="flex h-full flex-col p-0">
          <h3 className="py-2.5 ps-2 text-sm font-medium text-foreground">Détails complémentaires</h3>
          <div className="m-1 mt-0 flex h-full flex-col justify-between rounded-md border border-input bg-background px-3.5 py-5">
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="flex size-[36px] shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <div className="flex size-[30px] items-center justify-center overflow-hidden rounded-md bg-white">
                      {overview.logoUrl ? (
                        <img
                          src={overview.logoUrl}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <GraduationCap className="size-5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-end gap-1.5">
                    <h3 className="text-2xl font-semibold leading-6 text-foreground">{overview.shortLabel}</h3>
                    {overview.contentVersionLabel ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        {overview.contentVersionLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
                {overview.deliveryModeLabel ? (
                  <Badge variant="outline" size="sm" className="shrink-0">
                    {overview.deliveryModeLabel}
                  </Badge>
                ) : null}
              </div>

              {progressAxes.length > 0 ? (
                <p className="text-2sm leading-relaxed text-muted-foreground">{progressAxes.join(' · ')}</p>
              ) : null}
            </div>

            <div>
              {[
                {
                  icon: <Bolt className="size-5 text-secondary-foreground/70" aria-hidden />,
                  title: audience.title,
                  subtitle: audience.subtitle,
                  value: <span className="text-end text-sm font-medium text-foreground">{audience.value}</span>,
                },
                {
                  icon: <Radar className="size-5 text-secondary-foreground/70" aria-hidden />,
                  title: prerequisites.title,
                  subtitle: prerequisites.subtitle,
                  value: (
                    <span className="max-w-[55%] text-end text-sm font-medium text-foreground">
                      {prerequisites.value}
                    </span>
                  ),
                },
                {
                  icon: <FolderSymlink className="size-5 text-secondary-foreground/70" aria-hidden />,
                  title: 'Certification',
                  subtitle: 'Synthèse',
                  value: (
                    <div className="flex items-center justify-end gap-1">
                      <Badge variant="success" size="sm" appearance="light">
                        <TrendingUp className="mr-1 size-3" />
                        {certification.badgeLabel}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{certification.outcomeLabel}</span>
                    </div>
                  ),
                },
              ].map((stat, index, arr) => (
                <div key={stat.title}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Card className="flex size-[36px] shrink-0 items-center justify-center rounded-md bg-accent/50 shadow-none">
                        {stat.icon}
                      </Card>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-2sm font-medium text-foreground">{stat.title}</span>
                        <span className="text-xs font-normal text-muted-foreground">{stat.subtitle}</span>
                      </div>
                    </div>
                    <div className="shrink-0">{stat.value}</div>
                  </div>
                  {index < arr.length - 1 ? <Separator className="my-3.5" /> : null}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
