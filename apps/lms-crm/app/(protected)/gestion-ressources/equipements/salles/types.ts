export type VenueRoomRow = {
  id: string;
  name: string;
  shortCode: string | null;
  capacity: number | null;
  floorLabel: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE' | 'INACTIVE';
  upcomingSessionsCount: number;
  activeSessionsCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type VenueRoomSessionRow = {
  id: string;
  label: string;
  formationName: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  trainerName: string | null;
};
