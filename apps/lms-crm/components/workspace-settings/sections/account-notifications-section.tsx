'use client';

import { NotificationChannelsCard, NotificationTopicsCard, DoNotDisturbCard } from './notification-preference-toggles';

export function AccountNotificationsSection() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-4">
        <NotificationChannelsCard />
        <NotificationTopicsCard />
      </div>
      <DoNotDisturbCard />
    </div>
  );
}
