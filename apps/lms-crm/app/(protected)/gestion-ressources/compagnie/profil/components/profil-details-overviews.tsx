'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Award,
  Building2,
  ClipboardList,
  Factory,
  Hash,
  IdCard,
  Landmark,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  ShieldCheck,
  Briefcase,
  Shield,
  Tags,
  CalendarDays,
  Coins,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers';
import type { CompanyProfileView, PrimaryAdminContactPayload } from '@/lib/company-profile';
import { cn } from '@/lib/utils';
import {
  DEFAULT_ADMIN_AVATAR,
  DEFAULT_DIRECTOR_AVATAR,
} from '../lib/compagnie-avatar-presets';

const sectionIconClass = {
  general: 'bg-sky-500/15 border-sky-500/25 text-sky-600 dark:text-sky-400',
  legal: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-600 dark:text-indigo-400',
  direction: 'bg-violet-500/15 border-violet-500/25 text-violet-600 dark:text-violet-400',
} as const;

const itemTone: Record<string, string> = {
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
  fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400',
};

const linkTone: Record<string, string> = {
  sky: 'text-sky-600 dark:text-sky-400 hover:text-sky-500',
  amber: 'text-amber-600 dark:text-amber-400 hover:text-amber-500',
  emerald: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500',
  violet: 'text-violet-600 dark:text-violet-400 hover:text-violet-500',
  rose: 'text-rose-600 dark:text-rose-400 hover:text-rose-500',
  orange: 'text-orange-600 dark:text-orange-400 hover:text-orange-500',
  fuchsia: 'text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-500',
};

function display(v?: string | null) {
  const t = v?.trim();
  return t ? t : '—';
}

function locationLine(p: CompanyProfileView) {
  const parts = [p.companyAddress, p.companyPostalCode, p.companyCity].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
}

function hasNdaOrQualiopiContent(p: CompanyProfileView) {
  return [
    p.ndaNumber,
    p.ndaSpecialty,
    p.ndaDeclarationDate,
    p.ndaRegion,
    p.ndaTrainingActions,
    p.qualiopiCertifications,
  ].some((x) => Boolean(x?.trim()));
}

