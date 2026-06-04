'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Statistics3({
  price,
  cpfLine,
  qualiopiLine,
  financementsLine,
  cpfIsEligible = false,
}: {
  price: string;
  cpfLine: string;
  qualiopiLine: string;
  financementsLine: string;
  /** Affiche un badge « réf. » sur la tuile financement / CPF lorsque l’offre est éligible. */
  cpfIsEligible?: boolean;
}) {
  const items = [
    { total: price, label: 'Prix à partir de (Net de taxe)', showBadge: false },
    { total: cpfLine, label: 'Mon Compte Formation / financement', showBadge: cpfIsEligible },
    { total: qualiopiLine, label: 'Qualité / cadre', showBadge: false },
    { total: financementsLine, label: 'Autres financements', showBadge: false },
  ];

  return (
    <Card className="rounded-md mb-5 bg-accent/70 p-1">
      <CardContent className="rounded-md p-0 bg-background border border-border">
        <div className="grid sm:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col px-4 py-3 ${index > 0 ? 'sm:border-s border-border' : ''}`}
            >
              <div className="flex items-center flex-wrap gap-1">
                <span className="font-semibold text-foreground text-xl leading-6">{item.total}</span>
                {item.showBadge ? (
                  <Badge variant="success" appearance="light" className="text-[10px] px-1.5 py-0 h-4">
                    CPF
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
