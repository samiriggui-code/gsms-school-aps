'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { findCrmModule, findCrmSection } from '@/config/crm-sitemap';

/** Landing module — cards vers les feuilles (niveau 2). */
export function CrmModulePage({ path }: { path: string }) {
  const mod = findCrmModule(path);
  const section = findCrmSection(path);

  if (!mod || mod.path !== path) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Module introuvable</ToolbarTitle>
            <ToolbarDescription>Ce module n’est plus dans le plan CRM.</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{mod.title}</ToolbarTitle>
            <ToolbarDescription>{mod.description}</ToolbarDescription>
          </ToolbarHeading>
          {section ? (
            <ToolbarActions>
              <Button asChild variant="ghost" size="sm">
                <Link href={section.path}>← {section.title}</Link>
              </Button>
            </ToolbarActions>
          ) : null}
        </Toolbar>
      </Container>
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mod.leaves.map((leaf) => (
            <Card key={leaf.path} className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{leaf.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{leaf.description}</p>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={leaf.path}>
                    Ouvrir
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
