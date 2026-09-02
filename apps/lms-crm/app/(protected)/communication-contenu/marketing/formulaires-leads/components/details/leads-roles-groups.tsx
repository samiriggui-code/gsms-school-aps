'use client';

import { useState } from "react";
import { Card, CardContent } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Separator } from "@repo/ui/separator";
import { ShieldCheck, UserCog, LoaderCircleIcon } from "lucide-react";
import { User as Etudiant, UserRole } from "@/app/models/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogBody
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { useRoleSelectQuery } from "@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query";

export function EtudiantRolesGroups({ Etudiant }: { Etudiant: Etudiant }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(Etudiant.role?.id || "");
  const queryClient = useQueryClient();
  const { data: roleList } = useRoleSelectQuery();

  const mutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/Etudiants/${Etudiant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'etudiants'] });
      queryClient.invalidateQueries({ queryKey: ['user', Etudiant.id] });
      toast.success("RÃ´le mis Ã  jour avec succÃ¨s");
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const roles = [
    {
      icon: <ShieldCheck className="size-5 text-green-600" />,
      name: Etudiant.role?.name || "Utilisateur Standard",
      details: "RÃ´le principal - Tous droits d'accÃ¨s standard",
      isPrimary: true
    },
    {
      icon: <UserCog className="size-5 text-indigo-600" />,
      name: "AccÃ¨s Mobile",
      details: "Autorise a se connecter via l'application LMS",
      isPrimary: false
    }
  ];

  const handleUpdateRole = () => {
    mutation.mutate(selectedRoleId);
  };

  return (
    <>
      <Card className="bg-accent/70 rounded-md shadow-none h-full"> 
        <CardContent className="p-0 flex flex-col h-full"> 
          <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">RÃ´les et Groupes</h3>
          <div className="bg-background rounded-md m-1 mt-0 border border-input py-1 px-3.5 flex-1">
            {roles.map((role, index) => (
              <div key={index}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-md bg-background border border-border size-10 shrink-0">
                      <div className="flex items-center justify-center bg-accent/70 rounded-md size-[34px]">
                        {role.icon}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{role.name}</span>
                        {role.isPrimary && (
                          <Badge className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded uppercase font-bold border-none">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-normal text-secondary-foreground/70">{role.details}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs font-bold border-gray-200"
                    onClick={() => role.isPrimary && setIsDialogOpen(true)}
                  >
                    GÃ©rer
                  </Button>
                </div>
                {index < roles.length - 1 && <Separator className="opacity-50" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le rÃ´le principal</DialogTitle>
          </DialogHeader>
          <DialogBody className="py-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                SÃ©lectionnez le nouveau rÃ´le principal pour <strong>{Etudiant.name}</strong>. Cela affectera ses permissions d'accÃ¨s.
              </p>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rÃ´le" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(roleList) && roleList.map((role: UserRole) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleUpdateRole} 
              disabled={mutation.isPending || selectedRoleId === Etudiant.role?.id}
            >
              {mutation.isPending && <LoaderCircleIcon className="animate-spin size-4 mr-2" />}
              Mettre Ã  jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



