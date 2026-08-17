'use client';

import { User as RhUser } from '@/app/models/user';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Briefcase, User as UserIcon, Network } from 'lucide-react';
import { SCHOOL_USER_CATEGORY_LABELS } from '@/lib/rh-school-profile-fields';
import { RhDetailFieldRow } from '@/components/rh/rh-detail-field-row';

interface RhUserContactProfilSummaryProps {
  user: RhUser & {
    collaborateurProfile?: {
      manager?: { name?: string | null; firstName?: string | null; lastName?: string | null } | null;
      schoolInternalService?: string | null;
    } | null;
    formateurProfile?: { schoolInternalService?: string | null } | null;
  };
}

const SERVICE_LABELS: Record<string, string> = {
  TRAINER_POOL: 'Pool formateurs',
  PEDAGOGICAL: 'Pôle pédagogique',
  HR_ADMIN: 'RH & administration',
  DIRECTION: "Direction de l'école",
};

function displayName(
  person: { name?: string | null; firstName?: string | null; lastName?: string | null } | null | undefined,
) {
  if (!person) return null;
  return person.name?.trim() || `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || null;
}

export function RhUserContactProfilSummary({ user }: RhUserContactProfilSummaryProps) {
  const categoryLabel =
    user.userCategory && user.userCategory in SCHOOL_USER_CATEGORY_LABELS
      ? SCHOOL_USER_CATEGORY_LABELS[user.userCategory as keyof typeof SCHOOL_USER_CATEGORY_LABELS]
      : user.userCategory || 'Non renseigné';

  const internalService =
    user.collaborateurProfile?.schoolInternalService ?? user.formateurProfile?.schoolInternalService ?? null;

  const manager = displayName(user.collaborateurProfile?.manager);

  const contactRows = [
    { icon: Mail, label: 'Email personnel', value: user.email },
    { icon: Mail, label: 'Email professionnel', value: user.proEmail },
    { icon: Phone, label: 'Téléphone', value: user.phone },
  ];

  const profileRows = [
    { icon: UserIcon, label: 'Catégorie', value: categoryLabel, badge: true },
    { icon: Briefcase, label: 'Rôle IAM', value: user.role?.name },
    { icon: Briefcase, label: 'Fonction / poste', value: user.jobFunction },
    { icon: Briefcase, label: 'Qualification', value: user.qualification },
    ...(internalService
      ? [{ icon: Network, label: 'Pôle / service', value: SERVICE_LABELS[internalService] ?? internalService, badge: false }]
      : []),
    ...(manager ? [{ icon: UserIcon, label: 'Responsable hiérarchique', value: manager, badge: false }] : []),
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
      <div className="space-y-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-foreground/30" />
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Contact</h4>
        </div>
        <div className="space-y-3">
          {contactRows.map((row) => (
            <RhDetailFieldRow key={row.label} icon={row.icon} label={row.label}>
              <span className="font-semibold text-foreground">{row.value || 'Non renseigné'}</span>
            </RhDetailFieldRow>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-foreground/30" />
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Profil métier</h4>
        </div>
        <div className="space-y-3">
          {profileRows.map((row) => (
            <RhDetailFieldRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              className="last:border-0"
            >
              {row.badge && row.value !== 'Non renseigné' ?
                <Badge variant="outline" size="sm" className="max-w-full truncate font-bold text-foreground/80">
                  {row.value}
                </Badge>
              : <span className="font-semibold text-foreground">{row.value || 'Non renseigné'}</span>}
            </RhDetailFieldRow>
          ))}
        </div>
      </div>
    </div>
  );
}
