'use client';

import { useUser } from '../../components/user-context';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SquarePen } from 'lucide-react';
import {
  userIamLoginSubtitle,
  userPersonalMailbox,
} from '@/lib/user-email-routing';

interface IBasicSettingsProps {
  title: string;
}

const BasicSettings = ({ title }: IBasicSettingsProps) => {
  const { user } = useUser();
  
  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-update" className="text-sm">
            Public Profile
          </Label>
          <Switch defaultChecked={user?.isPublic} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="kt-scrollable-x-auto pb-3 p-0">
        <Table className="align-middle text-sm text-muted-foreground">
          <TableBody>
            <TableRow>
              <TableCell className="py-2 min-w-36 text-secondary-foreground font-normal">
                Email professionnel
              </TableCell>
              <TableCell className="py-2 min-w-60">
                <a
                  href={`mailto:${userIamLoginSubtitle(user)}`}
                  className="text-foreground font-normal text-sm hover:text-primary-active"
                >
                  {userIamLoginSubtitle(user)}
                </a>
              </TableCell>
              <TableCell className="py-2 max-w-16 text-end">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 min-w-36 text-secondary-foreground font-normal">
                Email personnel
              </TableCell>
              <TableCell className="py-2 min-w-60">
                <a
                  href={`mailto:${userPersonalMailbox(user) || '#'}`}
                  className="text-foreground font-normal text-sm hover:text-primary-active"
                >
                  {userPersonalMailbox(user) ?? 'N/A'}
                </a>
              </TableCell>
              <TableCell className="py-2 max-w-16 text-end">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                Last Sign In
              </TableCell>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
              </TableCell>
              <TableCell className="py-2 text-end">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-3.5 text-secondary-foreground font-normal">
                Status
              </TableCell>
              <TableCell className="py-3.5 text-secondary-foreground font-normal">
                {user?.status || 'N/A'}
              </TableCell>
              <TableCell className="py-3 text-end">
                <Button variant="ghost" mode="icon">
                  <SquarePen size={16} className="text-indigo-500" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-secondary-foreground font-normal">
                Role
              </TableCell>
              <TableCell className="py-0.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{user?.role?.name || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-end">
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

export { BasicSettings };
