'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@repo/ui/skeleton';

const SystemUsageCharts = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await apiFetch('/api/admin/system-health');
        if (response.ok) {
          setData(await response.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;
  if (!data) return null;

  const memData = [
    { name: 'Utilisée (Heap)', value: data.node.memory.heapUsed, color: '#0088FE' },
    { name: 'Libre (Heap)', value: data.node.memory.heapTotal - data.node.memory.heapUsed, color: '#00C49F' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Répartition Mémoire Node.js (Heap)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} MB`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Détails Ressources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-muted-foreground text-sm">OS Platform</span>
            <span className="font-mono text-sm uppercase">{data.node.platform}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-muted-foreground text-sm">Redis Memory</span>
            <span className="font-mono text-sm">{data.redis.info?.usedMemory || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-muted-foreground text-sm">Database Size</span>
            <span className="font-mono text-sm">{data.postgres.size}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Connected Clients (Redis)</span>
            <span className="font-mono text-sm">{data.redis.info?.connectedClients || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { SystemUsageCharts };
