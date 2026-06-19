'use client';

import { User as RhUser } from '@/app/models/user';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Briefcase, User as UserIcon, Network } from 'lucide-react';
import { SCHOOL_USER_CATEGORY_LABELS } from '@/lib/rh-school-profile-fields';

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
    user.collaborateurProfile?.schoolInternalService ??
    user.formateurProfile?.schoolInternalService ??
    null;

  const manager = displayName(user.collaborateurProfile?.manager);

  const rows = [
    { icon: Mail, label: 'Email personnel', value: user.email },
    { icon: Mail, label: 'Email professionnel', value: user.proEmail },
    { icon: Phone, label: 'Téléphone', value: user.phone },
    { icon: UserIcon, label: 'Catégorie', value: categoryLabel },
    { icon: Briefcase, label: 'Rôle IAM', value: user.role?.name },
    { icon: Briefcase, label: 'Fonction / poste', value: user.jobFunction },
    { icon: Briefcase, label: 'Qualification', value: user.qualification },
    ...(internalService
      ? [{ icon: Network, label: 'Pôle / service', value: SERVICE_LABELS[internalService] ?? internalService }]
      : []),
    ...(manager ? [{ icon: UserIcon, label: 'Responsable hiérarchique', value: manager }] : []),
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Contact</h4>
        </div>
        <div className="space-y-3">
          {rows.slice(0, 3).map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60 gap-4"
            >
              <div className="flex items-center gap-2.5 text-muted-foreground shrink-0">
                <row.icon className="size-3.5" />
                <span className="font-medium">{row.label}</span>
              </div>
              <span className="font-semibold text-foreground text-right truncate">{row.value || 'Non renseigné'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Profil métier</h4>
        </div>
        <div className="space-y-3">
          {rows.slice(3).map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60 gap-4 last:border-0"
            >
              <div className="flex items-center gap-2.5 text-muted-foreground shrink-0">
                <row.icon className="size-3.5" />
                <span className="font-medium">{row.label}</span>
              </div>
              {row.label === 'Catégorie' && row.value !== 'Non renseigné' ? (
                <Badge variant="outline" size="sm" className="font-bold text-foreground/80 max-w-[60%] truncate">
                  {row.value}
                </Badge>
              ) : (
                <span className="font-semibold text-foreground text-right truncate">{row.value || 'Non renseigné'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
