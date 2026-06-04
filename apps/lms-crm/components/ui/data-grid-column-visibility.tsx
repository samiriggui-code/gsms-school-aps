import { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, ColumnDef } from '@tanstack/react-table';

function DataGridColumnVisibility<TData>({
  table,
  trigger,
  menuLabel = 'Colonnes visibles',
}: {
  table: Table<TData>;
  trigger: ReactNode;
  /** Libellé du menu (défaut : français). */
  menuLabel?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel className="font-medium">{menuLabel}</DropdownMenuLabel>
         {table
           .getAllColumns()
           .filter((column) => {
             if (!column.getCanHide()) return false;
             const def = column.columnDef as any;
             return Boolean(def.accessorFn ?? def.accessorKey);
           })
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="normal-case"
                checked={column.getIsVisible()}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.columnDef.meta?.headerTitle || column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DataGridColumnVisibility };
