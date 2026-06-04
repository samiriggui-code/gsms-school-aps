'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as Inventaire } from "@/app/models/user";

export function InventaireAccessStats({ inventaire }: { inventaire: Inventaire }) {
  const items = [
    { 
      total: inventaire.role?.name || 'Aucune catégorie', 
      label: 'Catégorie principale'
    }, 
    { 
      total: 'Disponible', 
      label: 'État d\'utilisation'
    }, 
    { 
      total: 'Actif', 
      label: 'Statut inventaire'
    }, 
    { 
      total: inventaire.emailVerified ? 'Vérifié' : 'À contrôler', 
      label: 'Contrôle technique'
    }
  ];

  return (
    <Card className="rounded-md mb-5 bg-accent/70 p-1">
      <CardContent className="rounded-md p-0 bg-background border border-border">
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => ( 
            <div key={index} className={`${index === 0 ? 'flex-2' : 'flex-1'} flex flex-col px-4.5 py-3 gap-2 ${index > 0 ? 'sm:border-s border-border' : ''}`}>
              <div className="flex items-center flex-wrap gap-1">
                <span className={`font-semibold text-foreground ${index === 0 ? 'text-xl leading-6' : 'text-base leading-5'}`}>
                  {item.total} 
                </span>
                {index === 0 && (
                  <Badge variant="success" appearance="light" size="sm">
                    En stock
                  </Badge>
                )}
              </div>
              <span className="text-xs font-normal text-secondary-foreground/70">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
