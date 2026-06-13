'use client';

import { BookOpen, Layers, Sparkles } from 'lucide-react';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { cn } from '@/lib/utils';

type PlaceholderProps = {
  title: string;
  description: string;
  phase: string;
  features: string[];
};

export function InstructorPlaceholderPage({ title, description, phase, features }: PlaceholderProps) {
  return (
    <PortalPageShell>
      <PortalPageHero title={title} description={description} />

      <PortalSection title={`Phase ${phase} — prochainement`} className="mt-8">
        <div className="rounded-xl border border-dashed bg-muted/30 p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className={portalSectionTitle}>Fonctionnalités prévues</p>
              <ul className={cn('mt-3 space-y-2', portalMuted)}>
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Layers className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className={cn('mt-4 flex items-center gap-1.5', portalMuted)}>
                <BookOpen className="size-3.5" />
                En attendant, consultez le tableau de bord pour vos sessions assignées.
              </p>
            </div>
          </div>
        </div>
      </PortalSection>
    </PortalPageShell>
  );
}
