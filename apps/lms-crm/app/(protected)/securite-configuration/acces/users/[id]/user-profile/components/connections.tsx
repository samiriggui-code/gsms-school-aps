'use client';

import { useState } from 'react';
import { useUser } from '../../components/user-context';
import { Check, Plus } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface IConnectionsItem {
  avatar: string;
  name: string;
  connections: number;
  jointLinks: number;
  connected: boolean;
}

type IConnectionsItems = Array<IConnectionsItem>;

interface IConnectionsProps {
  url?: string;
}

const Connections = ({ url }: IConnectionsProps) => {
  const { user } = useUser();
  
  const [items, setItems] = useState<IConnectionsItems>([
    {
      avatar: user?.avatar || '300-3.png',
      name: user?.name || 'Utilisateur',
      connections: 26,
      jointLinks: 6,
      connected: true,
    },
    {
      avatar: '300-2.png',
      name: 'Emma Stone',
      connections: 20,
      jointLinks: 0,
      connected: false,
    },
    {
      avatar: '300-4.png',
      name: 'Tyler Hero',
      connections: 26,
      jointLinks: 6,
      connected: true,
    },
    {
      avatar: '300-5.png',
      name: 'Jane Doe',
      connections: 48,
      jointLinks: 4,
      connected: false,
    },
  ]);

  const handleConnect = (index: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, connected: true, connections: item.connections + 1 } : item
    ));
  };

  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>Connections</CardTitle>
        <p className="text-sm text-muted-foreground">{items.filter(i => i.connected).length} connected</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <img src={toAbsoluteUrl(item.avatar)} alt={item.name} className="size-12 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.connections} connections</p>
              </div>
              {item.connected ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="size-4" />
                  Connected
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleConnect(index)}>
                  <Plus className="size-4 mr-1" />
                  Connect
                </Button>
              )}
            </div>
          ))}
        </div>
        {url && (
          <CardFooter className="flex justify-center pt-4">
            <Button mode="link" variant="primary" asChild>
              <a href={url}>View all connections</a>
            </Button>
          </CardFooter>
        )}
      </CardContent>
    </Card>
  );
}

export { Connections };
export type { IConnectionsItem, IConnectionsItems, IConnectionsProps };
