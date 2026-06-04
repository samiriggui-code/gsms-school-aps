export const EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
} as const;

export type EquipmentStatus = (typeof EquipmentStatus)[keyof typeof EquipmentStatus];

export interface ClientSite {
  id: string;
  name: string;
  code?: string | null;
}

export interface Equipment {
  id: string;
  serialNumber: string;
  label: string;
  name?: string | null;
  type?: string | null;
  avatar?: string | null;
  status: EquipmentStatus;
  assignedSiteId?: string | null;
  assignedSite?: ClientSite | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    maintenanceItems?: number;
    stockMovements?: number;
  };
}

/** Ouverture d’une fiche : identifiant obligatoire, le reste est chargé via API. */
export type EquipmentSheetInput = Pick<Equipment, 'id'> & Partial<Omit<Equipment, 'id'>>;

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  title?: string | null;
  notes?: string | null;
  scheduledDate?: Date | null;
  completedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  equipment?: Equipment;
}

export interface StockMovement {
  id: string;
  equipmentId: string;
  type: 'IN' | 'OUT' | 'TRANSFER';
  quantity: number;
  movementDate: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  equipment?: Equipment;
}
