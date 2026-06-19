'use client';

import { useUser } from '../../components/user-context';
import { SquarePen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

const Work = () => {
  const { user } = useUser();
  
  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>Work</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-update" className="text-sm">
            Available now
          </Label>
          <Switch defaultChecked={user?.status === 'ACTIVE'} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="kt-scrollable-x-auto pb-3 p-0">
        <Table className="align-middle text-sm text-muted-foreground">
          <TableBody>
            <TableRow>
              <TableCell className="py-2 min-w-36text-secondary-foreground font-normal">
                Role
              </TableCell>
              <TableCell className="py-2 min-w-72 w-full text-foreground font-normal">
                {user?.role?.name || 'N/A'}
              </TableCell>
              <TableCell className="py-2 text-end min-w-24">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                Status
              </TableCell>
              <TableCell className="py-2 text-foreground font-normal">
                {user?.status || 'N/A'}
              </TableCell>
              <TableCell className="py-2 text-end">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                Department
              </TableCell>
              <TableCell className="py-2 text-foreground font-normal">
                {user?.userCategory || 'N/A'}
              </TableCell>
              <TableCell className="py-2 text-end">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-3 text-secondary-foreground font-normal">
                Email
              </TableCell>
              <TableCell className="py-3 text-foreground font-normal">
                {user?.email || 'N/A'}
              </TableCell>
              <TableCell className="py-3 text-end">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export { Work };
