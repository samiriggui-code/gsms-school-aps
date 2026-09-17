import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StatService } from '@repo/api-core';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';

export async function GET(request: Request) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.dashboard);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  const statService = new StatService(prisma);

  const months = Math.max(1, Math.min(24, Number(searchParams.get('months') || 12)));

  if (section === 'facturation') {
    const financeStats = await statService.getFinanceStats(months);
    const [devisEmis, devisAcceptes] = financeStats.kpis;
    const conversionRate =
      devisEmis?.value && Number(devisEmis.value) > 0
        ? Math.round((Number(devisAcceptes?.value ?? 0) / Number(devisEmis.value)) * 100)
        : 0;
    return NextResponse.json({
      success: true,
      data: {
        activeUsers: financeStats.kpis[0],
        pendingInvoices: financeStats.kpis[1],
        totalRoles: financeStats.kpis[2],
        storageQuota: financeStats.kpis[3],
        systemLogs: financeStats.kpis[4],
      },
      overallPerformance: { value: conversionRate, trend: 0 },
      categories: financeStats.kpis.map((k) => ({
        badgeColor:
          k.color === 'success'
            ? 'bg-green-500'
            : k.color === 'warning'
              ? 'bg-orange-500'
              : k.color === 'destructive'
                ? 'bg-red-500'
                : 'bg-indigo-500',
        label: k.label,
      })),
      stats: financeStats.kpis.map((k) => ({
        icon: k.icon ?? 'FileText',
        text: k.label,
        total: k.value,
        stats: 0,
      })),
      updatedAt: financeStats.updatedAt,
    });
  }

  const hubSections = new Set([
    'cms',
    'marketing',
    'seo',
    'support',
    'finance',
    'securite',
    'compagnie',
    'rh',
    'communication',
    'academique',
  ]);

  if (section && hubSections.has(section)) {
    const data = await statService.getSectionHubLegacyStats(section, months);
    return NextResponse.json({ success: true, data });
  }

  const dashboardStats = await statService.getGeneralDashboardStats();
  return NextResponse.json(dashboardStats);
}
