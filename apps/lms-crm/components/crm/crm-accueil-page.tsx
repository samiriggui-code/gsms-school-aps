'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { CRM_ACCUEIL, CRM_SECTIONS } from '@/config/crm-sitemap';

/** Accueil CRM — liens vers les sections, plus de second menu géant. */
export function CrmAccueilPage() {
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{CRM_ACCUEIL.title}</ToolbarTitle>
            <ToolbarDescription>{CRM_ACCUEIL.description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CRM_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.path} className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Icon className="size-4 shrink-0" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {section.modules.length} modules ·{' '}
                    {section.modules.reduce((n, m) => n + m.leaves.length, 0)} pages
                  </p>
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={section.path}>
                      Ouvrir
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </>
  );
}
