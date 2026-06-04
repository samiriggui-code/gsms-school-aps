'use client';

import { AvatarInput } from '@/partials/common/avatar-input';
import { SquarePen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export function UserPersonalInfo({ user }: { user: any }) {
  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
      </CardHeader>
      <CardContent className="kt-scrollable-x-auto pb-3 p-0">
        <Table className="align-middle text-sm text-muted-foreground">
          <TableBody>
            <TableRow>
              <TableCell className="py-2 min-w-28 text-secondary-foreground font-normal">
                Photo
              </TableCell>
              <TableCell className="py-2 text-gray700 font-normal min-w-32 text-sm">
                {user?.avatar ? 'Image existante' : '150x150px JPEG, PNG Image'}
              </TableCell>
              <TableCell className="py-2 text-center">
                <div className="flex justify-center items-center">
                  <AvatarInput />
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                Nom complet
              </TableCell>
              <TableCell className="py-2 text-foreground font-normal text-sm">
                {user?.name || 'N/A'}
              </TableCell>
              <TableCell className="py-2 text-center">
                <Badge variant="outline" className="uppercase">
                  {user?.status || 'inconnu'}
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                Email
              </TableCell>
              <TableCell className="py-2 text-foreground font-normal">
                {user?.email || 'N/A'}
              </TableCell>
              <TableCell className="py-2 text-center">
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${user?.email || '#'}`}>Message</a>
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                Téléphone
              </TableCell>
              <TableCell className="py-2 text-foreground font-normal">
                {user?.phone || 'Non renseigné'}
              </TableCell>
              <TableCell className="py-2 text-center">
                <Button variant="outline" size="sm">
                  <SquarePen size={14} className="mr-1" />
                  Editer
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
