import type { DocControllerHooks } from '@repo/doctype';
import { SCHOOL_IAM_ROLE_SLUGS } from '@/lib/rh-iam-roles';

/** Parité liste legacy ENTITIES.user (filtres RH / source-flow). */
export const userListController: DocControllerHooks = {
  buildListQuery: ({ searchParams, headers }) => {
    const status = searchParams.get('status');
    const roleId = searchParams.get('roleId');
    const sourceFlow = headers?.get('x-lms-source-flow');
    const profileType = searchParams.get('profileType') || 'all';
    const and: Record<string, unknown>[] = [];

    if (status && status !== 'all') and.push({ status });
    if (roleId && roleId !== 'all') and.push({ roleId });
    if (sourceFlow === 'collaborateur') {
      and.push({
        NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }],
      });
      if (profileType === 'collaborateur') {
        and.push({ role: { slug: 'collaborateur' } });
      } else if (profileType === 'formateur') {
        and.push({ role: { slug: 'formateur' } });
      } else if (profileType === 'interne') {
        and.push({
          NOT: [
            {
              role: {
                slug: { in: ['collaborateur', 'formateur', 'candidat', 'eleve'] },
              },
            },
          ],
        });
      }
    }

    return {
      where: and.length ? { AND: and } : undefined,
      select: {
        id: true,
        isTrashed: true,
        avatar: true,
        name: true,
        email: true,
        proEmail: true,
        status: true,
        createdAt: true,
        lastSignInAt: true,
        role: { select: { id: true, name: true } },
      },
    };
  },
};

export const roleListController: DocControllerHooks = {
  buildListQuery: () => ({
    where: {
      isTrashed: false,
      slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] },
    },
    include: {
      permissions: {
        select: {
          permission: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  }),
};
