'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { VIE_SCOLAIRE_SHEET_COMPACT } from '../../../constants/sheet-shell-classes';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Building2, LayoutGrid, Loader2, UserPlus, Shield } from 'lucide-react';

const OrgUnitSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  type: z.string().min(1, "Le type est requis"),
  parentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
});

type OrgUnitSchemaType = z.infer<typeof OrgUnitSchema>;

interface OrgUnitAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
}

export function OrgUnitAddSheet({ open, onOpenChange, parentId: initialParentId }: OrgUnitAddSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const form = useForm<OrgUnitSchemaType>({
    resolver: zodResolver(OrgUnitSchema),
    defaultValues: {
      name: '',
      type: 'SERVICE',
      parentId: initialParentId || null,
      managerId: null,
      positionId: null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        type: 'SERVICE',
        parentId: initialParentId || null,
        managerId: null,
        positionId: null,
      });
    }
  }, [open, initialParentId, form]);

  const { data: orgUnitsData } = useQuery({
    queryKey: ['org-units-simple'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/org-units');
      return response.json();
    },
    enabled: open,
  });

  const { data: positionsData } = useQuery({
    queryKey: ['positions-simple'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/positions');
      return response.json();
    },
    enabled: open,
  });

  const { data: collaboratorsData } = useQuery({
    queryKey: ['collaborateurs-simple'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs?limit=1000');
      return response.json();
    },
    enabled: open,
  });

  const orgUnits = Array.isArray(orgUnitsData?.data) ? orgUnitsData.data : [];
  const positions = Array.isArray(positionsData?.data) ? positionsData.data : [];
  const collaborators = Array.isArray(collaboratorsData?.data) ? collaboratorsData.data : [];

  const mutation = useMutation({
    mutationFn: async (values: OrgUnitSchemaType) => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/org-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to create org unit');
      return response.json();
    },
    onSuccess: () => {
      toast.success(t('teams.unitCreated'));
      queryClient.invalidateQueries({ queryKey: ['org-units-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['org-units-simple'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t('teams.unitCreateFailed'));
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_COMPACT}>
        <SheetHeader className="border-b py-4 px-5 border-border bg-muted/30">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
            <Building2 className="size-4" />
            Nouvelle Unité RH
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-2sm font-semibold">Nom de l'unité</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Agence Paris Nord" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-2sm font-semibold">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DIRECTION">Direction</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="POLE">Pôle</SelectItem>
                      <SelectItem value="CAMPUS">Campus</SelectItem>
                      <SelectItem value="SITE">Site</SelectItem>
                      <SelectItem value="DIRECTION">Direction</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-2sm font-semibold">Parent (Optionnel)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun (Unité racine)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucun (Unité racine)</SelectItem>
                      {orgUnits.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-2sm font-semibold flex items-center gap-2">
                      <UserPlus className="size-3.5" />
                      Responsable
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un agent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {collaborators.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-2sm font-semibold flex items-center gap-2">
                      <Shield className="size-3.5" />
                      Rôle / Position
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {positions.map((pos: any) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={mutation.status === 'pending'}>
                {mutation.status === 'pending' ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                Créer l'unité
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
