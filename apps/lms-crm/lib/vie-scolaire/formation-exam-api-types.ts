/** Types API examens — safe pour composants client (pas d'import serveur). */

export type FormationExamApiRow = {
  id: string;
  sessionId: string;
  scheduledAt: string | null;
  status: string;
  juryPresidentName: string | null;
  juryMemberNames: string[];
  notes: string | null;
  venueRoom: {
    id: string;
    name: string;
    shortCode: string | null;
    floorLabel: string | null;
    imageUrl: string | null;
    capacity: number | null;
  } | null;
  session: {
    id: string;
    dateDisplayLabel: string;
    location: string;
    sessionKind: string;
    examDate: string | null;
    formation: { id: string; name: string; slug: string } | null;
    trainer: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      avatar: string | null;
    } | null;
    examVenueRoomId: string | null;
    examReservedEquipmentIds: string[];
  };
  participantCount: number;
  outcomeCounts: { pending: number; passed: number; failed: number; absent: number };
  participants: Array<{
    id: string;
    examOutcome: string;
    examDate: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
    };
  }>;
  createdAt: string;
  updatedAt: string;
};
