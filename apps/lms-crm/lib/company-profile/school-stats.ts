/** Compteurs école renvoyés par GET profil compagnie (`data.schoolStats`). */
export type SchoolStatsPayload = {
  trainersCount: number;
  activeFormationsCount: number;
  sessionsTotalCount: number;
  sessionsUpcomingOrUndatedCount: number;
  roomsAvailableCount: number;
};

export type PrimaryAdminContactPayload = {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
};
