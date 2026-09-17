'use client';

import Link from 'next/link';
import { Construction } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';
import { findCrmLeaf, findCrmModule, findCrmSection } from '@/config/crm-sitemap';

/**
 * Shell de feuille CRM (niveau 3) — À brancher module par module.
 * Retour = module parent, pas la section.
 */
export function CrmLeafPage({ path }: { path: string }) {
  const leaf = findCrmLeaf(path);
  const mod = findCrmModule(path);
  const section = findCrmSection(path);

  const title = leaf?.title ?? 'Page CRM';
  const description =
    leaf?.description ?? 'Cette page sera recâblée dans le nouveau plan modules.';

  const backHref = mod?.path ?? section?.path;
  const backLabel = mod?.title ?? section?.title;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle className="inline-flex items-center gap-2">
              {title}
              <Badge variant="secondary" className="font-normal">
                À brancher
              </Badge>
            </ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          {backHref && backLabel ? (
            <ToolbarActions>
              <Button asChild variant="ghost" size="sm">
                <Link href={backHref}>← {backLabel}</Link>
              </Button>
            </ToolbarActions>
          ) : null}
        </Toolbar>
      </Container>
      <Container className="pb-8">
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <Construction className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Écran réinitialisé</p>
              <p className="max-w-xl text-sm text-muted-foreground">
                Feuille CRM (niveau 3). Le métier se reconstruit module par
                module — landings section/module restent en place.
              </p>
              <p className="text-xs text-muted-foreground font-mono">{path}</p>
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
