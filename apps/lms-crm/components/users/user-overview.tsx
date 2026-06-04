'use client';

import { User } from "@/app/models/user";
import { UserStatistics } from "./components/user-statistics";
import { UserHRInfo } from "./components/user-hr-info";

export function UserOverview({ user }: { user: any }) {
  return (
    <div className="space-y-5">
      <UserStatistics user={user} />
      <UserHRInfo user={user} />
    </div>
  );
}
