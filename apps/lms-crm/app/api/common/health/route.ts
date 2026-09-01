import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function n8nWebhookConfigured(): boolean {
  const standard = (process.env.N8N_WEBHOOK_STANDARD_URL ?? '').trim();
  const base = (process.env.N8N_WEBHOOK_BASE ?? '').trim();
  return Boolean(standard || base);
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let db: 'up' | 'down' = 'down';
  let sessionAutomationRunsLast24h: number | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'up';
    sessionAutomationRunsLast24h = await prisma.sessionAutomationRun.count({
      where: { startedAt: { gte: since } },
    });
  } catch {
    db = 'down';
    sessionAutomationRunsLast24h = null;
  }

  const healthy = db === 'up';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp,
      db,
      n8nWebhookConfigured: n8nWebhookConfigured(),
      sessionAutomationRunsLast24h,
    },
    { status: healthy ? 200 : 503 },
  );
}
