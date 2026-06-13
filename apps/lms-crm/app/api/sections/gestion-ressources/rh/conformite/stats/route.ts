import { NextRequest } from 'next/server';

import { ok, fail } from '@/app/api/_shared/http/response';

import { prisma } from '@/lib/prisma';

import { summarizeRhComplianceStats } from '@/lib/gestion-ressources/rh-conformite-compliance';

import { requireGestionRessourcesView } from '../../../_lib/require-gestion-ressources-auth';



export async function GET(request: NextRequest) {

  const auth = await requireGestionRessourcesView();

  if (!auth.ok) return auth.response;



  try {

    const url = new URL(request.url);

    const roleId = url.searchParams.get('roleId') || undefined;

    const status = url.searchParams.get('status') || undefined;

    const userCategory = url.searchParams.get('userCategory') || undefined;



    const where: Record<string, unknown> = {};

    if (roleId) where.roleId = roleId;

    if (status) where.status = status;

    if (userCategory) where.userCategory = userCategory;



    const [users, activeCount, inactiveCount, pendingCount] = await Promise.all([

      prisma.user.findMany({

        where,

        select: {

          id: true,

          firstName: true,

          lastName: true,

          userCategory: true,

          qualification: true,

          carteProNumber: true,

          carteProExpiry: true,

          documentCni: true,

          documentAssurance: true,

          documentCartePro: true,

          documentResidencePermit: true,

          residencePermitExpiry: true,

          role: { select: { slug: true } },

        },

      }),

      prisma.user.count({ where: { ...where, status: 'ACTIVE' } }),

      prisma.user.count({ where: { ...where, status: 'INACTIVE' } }),

      prisma.user.count({ where: { ...where, status: 'PENDING' } }),

    ]);



    return ok(

      summarizeRhComplianceStats({

        users,

        accountStatus: {

          active: activeCount,

          inactive: inactiveCount,

          pending: pendingCount,

        },

      }),

    );

  } catch (error) {

    return fail('Impossible de récupérer les statistiques.', 500, error);

  }

}


