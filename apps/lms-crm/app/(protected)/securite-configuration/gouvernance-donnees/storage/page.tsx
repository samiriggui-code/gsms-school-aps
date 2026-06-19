'use client';

import { Suspense } from 'react';
import { Container } from '@/components/common/container';
import { StorageSoclePanel } from '../components/storage-socle-panel';
import { FileManager } from '../components/file-manager';

export default function Page() {
  return (
    <div className="space-y-5 pb-8">
      <Suspense fallback={null}>
        <FileManager />
      </Suspense>
      <Container>
        <StorageSoclePanel />
      </Container>
    </div>
  );
}
