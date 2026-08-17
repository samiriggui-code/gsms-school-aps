'use client';

import { Eye, Printer, SquarePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FORMATION_EXAM_OFFICIAL_DOCUMENTS } from '@/lib/vie-scolaire/formation-exam-documents';
import { cn } from '@/lib/utils';

type FormationExamRowActionsProps = {
  examId: string;
  status: string;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
  className?: string;
};

function openExamPdf(examId: string, docType: string) {
  window.open(
    `/api/sections/gestion-academique/vie-scolaire/formation-exams/${examId}/pdf/${docType}`,
    '_blank',
    'noopener,noreferrer',
  );
}

export function FormationExamRowActions({
  examId,
  status,
  onView,
  onEdit,
  onCancel,
  className,
}: FormationExamRowActionsProps) {
  const cancelled = status === 'CANCELLED';

  return (
    <div
      className={cn('flex items-center justify-end gap-0.5 pe-2', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <Button type="button" variant="ghost" mode="icon" title="Voir" onClick={onView}>
        <Eye className="size-4 text-muted-foreground" />
      </Button>
      <Button type="button" variant="ghost" mode="icon" title="Éditer" onClick={onEdit}>
        <SquarePen className="size-4 text-muted-foreground" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" mode="icon" className="size-8" title="Imprimer PDF">
            <Printer className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {FORMATION_EXAM_OFFICIAL_DOCUMENTS.map((doc) => (
            <DropdownMenuItem key={doc.type} onClick={() => openExamPdf(examId, doc.type)}>
              {doc.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        type="button"
        variant="ghost"
        mode="icon"
        className="size-8 text-destructive hover:text-destructive"
        title="Annuler l'examen"
        disabled={cancelled}
        onClick={onCancel}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
