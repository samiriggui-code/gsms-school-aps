'use client';

import { Card, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Separator } from '@repo/ui/separator';
import { Banknote, Building2, GraduationCap, Landmark } from 'lucide-react';
import type { FundingChannelRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

function channelGlyph(row: FundingChannelRow) {
  const k = row.iconKey?.toLowerCase() ?? '';
  if (k.includes('building') || k.includes('opco') || k.includes('entreprise')) {
    return <Building2 className="size-6 text-primary" />;
  }
  if (k.includes('landmark') || k.includes('bank') || k.includes('france')) {
    return <Landmark className="size-6 text-primary" />;
  }
  if (k.includes('graduation') || k.includes('school')) {
    return <GraduationCap className="size-6 text-primary" />;
  }
  return <Banknote className="size-6 text-primary" />;
}

type Props = {
  channels: FundingChannelRow[];
};

export function PaymentMethods({ channels }: Props) {
  return (
    <Card className="bg-accent/70 rounded-md shadow-none">
      <CardContent className="p-0">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Modes de Prise en Charge</h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-1 px-3.5">
          {channels.map((method, index) => (
            <div key={`${method.name}-${index}`}>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-md bg-background border border-border size-10 shrink-0 overflow-hidden">
                    <div className="flex items-center justify-center bg-white rounded-md size-full">
                      {method.logo?.trim() ? (
                        <img
                          src={method.logo}
                          alt=""
                          className="max-w-full max-h-full object-contain p-1"
                        />
                      ) : (
                        channelGlyph(method)
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm truncate">{method.name}</span>
                      {method.isPrimary ? (
                        <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded shrink-0">
                          Conseillé
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-2sm font-normal text-secondary-foreground/70">{method.details}</span>
                  </div>
                </div>
              </div>
              {index < channels.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
