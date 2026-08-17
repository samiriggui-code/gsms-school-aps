'use client';

import { Container } from '@/components/common/container';
import type { HelpAudience } from '@/partials/common/help';
import { Help } from '@/partials/common/help';
import { cn } from '@/lib/utils';

/**
 * Cartes « Questions ? » + « Contacter le support » — injectées une fois par layout
 * (`demo1`, formateur, portail stagiaire, paramètres système).
 */
export function UserManagementSupportSection({
  className,
  audience = 'crm',
}: {
  className?: string;
  audience?: HelpAudience;
}) {
  return (
    <section
      aria-label="Aide et support"
      className={cn('crm-page-help-footer shrink-0 w-full', className)}
    >
      <div className="h-16 min-h-16 lg:h-24 lg:min-h-24" aria-hidden />
      <div className="border-t border-border/60 bg-muted/10 pt-10 pb-10 lg:pt-12 lg:pb-12">
        <Container>
          <Help audience={audience} />
        </Container>
      </div>
    </section>
  );
}
