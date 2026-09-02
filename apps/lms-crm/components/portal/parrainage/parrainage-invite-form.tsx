'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { SquarePlus, Link2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@repo/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Badge } from '@repo/ui/badge';

type StoredInvite = {
  id: string;
  email: string;
  createdAt: string;
  status: 'pending' | 'sent';
};

const STORAGE_KEY = 'lms:portal-referrals';

function loadInvites(): StoredInvite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredInvite[]) : [];
  } catch {
    return [];
  }
}

function saveInvites(list: StoredInvite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function ParrainageInviteForm() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<StoredInvite[]>([]);
  const { copyToClipboard } = useCopyToClipboard();

  useEffect(() => {
    setInvites(loadInvites());
  }, []);

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${encodeURIComponent(session?.user?.id ?? 'guest')}`
      : '/';

  const handleInvite = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Email invalide.');
      return;
    }
    const next: StoredInvite = {
      id: crypto.randomUUID(),
      email: trimmed,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    const list = [next, ...invites].slice(0, 20);
    setInvites(list);
    saveInvites(list);
    setEmail('');
    toast.success(`Invitation enregistrée pour ${trimmed}.`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Inviter un ami</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Partagez Form&apos;SSI avec vos proches intéressés par les formations sécurité /
            incendie.
          </p>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <Label htmlFor="referral-email">Email</Label>
              <Input
                id="referral-email"
                type="email"
                placeholder="ami@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleInvite}>
              <SquarePlus className="me-2 size-4" />
              Inviter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="size-4" />
            Lien de parrainage
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input readOnly value={referralLink} className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              copyToClipboard(referralLink);
              toast.success('Lien copié.');
            }}
          >
            Copier le lien
          </Button>
        </CardContent>
      </Card>

      {invites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="size-4" />
              Invitations récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>{inv.email}</span>
                <Badge variant="secondary" size="sm">
                  {inv.status === 'sent' ? 'Envoyée' : 'En attente'}
                </Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Les invitations sont enregistrées localement en attendant l’API parrainage CRM.
            </p>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
