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

/** Entrée minimale pour ouvrir la fiche (comme EquipmentSheetInput). */
export type VenueRoomSheetInput = Pick<
  VenueRoomRow,
  'id' | 'name' | 'shortCode' | 'imageUrl'
> &
  Partial<VenueRoomRow>;

export type VenueRoomSessionRow = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  formationName: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  trainerName: string | null;
};
