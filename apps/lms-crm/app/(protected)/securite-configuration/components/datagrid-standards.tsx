import type { PaginationState } from '@tanstack/react-table';

/** Lignes par page par défaut — tableaux DataGrid des landings module / sous-module. */
export const MODULE_LANDING_DATAGRID_PAGE_SIZE = 5;

export function createModuleLandingPagination(): PaginationState {
  return { pageIndex: 0, pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE };
}

export const USER_MANAGEMENT_TABLE_LAYOUT = {
  columnsResizable: true,
  columnsPinnable: true,
  columnsMovable: true,
  columnsVisibility: true,
  cellBorder: true,
  dense: true,
};

export const USER_MANAGEMENT_TABLE_CLASSNAMES = {
  edgeCell: 'px-5',
};

/** Listes finance — pas de pin/drag colonnes (évite actions détachées du tableau). */
export const FINANCE_DATAGRID_TABLE_LAYOUT = {
  columnsResizable: false,
  columnsPinnable: false,
  columnsMovable: false,
  columnsVisibility: false,
  cellBorder: true,
  dense: true,
};

/** Barre flottante de sélection (listes gestion-ressources) — responsive mobile. */
export const DATAGRID_SELECTION_BAR_WRAPPER =
  'fixed bottom-4 inset-x-3 z-50 sm:bottom-8 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[calc(100vw-2rem)]';

export const DATAGRID_SELECTION_BAR_INNER =
  'bg-popover text-popover-foreground rounded-xl px-3 py-2.5 sm:px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 shadow-2xl border border-border w-full sm:min-w-0 sm:max-w-3xl';

export const DATAGRID_SELECTION_BAR_ACTIONS =
  'flex flex-wrap items-center gap-3 sm:gap-4';

export const DATAGRID_TOOLBAR_ACTIONS = 'flex flex-wrap items-center gap-2';
