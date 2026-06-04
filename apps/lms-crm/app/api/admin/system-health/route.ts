import { NextResponse } from 'next/server';
import { redis, isRedisCacheDisabled } from '@repo/redis';
import prisma from '@/lib/prisma';
import os from 'os';

export async function GET() {
  try {
// 1. Node.js Stats
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000;
    const nodeStats = {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
      cpuUsage: Math.min(100, Math.round(cpuPercent)),
      uptime: Math.round(process.uptime()),
      cpus: os.cpus().length,
      platform: process.platform,
    };

    // 2. Redis Stats
    let redisStats: {
      status: string;
      info: { usedMemory: string; connectedClients: string; uptimeDays: string } | null;
    } = { status: 'disconnected', info: null };
    if (isRedisCacheDisabled()) {
      redisStats = {
        status: 'memory',
        info: {
          usedMemory: 'in-process (REDIS_CACHE_DISABLED)',
          connectedClients: '0',
          uptimeDays: '—',
        },
      };
    } else {
      try {
        const info = await redis.info();
        const usedMemory = info.match(/used_memory_human:(.*)/)?.[1] || 'N/A';
        const connectedClients = info.match(/connected_clients:(.*)/)?.[1] || 'N/A';
        const uptimeDays = info.match(/uptime_in_days:(.*)/)?.[1] || 'N/A';

        redisStats = {
          status: 'connected',
          info: {
            usedMemory,
            connectedClients,
            uptimeDays,
          },
        };
      } catch (err) {
        console.error('[SystemHealth] Redis error:', err);
      }
    }

    // 3. PostgreSQL Stats
    let dbStats = { status: 'disconnected', size: 'N/A' };
    try {
      const result = await prisma.$queryRawUnsafe<{ size: string }[]>(
        "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
      );
      dbStats = {
        status: 'connected',
        size: result[0]?.size || 'N/A'
      };
    } catch (err) {
      console.error('[SystemHealth] DB error:', err);
    }

    return NextResponse.json({
      success: true,
      node: nodeStats,
      redis: redisStats,
      postgres: dbStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SystemHealth] Global error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
