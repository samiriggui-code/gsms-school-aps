'use client';

import { Card, CardContent } from "@repo/ui/card";
import { User as Formation } from "@/app/models/user";

export function FormationAccessDetails({ Formation }: { Formation: Formation }) {
  const item = [
    {
      label: "Identifiant",
      info: Formation.id.substring(0, 8), 
    }, 
    {
      label: "CatÃ©gorie",
      info: Formation.userCategory, 
    }, 
    {
      label: "Fonction",
      info: Formation.jobFunction || '-', 
    }, 
    {
      label: "Permissions",
      info: "HÃ©ritÃ©es du rÃ´le " + (Formation.role?.name || 'Standard'), 
    }
  ];  

  return (
    <Card className="bg-accent/70 rounded-md shadow-none h-full flex flex-col"> 
      <CardContent className="p-0 flex flex-col h-full"> 
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">DÃ©tails de l'accÃ¨s</h3>
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

