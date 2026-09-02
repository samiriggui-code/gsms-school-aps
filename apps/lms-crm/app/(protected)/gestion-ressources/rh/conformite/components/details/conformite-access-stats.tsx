'use client';

import { Card, CardContent } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { User as Conformite } from "@/app/models/user";

export function ConformiteAccessStats({ conformite }: { conformite: Conformite }) {
  const items = [
    { 
      total: conformite.role?.name || 'Aucun rôle', 
      label: 'Rôle principal assigné'
    }, 
    { 
      total: 'Lecture/Écriture', 
      label: 'Niveau d\'accès'
    }, 
    { 
      total: 'Activé', 
      label: 'Accès API'
    }, 
    { 
      total: conformite.emailVerified ? 'Vérifié' : 'Non vérifié', 
      label: 'Statut de sécurité'
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
                    Actif
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
