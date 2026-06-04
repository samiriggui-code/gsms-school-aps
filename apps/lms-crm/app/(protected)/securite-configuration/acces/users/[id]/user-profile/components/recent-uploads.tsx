'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface RecentUploadsProps {
  title?: string;
}

const mockFiles = [
  { id: '1', name: 'identity-card.pdf', size: '1.2 MB' },
  { id: '2', name: 'contract-2026.pdf', size: '860 KB' },
  { id: '3', name: 'insurance-proof.png', size: '540 KB' },
];

export function RecentUploads({ title = 'Recent uploads' }: RecentUploadsProps) {
  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{file.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{file.size}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
