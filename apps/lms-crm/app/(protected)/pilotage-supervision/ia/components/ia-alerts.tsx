'use client';

import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';

export function IaAlerts() {
  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="border-b border-dashed py-3.5">
        <CardTitle className="text-base font-bold uppercase text-foreground">Chantier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-2">
          <Badge variant="warning">En construction</Badge>
          <Badge variant="secondary">GSMS-AI</Badge>
        </div>
        <p>
          Hub opérationnel prêt : stats + aperçu artefacts. Les feuilles Brouillons / Historique
          accueilleront les DataGrid complets (approve / apply).
        </p>
      </CardContent>
    </Card>
  );
}