/** Affiche « Déclaration : le JJ/MM/AAAA, en région … » à partir des champs formulaire. */
function formatCapitalFr(raw?: string | null): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const n = Number.parseInt(t.replace(/\s/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString('fr-FR')} €`;
}

function rcsGreffeLine(city?: string | null): string | null {
  const t = city?.trim();
  return t ? `Greffe de ${t}` : null;
}

function formatIsoDateFr(iso?: string | null): string | null {
  const raw = iso?.trim();
  if (!raw) return null;
  const [y, m, d] = raw.split('-').map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR');
}

function hasLegalRegistryContent(p: CompanyProfileView) {
  return [
    p.siren,
    p.establishmentNic,
    p.vatIntracommunityNumber,
    p.eoriNumber,
    p.nafApeCode,
    p.naf2025Code,
    p.mainActivityDescription,
    p.legalFormDetailed,
    p.companyCreationDate,
    p.establishmentCreationDate,
    p.inseeRegistrationDate,
    p.rneExtractDate,
    p.shareCapitalEuros,
    p.rcsRegistryCity,
    p.agreementAdef,
    p.agreementQualianor,
    p.agreementQualiopiRef,
    p.agreementSsiap,
    p.employeeSituationNote,
    p.companySizeCategoryNote,
    p.collectiveAgreementNote,
    p.inpiCompanySummary,
  ].some((x) => Boolean(x?.trim()));
}

function ndaDeclarationPhrase(p: CompanyProfileView): string | null {
  const raw = p.ndaDeclarationDate?.trim();
  const region = p.ndaRegion?.trim();
  let datePart = '';
  if (raw) {
    const [y, m, d] = raw.split('-').map((n) => Number.parseInt(n, 10));
    if (y && m && d) {
      datePart = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR');
    }
  }
  if (!datePart && !region) return null;
  const parts: string[] = [];
  if (datePart) parts.push(`le ${datePart}`);
  if (region) parts.push(`en région ${region}`);
  return `Déclaration : ${parts.join(', ')}`;
}

export function ProfilDetailsOverviews({
  profil,
  primaryAdminContact,
}: {
  profil: CompanyProfileView;
  primaryAdminContact?: PrimaryAdminContactPayload | null;
}) {
  const title = display(profil.companyName);
  const loc = locationLine(profil);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border border-border/60 shadow-none bg-card">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <Avatar className="size-32 rounded-2xl border-4 border-background shadow-xl">
                <AvatarImage src={profil.logo ?? undefined} alt={title} />
                <AvatarFallback className="rounded-2xl text-4xl font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {getInitials(title === '—' ? 'Co' : title)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">{title}</h3>
              {profil.industry?.trim() ? (
                <p className="text-sm text-muted-foreground font-medium leading-snug">
                  {profil.industry}
                </p>
              ) : null}
            </div>

            {hasNdaOrQualiopiContent(profil) ? (
              <div className="w-full text-left space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <ClipboardList className="size-3.5 shrink-0" />
                  NDA & Qualiopi
                </div>
                {profil.ndaNumber?.trim() ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Numéro NDA</p>
                    <p className="text-sm font-bold text-foreground break-all">{profil.ndaNumber}</p>
                  </div>
                ) : null}
                {profil.ndaSpecialty?.trim() ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Spécialité</p>
                    <p className="text-xs font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                      {profil.ndaSpecialty}
                    </p>
                  </div>
                ) : null}
                {ndaDeclarationPhrase(profil) ? (
                  <p className="text-xs font-medium text-foreground leading-relaxed">{ndaDeclarationPhrase(profil)}</p>
                ) : null}
                {profil.ndaTrainingActions?.trim() ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions de formations</p>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto pr-1">
                      {profil.ndaTrainingActions}
                    </p>
                  </div>
                ) : null}
                {profil.qualiopiCertifications?.trim() ? (
                  <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Award className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      Certification(s) Qualiopi
                    </div>
                    <p className="text-xs font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                      {profil.qualiopiCertifications}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="w-full pt-4 space-y-4 border-t border-border/50">
              <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider">
                <span className="text-muted-foreground font-semibold shrink-0">SIREN</span>
                <span className="font-bold text-foreground text-right break-all">{display(profil.siren)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider">
                <span className="text-muted-foreground font-semibold shrink-0">SIRET</span>
                <span className="font-bold text-foreground text-right break-all">{display(profil.siret)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider">
                <span className="text-muted-foreground font-semibold shrink-0">Clef NIC</span>
                <span className="font-bold text-foreground text-right break-all">{display(profil.establishmentNic)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider">
                <span className="text-muted-foreground font-semibold shrink-0">Agrément CNAPS</span>
                <span className="font-bold text-foreground text-right break-all">{display(profil.cnaps)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider">
                <span className="text-muted-foreground font-semibold shrink-0">Type</span>
                {profil.companyType?.trim() ? (
                  <Badge variant="outline" className="font-bold text-[10px]">{profil.companyType}</Badge>
                ) : (
                  <span className="font-bold text-foreground">—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/60 shadow-none">
            <CardHeader className="pb-4 flex flex-row items-center gap-3 border-b border-border/50 mb-6 px-6">
              <div
                className={cn(
                  'p-2 rounded-lg border',
                  sectionIconClass.general,
                )}
              >
                <Building2 className="size-4" />
              </div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-8 grid md:grid-cols-2 gap-x-12 gap-y-8">
              <InfoItem tone="emerald" icon={Factory} label="Secteur d'activité" value={display(profil.industry)} />
              <InfoItem tone="sky" icon={Tags} label="Type d'entreprise" value={display(profil.companyType)} />
              <InfoItem tone="amber" icon={Briefcase} label="Taille de l'entreprise" value={display(profil.companySize)} />
              <InfoItem tone="emerald" icon={MapPin} label="Localisation" value={loc || undefined} />
              <InfoItem tone="sky" icon={Globe} label="Site Web" value={profil.website?.trim() || undefined} isLink linkTone="sky" />
              <InfoItem tone="violet" icon={ShieldCheck} label="Région" value={display(profil.companyRegion)} />
            </CardContent>
          </Card>

          {hasLegalRegistryContent(profil) ? (
            <Card className="border border-border/60 shadow-none">
              <CardHeader className="pb-4 flex flex-row items-center gap-3 border-b border-border/50 mb-6 px-6">
                <div className={cn('p-2 rounded-lg border', sectionIconClass.legal)}>
                  <Landmark className="size-4" />
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Registre INPI / INSEE</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-8 grid md:grid-cols-2 gap-x-12 gap-y-8">
                <InfoItem tone="violet" icon={Hash} label="N° TVA intracommunautaire" value={display(profil.vatIntracommunityNumber)} />
                <InfoItem tone="sky" icon={Hash} label="N° EORI" value={display(profil.eoriNumber)} />
                <InfoItem tone="amber" icon={Tags} label="Code NAF / APE" value={display(profil.nafApeCode)} />
                <InfoItem tone="amber" icon={Tags} label="Code NAF 2025" value={display(profil.naf2025Code)} />
                <InfoItem tone="emerald" icon={Factory} label="Activité principale (NAF)" value={display(profil.mainActivityDescription)} />
                <InfoItem tone="sky" icon={Building2} label="Forme juridique" value={display(profil.legalFormDetailed)} />
                <InfoItem tone="amber" icon={Coins} label="Capital social" value={formatCapitalFr(profil.shareCapitalEuros) ?? undefined} />
                <InfoItem tone="violet" icon={Landmark} label="R.C.S." value={rcsGreffeLine(profil.rcsRegistryCity) ?? undefined} />
                <InfoItem tone="orange" icon={CalendarDays} label="Création société" value={formatIsoDateFr(profil.companyCreationDate) ?? undefined} />
                <InfoItem tone="orange" icon={CalendarDays} label="Création établissement" value={formatIsoDateFr(profil.establishmentCreationDate) ?? undefined} />
                <InfoItem tone="rose" icon={CalendarDays} label="Inscription INSEE" value={formatIsoDateFr(profil.inseeRegistrationDate) ?? undefined} />
                <InfoItem tone="rose" icon={CalendarDays} label="Extrait RNE" value={formatIsoDateFr(profil.rneExtractDate) ?? undefined} />
                <InfoItem tone="emerald" icon={ShieldCheck} label="Agrément ADEF" value={display(profil.agreementAdef)} />
                <InfoItem tone="sky" icon={ShieldCheck} label="Agrément QUALIANOR" value={display(profil.agreementQualianor)} />
                <InfoItem tone="amber" icon={Award} label="Réf. agrément QUALIOPI" value={display(profil.agreementQualiopiRef)} />
                <InfoItem tone="orange" icon={ShieldCheck} label="Agrément SSIAP" value={display(profil.agreementSsiap)} />
                <div className="md:col-span-2 space-y-2">
                  <div className="flex gap-4 items-start">
                    <div className={cn('mt-1 p-2 rounded-lg border shrink-0', itemTone.emerald)}>
                      <Briefcase className="size-4" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Effectif salarié</p>
                      <p className="text-sm font-bold text-foreground leading-relaxed whitespace-pre-wrap">{display(profil.employeeSituationNote)}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="flex gap-4 items-start">
                    <div className={cn('mt-1 p-2 rounded-lg border shrink-0', itemTone.sky)}>
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Catégorie d&apos;entreprise</p>
                      <p className="text-sm font-bold text-foreground leading-relaxed whitespace-pre-wrap">{display(profil.companySizeCategoryNote)}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="flex gap-4 items-start">
                    <div className={cn('mt-1 p-2 rounded-lg border shrink-0', itemTone.violet)}>
                      <ClipboardList className="size-4" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Convention(s) collective(s)</p>
                      <p className="text-sm font-bold text-foreground leading-relaxed whitespace-pre-wrap">{display(profil.collectiveAgreementNote)}</p>
                    </div>
                  </div>
                </div>
                {profil.inpiCompanySummary?.trim() ? (
                  <div className="md:col-span-2 rounded-lg border border-border/60 bg-muted/15 p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Synthèse INPI</p>
                    <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">{profil.inpiCompanySummary}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border border-border/60 shadow-none">
            <CardHeader className="pb-4 flex flex-row items-center gap-3 border-b border-border/50 mb-6 px-6">
              <div className={cn('p-2 rounded-lg border', sectionIconClass.direction)}>
                <User className="size-4" />
              </div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Direction</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-8 grid md:grid-cols-2 gap-x-12 gap-y-8">
              <InfoItem
                tone="rose"
                icon={User}
                label="Dirigeant"
                value={display(profil.directorFullName)}
                portraitSrc={profil.directorAvatar ?? DEFAULT_DIRECTOR_AVATAR}
                portraitAlt={display(profil.directorFullName)}
                portraitInitials={getInitials(profil.directorFullName || 'D')}
              />
              <InfoItem tone="violet" icon={IdCard} label="Rôle" value={display(profil.directorRole)} />
              <InfoItem tone="orange" icon={Phone} label="Téléphone" value={display(profil.directorPhone)} />
              <InfoItem tone="fuchsia" icon={Mail} label="Email" value={display(profil.directorEmail)} />
            </CardContent>
          </Card>

          {primaryAdminContact ? (
            <Card className="border border-border/60 shadow-none">
              <CardHeader className="pb-4 flex flex-row items-center gap-3 border-b border-border/50 mb-6 px-6">
                <div className="p-2 rounded-lg border bg-amber-500/15 border-amber-500/25 text-amber-600 dark:text-amber-400">
                  <Shield className="size-4" />
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">
                  Administration du site
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-8 grid md:grid-cols-2 gap-x-12 gap-y-8">
                <InfoItem
                  tone="amber"
                  icon={User}
                  label="Compte administrateur"
                  value={primaryAdminContact.displayName}
                  portraitSrc={primaryAdminContact.avatar ?? DEFAULT_ADMIN_AVATAR}
                  portraitAlt={primaryAdminContact.displayName}
                  portraitInitials={getInitials(primaryAdminContact.displayName || 'A')}
                />
                <InfoItem tone="orange" icon={Mail} label="Email connexion" value={primaryAdminContact.email} />
                <InfoItem tone="rose" icon={Phone} label="Téléphone" value={display(primaryAdminContact.phone)} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  isLink,
  tone,
  linkTone: lt,
  portraitSrc,
  portraitAlt,
  portraitInitials,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  isLink?: boolean;
  tone: keyof typeof itemTone;
  linkTone?: keyof typeof linkTone;
  portraitSrc?: string | null;
  portraitAlt?: string;
  portraitInitials?: string;
}) {
  const safeLt = lt ?? (tone === 'sky' ? 'sky' : 'amber');
  return (
    <div className="flex gap-4 items-start">
      <div
        className={cn(
          'mt-1 p-1.5 rounded-lg border shrink-0 flex items-center justify-center overflow-hidden',
          itemTone[tone],
        )}
      >
        {portraitSrc ? (
          <Avatar className="size-9 rounded-md ring-2 ring-background">
            <AvatarImage src={portraitSrc} alt={portraitAlt ?? ''} />
            <AvatarFallback className="rounded-md text-xs font-bold">
              {portraitInitials ?? '?'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Icon className="size-4" />
        )}
      </div>
      <div className="space-y-1.5 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
        {isLink && value ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-sm font-bold hover:underline block truncate',
              linkTone[safeLt],
            )}
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-bold text-foreground leading-tight">
            {value?.trim() ? value : '—'}
          </p>
        )}
      </div>
    </div>
  );
}
