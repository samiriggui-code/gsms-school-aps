'use client';

import Link from 'next/link';
import { ExternalLink, BookOpen } from 'lucide-react';
import { ModuleWorkspacePage } from '@/components/workspace/module-workspace-page';
import { Container } from '@/components/common/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generalSettings } from '@/config/general.config';

const docsOrigin = generalSettings.docsLink.replace(/\/introduction$/, '');

const DOC_LINKS = [
  {
    title: 'Aide — catalogue formations',
    href: generalSettings.docsHelpCatalogLink,
    description: 'Rôle de l’écran CRM et liens vers tickets et catalogue.',
  },
  {
    title: 'Catalogue formations (CRM)',
    href: `${docsOrigin}/crm/catalogue-formations`,
    description: 'Création et publication des fiches catalogue.',
  },
  {
    title: 'Dépannage utilisateurs',
    href: `${docsOrigin}/lms/depannage-utilisateurs`,
    description: 'Procédures support et résolution des blocages.',
  },
  {
    title: 'Maintenance & exploitation',
    href: `${docsOrigin}/lms/maintenance-exploitation`,
    description: 'Exploitation technique et incidents système.',
  },
] as const;

export function CatalogueAidePage() {
  return (
    <Tabs defaultValue="catalogue" className="w-full">
      <Container className="pb-0">
        <TabsList className="mb-4">
          <TabsTrigger value="catalogue">Fiches catalogue</TabsTrigger>
          <TabsTrigger value="documentation">Guide école</TabsTrigger>
        </TabsList>
      </Container>

      <TabsContent value="catalogue" className="mt-0 space-y-0">
        <Container className="pb-4">
          <Alert>
            <BookOpen className="size-4" />
            <AlertTitle>Catalogue formations (aide)</AlertTitle>
            <AlertDescription>
              Les fiches listées proviennent du catalogue formations actif — ce n&apos;est pas une FAQ
              autonome. La documentation complète (procédures, support) est dans l&apos;onglet
              guide école intégré ou via{' '}
              <Link href={generalSettings.docsLink} className="font-medium text-primary underline">
                le guide école
              </Link>
              .
            </AlertDescription>
          </Alert>
        </Container>
        <ModuleWorkspacePage viewKey="support-base-aide" />
      </TabsContent>

      <TabsContent value="documentation" className="mt-0">
        <Container className="space-y-5 pb-8 lg:space-y-7.5">
          <Alert variant="secondary">
            <AlertDescription>
              Ouvrez la documentation intégrée (<code className="text-xs">/docs</code>) pour les
              procédures détaillées. Les fiches catalogue restent dans l&apos;onglet « Fiches
              catalogue ».
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DOC_LINKS.map((item) => (
              <Card key={item.href} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={item.href}>
                      <ExternalLink className="size-4" />
                      Ouvrir la documentation
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </TabsContent>
    </Tabs>
  );
}
