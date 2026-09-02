'use client';



import { useSession } from 'next-auth/react';

import { Calendar, Mail, MapPin, Phone, User } from 'lucide-react';

import { formatPortalDate } from '@/lib/portal/format-portal-date';

import { UserAvatar } from '@/components/common/user-avatar';

import { Badge } from '@repo/ui/badge';

import {

  PortalField,

  PortalFieldGrid,

  PortalSection,

} from '@/components/portal/layout/portal-section';

import { portalMuted } from '@/components/portal/layout/portal-ui';



export type PortalProfileData = {

  name: string | null;

  firstName: string | null;

  lastName: string | null;

  email: string;

  phone: string | null;

  avatar: string | null;

  address: string | null;

  city: string | null;

  postalCode: string | null;

  birthDate: string | null;

  roleName: string;

  accountCreatedAt: string;

};



function displayValue(value: string | null | undefined) {

  const v = value?.trim();

  return v || '—';

}



export function PortalProfileCard({ profile }: { profile: PortalProfileData }) {

  const { data: session } = useSession();

  const avatarRaw = profile.avatar?.trim() || session?.user?.avatar?.trim() || null;



  const displayName =

    [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||

    profile.name ||

    profile.email;



  return (

    <PortalSection title="Identité candidat" icon={User} variant="default">

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

        <UserAvatar

          avatar={avatarRaw}

          className="size-20 shrink-0 rounded-xl border border-border object-cover lg:size-[88px]"

          alt={displayName}

          fallback="/media/avatars/300-2.png"

        />



        <div className="min-w-0 flex-1 space-y-4">

          <div className="flex flex-wrap items-center gap-2">

            <p className="text-[13px] font-semibold tracking-tight">{displayName}</p>

            <Badge variant="secondary" size="sm" className="text-[10px]">

              {profile.roleName}

            </Badge>

            <span className={portalMuted}>

              Compte créé le {formatPortalDate(profile.accountCreatedAt)}

            </span>

          </div>



          <PortalFieldGrid cols={4}>

            <PortalField label="Prénom" value={displayValue(profile.firstName)} />

            <PortalField label="Nom" value={displayValue(profile.lastName)} />

            <PortalField

              label="Date de naissance"

              value={profile.birthDate ? formatPortalDate(profile.birthDate) : '—'}

              icon={Calendar}

            />

            <PortalField label="Email" value={profile.email} icon={Mail} />

            <PortalField label="Téléphone" value={displayValue(profile.phone)} icon={Phone} />

            <PortalField label="Adresse" value={displayValue(profile.address)} icon={MapPin} />

            <PortalField label="Code postal" value={displayValue(profile.postalCode)} />

            <PortalField label="Ville" value={displayValue(profile.city)} />

          </PortalFieldGrid>

        </div>

      </div>

    </PortalSection>

  );

}

