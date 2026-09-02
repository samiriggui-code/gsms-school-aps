'use client';

import { Card, CardContent } from "@repo/ui/card";
import { User as Collaborateur } from "@/app/models/user";

export function CollaborateurAccessDetails({ collaborateur }: { collaborateur: Collaborateur }) {
  const item = [
    {
      label: "Identifiant",
      info: collaborateur.id.substring(0, 8), 
    }, 
    {
      label: "Catégorie",
      info: collaborateur.userCategory, 
    }, 
    {
      label: "Fonction",
      info: collaborateur.jobFunction || '-', 
    }, 
    {
      label: "Permissions",
      info: "Héritées du rôle " + (collaborateur.role?.name || 'Standard'), 
    }
  ];  

  return (
    <Card className="bg-accent/70 rounded-md shadow-none h-full flex flex-col"> 
      <CardContent className="p-0 flex flex-col h-full"> 
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Détails de l'accès</h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-6 px-3.5 space-y-5 h-full">
          {item.map((item, index) => (
            <div key={index} className="flex gap-2 lg:gap-10">
              <span className="basis-1/4 text-xs font-normal text-secondary-foreground/80 leading-6">{item.label}</span>
              <span className="basis-2/4 text-2sm font-semibold text-foreground leading-6">{item.info}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
