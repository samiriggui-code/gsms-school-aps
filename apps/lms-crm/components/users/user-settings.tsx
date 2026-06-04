'use client';

import { UserDetailsForm } from "./components/user-details-form";

export function UserSettings({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <UserDetailsForm user={user} />
    </div>
  );
}
