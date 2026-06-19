'use client';

import { Card, CardContent } from '@/components/ui/card';
import { User as Conformite } from '@/app/models/user';
import { SCHOOL_USER_CATEGORY_LABELS } from '@/lib/rh-school-profile-fields';
import { roleHasMobilePortalAccess } from '@/lib/rh-iam-roles';

export function ConformiteAccessDetails({ conformite }: { conformite: Conformite }) {
  const categoryLabel =
    conformite.userCategory && conformite.userCategory in SCHOOL_USER_CATEGORY_LABELS
      ? SCHOOL_USER_CATEGORY_LABELS[conformite.userCategory as keyof typeof SCHOOL_USER_CATEGORY_LABELS]
      : conformite.userCategory || '—';

  const mobileAccess = roleHasMobilePortalAccess(conformite.role);

  const item = [
    {
      label: 'Identifiant',
      info: conformite.id.substring(0, 8),
    },
    {
      label: 'Catégorie',
      info: categoryLabel,
    },
    {
      label: 'Fonction',
      info: conformite.jobFunction || '—',
    },
    {
      label: 'Rôle IAM',
      info: conformite.role?.name || 'Standard',
    },
    {
      label: 'Accès mobile / portail',
      info: mobileAccess ? 'Autorisé' : 'Non autorisé',
    },
  ];

  return (
    <Card className="bg-accent/70 rounded-md shadow-none h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Détails de l&apos;accès</h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-6 px-3.5 space-y-5 h-full">
          {item.map((row) => (
            <div key={row.label} className="flex gap-2 lg:gap-10">
              <span className="basis-1/4 text-xs font-normal text-secondary-foreground/80 leading-6">
                {row.label}
              </span>
              <span className="basis-2/4 text-2sm font-semibold text-foreground leading-6">{row.info}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
