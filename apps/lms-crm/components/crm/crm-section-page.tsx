'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { findCrmSection, type CrmSection } from '@/config/crm-sitemap';

/** Landing section — cards vers les modules (niveau 1). */
export function CrmSectionPage({ path }: { path: string }) {
  const section = findCrmSection(path);
  if (!section || section.path !== path) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Section introuvable</ToolbarTitle>
            <ToolbarDescription>Ce hub n’est plus dans le plan CRM.</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
    );
  }
  return <CrmSectionHub section={section} />;
}

function CrmSectionHub({ section }: { section: CrmSection }) {
  const Icon = section.icon;
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle className="inline-flex items-center gap-2">
              <Icon className="size-5" />
              {section.title}
            </ToolbarTitle>
            <ToolbarDescription>{section.description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {section.modules.map((mod) => (
            <Card key={mod.path} className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base font-medium">
                  <span>{mod.title}</span>
                  <Badge variant="secondary" className="font-normal">
                    {mod.leaves.length} pages
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{mod.description}</p>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={mod.path}>
                    Accéder
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
