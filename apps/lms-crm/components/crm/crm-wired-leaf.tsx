'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@repo/ui/button';
import {
  findCrmLeaf,
  findCrmModule,
  findCrmSection,
} from '@/config/crm-sitemap';

/**
 * Shell branché — toolbar pour section, module ou feuille.
 * level=section : landing racine ; level=module : landing module ;
 * level=leaf (défaut) : sous-module. Même chrome aux 3 paliers.
 */
export function CrmWiredLeaf({
  path,
  children,
  actions,
  level = 'leaf',
}: {
  path: string;
  children: ReactNode;
  actions?: ReactNode;
  level?: 'section' | 'module' | 'leaf';
}) {
  const section = findCrmSection(path);
  const mod = findCrmModule(path);
  const leaf = findCrmLeaf(path);

  const title =
    level === 'section'
      ? (section?.title ?? 'Section CRM')
      : level === 'module'
        ? (mod?.title ?? 'Module CRM')
        : (leaf?.title ?? 'Page CRM');
  const description =
    level === 'section'
      ? (section?.description ?? '')
      : level === 'module'
        ? (mod?.description ?? '')
        : (leaf?.description ?? '');

  const backHref =
    level === 'section' ? undefined : level === 'module' ? section?.path : (mod?.path ?? section?.path);
  const backLabel =
    level === 'section' ? undefined : level === 'module' ? section?.title : (mod?.title ?? section?.title);
  const showBack = Boolean(backHref && backLabel && backHref !== path);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            {description ? <ToolbarDescription>{description}</ToolbarDescription> : null}
          </ToolbarHeading>
          <ToolbarActions>
            {actions}
            {showBack ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={backHref!}>← {backLabel}</Link>
              </Button>
            ) : null}
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container className="pb-8">{children}</Container>
    </>
  );
}
