'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import {
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Clock,
  Fingerprint,
  User as UserIcon,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  showsCollaboratorAgrementSchedulingSection,
  showsUserStaffEmployerFields,
} from '@/lib/rh-agrement';
import { RhDetailFieldRow } from '@/components/rh/rh-detail-field-row';

export function UserHRInfo({ user }: { user: Record<string, unknown> }) {
  const roleSlug = (user.role as { slug?: string } | null | undefined)?.slug;
  const showStaffHr = showsUserStaffEmployerFields(roleSlug);
  const showCartePro = showsCollaboratorAgrementSchedulingSection(roleSlug);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Non renseigné';
    try {
      return format(new Date(date as string), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return 'Format invalide';
    }
  };

  const str = (key: string) => (user[key] as string | null | undefined) ?? null;

  return (
    <Card className="border border-border/60 bg-background shadow-none">
      <CardHeader className="border-b border-border/50 bg-background px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-foreground">
          <div className="rounded-lg border border-border bg-background p-2">
            <Fingerprint className="size-4 text-foreground/70" />
          </div>
          Informations RH &amp; administratives
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 p-4 sm:gap-8 sm:p-6">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          <div className="space-y-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">État civil</h4>
            </div>
            <div className="space-y-3">
              <RhDetailFieldRow icon={Calendar} label="Date de naissance">
                <span className="font-semibold text-foreground">{formatDate(str('birthDate'))}</span>
              </RhDetailFieldRow>
              <RhDetailFieldRow icon={MapPin} label="Lieu de naissance">
                <span className="font-semibold text-foreground">{str('birthPlace') || 'Non renseigné'}</span>
              </RhDetailFieldRow>
              <RhDetailFieldRow icon={UserIcon} label="Nationalité" className="border-0 pb-0">
                <span className="font-semibold text-foreground">{str('nationality') || 'Non renseigné'}</span>
              </RhDetailFieldRow>
            </div>
          </div>

          <div className="space-y-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Identification</h4>
            </div>
            <div className="space-y-3">
              {showStaffHr ?
                <RhDetailFieldRow icon={Hash} label="NIR (Sécu)">
                  <code className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-bold text-foreground">
                    {str('socialSecurityNumber') || 'Non renseigné'}
                  </code>
                </RhDetailFieldRow>
              : null}
              <RhDetailFieldRow icon={CreditCard} label="CNI / passeport">
                <span className="font-semibold text-foreground">{str('cniNumber') || 'Non renseigné'}</span>
              </RhDetailFieldRow>
              {str('residencePermitNumber') ?
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-foreground/70">
                      <ShieldCheck className="size-3.5" />
                      <span className="text-[10px] font-bold uppercase">Titre de séjour</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">N° {str('residencePermitNumber')}</span>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-[10px] font-medium text-muted-foreground">Expire le</div>
                    <div className="text-xs font-bold text-foreground">{formatDate(str('residencePermitExpiry'))}</div>
                  </div>
                </div>
              : null}
            </div>
          </div>
        </div>

        {showStaffHr ?
          <div className="border-t border-border/60 pt-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Contrat &amp; poste
              </h4>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
              <div className="space-y-3">
                <RhDetailFieldRow icon={FileText} label="Type de contrat">
                  {str('contractType') ?
                    <Badge variant="outline" size="sm" className="font-bold text-foreground/80">
                      {str('contractType')}
                    </Badge>
                  : <span className="font-semibold text-foreground">Non renseigné</span>}
                </RhDetailFieldRow>
                <RhDetailFieldRow icon={Clock} label="Temps de travail" className="border-0 pb-0">
                  <span className="font-semibold text-foreground">
                    {str('workTimeType') === 'FULL_TIME' ?
                      'Temps plein'
                    : str('workTimeType') === 'PART_TIME' ?
                      'Temps partiel'
                    : 'Non renseigné'}
                  </span>
                </RhDetailFieldRow>
              </div>
              <div className="space-y-3">
                <RhDetailFieldRow icon={Calendar} label="Date d'entrée">
                  <span className="font-semibold text-foreground">{formatDate(str('contractStartDate'))}</span>
                </RhDetailFieldRow>
                {str('contractEndDate') ?
                  <RhDetailFieldRow icon={Calendar} label="Date de fin" className="border-0 pb-0">
                    <span className="font-semibold text-foreground">{formatDate(str('contractEndDate'))}</span>
                  </RhDetailFieldRow>
                : null}
              </div>
            </div>
          </div>
        : null}

        {showCartePro ?
          <div className="border-t border-border/60 pt-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Habilitation / agrément métier
              </h4>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
              <RhDetailFieldRow icon={ShieldCheck} label="Référence" className="border-0 pb-0">
                <span className="font-bold text-foreground">{str('carteProNumber') || 'Non renseigné'}</span>
              </RhDetailFieldRow>
              <RhDetailFieldRow icon={Calendar} label="Expiration" className="border-0 pb-0">
                <span className="font-bold text-foreground">{formatDate(str('carteProExpiry'))}</span>
              </RhDetailFieldRow>
            </div>
          </div>
        : null}

        <div className="border-t border-border/60 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-foreground/30" />
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Adresse résidentielle
            </h4>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
            <div className="rounded-md border border-border bg-background p-2">
              <MapPin className="size-4 text-foreground/70" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-foreground break-words">{str('address') || 'Non renseigné'}</p>
              {str('postalCode') || str('city') ?
                <p className="text-2sm font-medium text-muted-foreground">
                  {str('postalCode')} {str('city')}
                </p>
              : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
