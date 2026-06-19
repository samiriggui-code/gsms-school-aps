'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';
import { apiFetch } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, LoaderCircle, Package, RotateCcw, Wrench } from 'lucide-react';

export function EquipmentWelcomeCallout() {
  const queryClient = useQueryClient();

  const releaseSessionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        '/api/sections/gestion-ressources/equipements/lifecycle/release-sessions',
        { method: 'POST' },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || j?.message || 'Libération impossible');
      }
      return res.json();
    },
    onSuccess: (json) => {
      const msg = json?.data?.message ?? 'Matériel des sessions terminées libéré.';
      toast.success(msg);
      void queryClient.invalidateQueries({ queryKey: ['equipment-dashboard-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-affectations'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Fragment>
      <style>
        {`
          .equipment-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .equipment-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat equipment-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <div className="flex -space-x-2.5">
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-1.png')} />
                  <AvatarFallback>1</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} />
                  <AvatarFallback>2</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-3.png')} />
                  <AvatarFallback>3</AvatarFallback>
                </Avatar>
                <Avatar className="size-10 ring-2 ring-background bg-primary text-white text-xs">
                  <AvatarFallback>+12</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Module <span className="text-primary">Équipements</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Gérez votre parc et votre inventaire en temps réel.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-ressources/equipements/inventaire">
              <Package className="size-4 shrink-0" />
              Inventaire
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-ressources/equipements/affectations">
              <Calendar className="size-4 shrink-0" />
              Affectations
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-ressources/equipements/maintenance">
              <Wrench className="size-4 shrink-0" />
              Maintenance
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="min-w-0 shrink"
            disabled={releaseSessionsMutation.isPending}
            onClick={() => releaseSessionsMutation.mutate()}
            title="Remet en stock le matériel des sessions catalogue terminées"
          >
            {releaseSessionsMutation.isPending ? (
              <LoaderCircle className="size-4 shrink-0 animate-spin" />
            ) : (
              <RotateCcw className="size-4 shrink-0" />
            )}
            Libérer sessions terminées
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
