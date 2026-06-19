import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      roleId?: string | null;
      roleName?: string | null;
      /** Slug Prisma `UserRole.slug` (ex. formateur, candidat, eleve). */
      roleSlug?: string | null;
      /** Slugs `UserPermission` du rôle courant (CRM). */
      permissionSlugs?: string[];
      status: string;
      /** Session JWT : compte suspendu / archivé — déconnexion côté client. */
      accessBlocked?: boolean;
      accessBlockReason?: import('@/lib/auth/account-access').AccountBlockReason;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    roleId?: string | null;
    status: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    roleSlug?: string | null;
    permissionSlugs?: string[];
    status: string;
  }
}
