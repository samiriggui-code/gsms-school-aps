'use client';

import { useUser } from '../../components/user-context';
import { cn } from '@/lib/utils';
import { HexagonBadge } from '@/partials/common/hexagon-badge';
import { DropdownMenu2 } from '@/partials/dropdown-menu/dropdown-menu-2';
import {
  CircleAlert,
  MessagesSquare,
  Truck,
  Volleyball,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ICommunityBadgesItem {
  title: string;
  stroke: string;
  fill: string;
  icon: LucideIcon;
  iconColor: string;
}
type ICommunityBadgesItems = Array<ICommunityBadgesItem>;

const CommunityBadges = () => {
  const { user } = useUser();
  
  const items = [
    {
      title: 'Compte Actif',
      stroke: 'stroke-blue-200 dark:stroke-blue-950',
      fill: 'fill-blue-50 dark:fill-blue-950/30',
      icon: user?.status === 'ACTIVE' ? Zap : CircleAlert,
      iconColor: user?.status === 'ACTIVE' ? 'text-green-500' : 'text-orange-500',
    },
    {
      title: `Rôle: ${user?.role?.name || 'N/A'}`,
      stroke: 'stroke-orange-200 dark:stroke-orange-950',
      fill: 'fill-orange-50 dark:fill-orange-950/30',
      icon: Volleyball,
      iconColor: 'text-orange-500',
    },
    {
      title: user?.userCategory || 'Catégorie',
      stroke: 'stroke-purple-200 dark:stroke-purple-950',
      fill: 'fill-purple-50 dark:fill-purple-950/30',
      icon: Truck,
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>Badges Communauté</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
              <div className={cn('size-12 rounded-full flex items-center justify-center', item.stroke, item.fill)}>
                <item.icon className={cn('size-6', item.iconColor)} />
              </div>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { CommunityBadges, type ICommunityBadgesItem, type ICommunityBadgesItems };
