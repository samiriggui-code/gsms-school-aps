'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { getAvatarUrl } from '@/lib/helpers';
import { showsCollaboratorAgrementSchedulingSection } from '@/lib/rh-agrement';

export function UserSidebar({ user }: { user: any }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const roleSlug = user?.role?.slug as string | undefined;
  const showCarteAgrementRef = showsCollaboratorAgrementSchedulingSection(roleSlug);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const displayAvatar = selectedImage || getAvatarUrl(user?.avatar);

  /** `User` Prisma n’a pas `company`; l’organisation éventuelle est sur `CollaborateurProfile`/`FormateurProfile` (autres écrans). */
  const infoItems: Array<{
    label: string;
    value: string;
    isLink?: boolean;
    href?: string;
  }> = [
    { label: 'Email', value: user?.email || 'N/A', isLink: true, href: user?.email ? `mailto:${user.email}` : '#' },
    { label: 'Téléphone', value: user?.phone || 'N/A' },
    { label: 'Rôle', value: user?.role?.name || 'Standard' },
    ...(showCarteAgrementRef ?
      [{ label: 'Réf. habilitation', value: user?.carteProNumber?.trim() || '—' } as const]
    : []),
    { label: 'Qualification', value: user?.qualification || '—' },
    { label: 'Statut', value: user?.status || 'ACTIVE' },
  ];

  return (
    <div className="space-y-5">
      <div className="w-full h-[240px] bg-accent/70 border border-border rounded-lg flex items-center justify-center overflow-hidden">
        <div className="relative flex items-center justify-center w-full h-full">
          {displayAvatar ?
            <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
          : <UserIcon className="size-[40px] text-muted-foreground/60" />}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="user-avatar-upload"
          />
          <label htmlFor="user-avatar-upload" className="absolute bottom-3 right-3">
            <Button size="sm" variant="outline" asChild>
              <span>Upload</span>
            </Button>
          </label>
        </div>
      </div>

      <div className="">
        {infoItems.map((item, index) => (
          <div key={item.label}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-normal text-secondary-foreground/80">{item.label}</span>
              {item.isLink ?
                <Link
                  href={item.href || '#'}
                  className="text-2sm font-normal text-foreground hover:text-primary truncate max-w-[150px]"
                >
                  {item.value}
                </Link>
              : <span className="text-2sm font-normal text-foreground truncate max-w-[150px]">{item.value}</span>}
            </div>
            {index < infoItems.length - 1 ? <Separator className="my-2.5" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
