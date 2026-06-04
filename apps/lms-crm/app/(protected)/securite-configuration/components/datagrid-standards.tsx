import type { PaginationState } from '@tanstack/react-table';
import { Container } from '@/components/common/container';
import { Help } from '@/partials/common/help';
import { cn } from '@/lib/utils';

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
};

export const USER_MANAGEMENT_TABLE_CLASSNAMES = {
  edgeCell: 'px-5',
};

/**
 * Cartes « Questions ? » + « Contacter le support » — une seule fois, injectées par `demo1/layout`.
 * Ne pas ré-importer ce composant dans les pages (sinon doublon).
 */
export function UserManagementSupportSection({ className }: { className?: string }) {
  return (
    <section
      aria-label="Aide et support"
      className={cn('crm-page-help-footer shrink-0 w-full', className)}
    >
      {/* Séparation visible avec le contenu (tableaux, graphiques, etc.) */}
      <div className="h-16 min-h-16 lg:h-24 lg:min-h-24" aria-hidden />
      <div className="border-t border-border/60 bg-muted/10 pt-10 pb-10 lg:pt-12 lg:pb-12">
        <Container>
          <Help />
        </Container>
      </div>
    </section>
  );
}
