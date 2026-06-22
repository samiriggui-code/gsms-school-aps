import { User } from './user';

export interface TeamSite {
  id: string;
  name: string;
}

export interface TeamMember {
  id: string;
  teamId?: string;
  tenantUserId: string;
  sessionRole?: 'TRAINER' | 'MODERATOR' | 'LEARNER' | null;
  TenantUser?: User | null;
}

export interface TeamFormationSession {
  id: string;
  dateDisplayLabel?: string | null;
  trainerUserId?: string | null;
  moderatorUserId?: string | null;
  formation?: { id: string; name: string } | null;
  trainer?: TeamLeader | null;
  moderator?: TeamLeader | null;
}

export interface TeamLeader {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  sector?: string | null;
  siteId?: string | null;
  leaderId?: string | null;
  leader?: TeamLeader | null;
  formationSessionId?: string | null;
  lifecycleStatus?: string | null;
  lifecycleClosedAt?: Date | string | null;
  isSessionTeam?: boolean;
  formationSession?: TeamFormationSession | null;
  Site?: TeamSite | null;
  orgUnit?: { id?: string; name?: string } | null;
  OrgUnit?: { id?: string; name?: string } | null;
  image?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  members?: TeamMember[];
  _count?: {
    members?: number;
  };
}
