import { 
  Palmtree, 
  Stethoscope, 
  Clock, 
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const ABSENCE_TYPES = [
  { id: 'CONGE_PAYE', label: 'Congés Payés', icon: Palmtree, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'MALADIE', label: 'Maladie', icon: Stethoscope, color: 'text-destructive', bg: 'bg-destructive/10' },
  { id: 'RTT', label: 'RTT', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  { id: 'AUTRE', label: 'Autre', icon: MoreHorizontal, color: 'text-foreground/70', bg: 'bg-muted/30' },
];

export const ABSENCE_STATUSES = [
  { id: 'PENDING', label: 'En attente', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', variant: 'warning' },
  { id: 'APPROVED', label: 'Approuvé', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', variant: 'success' },
  { id: 'REJECTED', label: 'Refusé', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', variant: 'destructive' },
];

export type AbsenceTypeID = 'CONGE_PAYE' | 'MALADIE' | 'RTT' | 'AUTRE';
export type AbsenceStatusID = 'PENDING' | 'APPROVED' | 'REJECTED';
