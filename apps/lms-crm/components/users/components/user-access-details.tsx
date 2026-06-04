'use client';

import { Card, CardContent } from "@/components/ui/card";

export function UserAccessDetails({ user }: { user: any }) {
  const items = [
    {
      label: "Identifiant",
      info: user?.id ? user.id.substring(0, 8) : '-', 
    }, 
    {
      label: "Catégorie",
      info: user.userCategory || 'INTERNAL', 
    }, 
    {
      label: "Fonction",
      info: user.jobFunction || '-', 
    }, 
    {
      label: "Permissions",
      info: "Héritées du rôle " + (user.role?.name || 'Standard'), 
    }
  ];  

  return (
    <Card className="bg-accent/70 rounded-md shadow-none h-full flex flex-col"> 
      <CardContent className="p-0 flex flex-col h-full"> 
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Détails de l'accès</h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-6 px-3.5 space-y-5 h-full">
          {items.map((item, index) => (
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
