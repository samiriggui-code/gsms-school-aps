'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useOvtSheetContent } from '../content';

export function OvtStatistics4() {
  const content = useOvtSheetContent();
  const stats = content.t(`${content.path}.stats4`, { returnObjects: true }) as {
    items: { total: string; label: string }[];
    note?: string;
  };

  return (
    <div className="space-y-4">
      <SheetStatGrid items={stats.items} columnsClassName="sm:grid-cols-4" />
      {stats.note ? (
        <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3 flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-1.5 shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">{stats.note}</p>
        </div>
      ) : null}
    </div>
  );
}
