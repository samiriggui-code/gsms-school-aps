'use client';

import { LucideIcon, Mail, MessageCircle, Monitor, Bell } from 'lucide-react';
import { CardNotification } from '@/partials/cards/card-notification';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNotificationPrefs } from '@/hooks/use-notification-prefs';

function ChannelRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <CardNotification
      icon={Icon}
      title={title}
      description={description}
      actions={<Switch size="sm" checked={checked} onCheckedChange={onCheckedChange} />}
    />
  );
}

export function NotificationChannelsCard() {
  const { prefs, update } = useNotificationPrefs();

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-sm font-semibold">Canaux de notification</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="dnd-global" className="text-sm">
            Ne pas déranger
          </Label>
          <Switch
            id="dnd-global"
            size="sm"
            checked={prefs.doNotDisturb}
            onCheckedChange={(v) => update({ doNotDisturb: v })}
          />
        </div>
      </CardHeader>
      <div>
        <ChannelRow
          icon={Mail}
          title="Email"
          description="Résumés et alertes importantes par email."
          checked={prefs.email && !prefs.doNotDisturb}
          onCheckedChange={(v) => update({ email: v })}
        />
        <ChannelRow
          icon={Bell}
          title="In-app"
          description="Cloche du bandeau et centre de notifications."
          checked={prefs.inApp && !prefs.doNotDisturb}
          onCheckedChange={(v) => update({ inApp: v })}
        />
        <ChannelRow
          icon={MessageCircle}
          title="Chat"
          description="Messages instantanés et conversations."
          checked={prefs.chat && !prefs.doNotDisturb}
          onCheckedChange={(v) => update({ chat: v })}
        />
        <ChannelRow
          icon={Monitor}
          title="Bureau"
          description="Alertes navigateur (si autorisées)."
          checked={prefs.desktop && !prefs.doNotDisturb}
          onCheckedChange={(v) => update({ desktop: v })}
        />
      </div>
    </Card>
  );
}

export function NotificationTopicsCard() {
  const { prefs, update } = useNotificationPrefs();

  const items = [
    {
      icon: Bell,
      title: 'Alertes pédagogiques',
      description: 'Sessions, parcours, validations de contenu.',
      key: 'academicAlerts' as const,
    },
    {
      icon: Bell,
      title: 'Rappels de session',
      description: 'Convocations et changements de planning.',
      key: 'sessionReminders' as const,
    },
    {
      icon: MessageCircle,
      title: 'Messages chat',
      description: 'Nouveaux messages dans vos conversations.',
      key: 'chatMessages' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Types d&apos;alertes</CardTitle>
      </CardHeader>
      <div>
        {items.map((item) => (
          <CardNotification
            key={item.key}
            icon={item.icon}
            title={item.title}
            description={item.description}
            actions={
              <Switch
                size="sm"
                checked={prefs[item.key] && !prefs.doNotDisturb}
                onCheckedChange={(v) => update({ [item.key]: v })}
              />
            }
          />
        ))}
      </div>
    </Card>
  );
}

export function DoNotDisturbCard() {
  const { prefs, update } = useNotificationPrefs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Ne pas déranger</CardTitle>
      </CardHeader>
      <div className="px-5 pb-5 text-sm text-muted-foreground">
        <p>
          Coupez temporairement email, in-app, chat et alertes pédagogiques. Les préférences
          individuelles sont conservées.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Switch
            size="sm"
            checked={prefs.doNotDisturb}
            onCheckedChange={(v) => update({ doNotDisturb: v })}
          />
          <span className="text-sm font-medium text-foreground">
            {prefs.doNotDisturb ? 'Activé' : 'Désactivé'}
          </span>
        </div>
      </div>
    </Card>
  );
}
