import { Badge } from '@repo/ui/badge';
import type { ItemStatus } from '../hooks/use-qualiopi-classeur';

export function QualiopiIndicatorStatusBadge({ status }: { status: ItemStatus }) {
  switch (status) {
    case 'VALIDATED':
      return (
        <Badge className="bg-success/10 text-success border-success/20 font-bold text-[10px]">
          OK
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="destructive" className="font-bold text-[10px]">
          KO
        </Badge>
      );
    case 'REQUESTED':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20 font-bold text-[10px]">
          À réparer
        </Badge>
      );
    case 'WAIVED':
      return (
        <Badge variant="outline" className="font-bold text-[10px]">
          N/A
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-bold text-[10px] text-muted-foreground">
          À auditer
        </Badge>
      );
  }
}
