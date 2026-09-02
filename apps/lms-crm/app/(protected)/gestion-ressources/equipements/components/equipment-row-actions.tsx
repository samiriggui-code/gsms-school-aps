'use client';

import { Eye, SquarePen, Trash } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';

type EquipmentRowActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteTitle?: string;
  className?: string;
};

export function EquipmentRowActions({
  onView,
  onEdit,
  onDelete,
  deleteDisabled,
  deleteTitle = 'Supprimer',
  className,
}: EquipmentRowActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-1', className)}>
      {onView ? (
        <Button variant="ghost" size="sm" mode="icon" onClick={onView} title="Voir">
          <Eye className="size-4" />
        </Button>
      ) : null}
      {onEdit ? (
        <Button variant="ghost" size="sm" mode="icon" onClick={onEdit} title="Modifier">
          <SquarePen className="size-4" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          variant="ghost"
          size="sm"
          mode="icon"
          disabled={deleteDisabled}
          onClick={onDelete}
          title={deleteTitle}
          className="text-destructive hover:text-destructive"
        >
          <Trash className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
