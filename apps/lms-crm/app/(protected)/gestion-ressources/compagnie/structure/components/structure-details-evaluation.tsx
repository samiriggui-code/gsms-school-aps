'use client';

import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Calendar, Settings, Star } from 'lucide-react';

export function StructureDetailsEvaluation({ structure }: { structure: any }) {
  return (
    <div className="space-y-5">
      <Alert variant="info" appearance="light">
        <AlertIcon>
          <Star className="size-4" />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>Evaluation automatique (KPI)</AlertTitle>
          <AlertDescription>
            Le score est calcule automatiquement a partir des KPI du module
            Performance. L&apos;historique est derive des indicateurs disponibles.
          </AlertDescription>
        </AlertContent>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score global</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">-</div>
            <Badge
              variant="secondary"
              appearance="light"
              className="uppercase text-[10px] font-bold tracking-wider"
            >
              Auto KPI
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Derniere evaluation</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Aucune</div>
            <Calendar className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mode d&apos;evaluation</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Automatique (KPI)</div>
            <Settings className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique des evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Les evaluations sont calculees automatiquement selon les KPI.
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/accueil">
            Voir le module KPI
          </Link>
        </Button>
      </div>
    </div>
  );
}
