import { User } from './user';

export interface TeamSite {
  id: string;
  name: string;
}

export interface TeamMember {
  id: string;
  teamId?: string;
  tenantUserId: string;
  TenantUser?: User | null;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  sector?: string | null;
  siteId?: string | null;
  Site?: TeamSite | null;
  image?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  members?: TeamMember[];
  _count?: {
    members?: number;
  };
}
