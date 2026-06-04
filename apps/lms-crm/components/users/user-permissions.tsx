'use client';

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Info } from "lucide-react";

export function UserPermissions({ user }: { user: any }) {
  const permissions = user?.role?.permissions || [];

  return (
    <div className="space-y-5">
      <Card className="bg-accent/70 rounded-md shadow-none"> 
        <CardContent className="p-0 flex flex-col"> 
          <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Permissions effectives</h3>
          <div className="bg-background rounded-md m-1 mt-0 border border-input p-4">
            {permissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissions.map((permission: any) => (
                  <div 
                    key={permission.id} 
                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-accent/30"
                  >
                    <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground leading-none">
                        {permission.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                        {permission.description || permission.slug}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="size-10 rounded-full bg-accent flex items-center justify-center mb-3">
                  <Info className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Aucune permission directe</p>
                <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                  Cet utilisateur n'a aucune permission spécifique associée à son rôle actuel.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
