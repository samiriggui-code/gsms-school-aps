'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FundingBlockRow, PrerequisiteRow } from '../utils/formation-offer-template-helpers';
import {
  fundingOptionKey,
  normalizeFundingBlocks,
  normalizePrerequisitesTable,
  prerequisiteOptionKey,
} from '../utils/formation-offer-template-helpers';

function fundingTitle(block: FundingBlockRow, index: number): string {
  const label = block.label;
  return typeof label === 'string' && label.trim() ? label : `Modalité ${index + 1}`;
}

function fundingSubtitle(block: FundingBlockRow): string | null {
  const info = block.info;
  return typeof info === 'string' && info.trim() ? info : null;
}

function prerequisiteTitle(row: PrerequisiteRow, index: number): string {
  const item = row.item;
  return typeof item === 'string' && item.trim() ? item : `Prérequis ${index + 1}`;
}

function prerequisiteSubtitle(row: PrerequisiteRow): string | null {
  const detail = row.detail;
  const importance = row.importance;
  const parts: string[] = [];
  if (typeof detail === 'string' && detail.trim()) parts.push(detail);
  if (typeof importance === 'string' && importance.trim()) parts.push(importance);
  return parts.length ? parts.join(' · ') : null;
}

export type FormationOfferFundingPrereqPickersProps = {
  fundingTemplate: unknown;
  prerequisitesTemplate: unknown;
  fundingKeys: Set<string>;
  prerequisiteKeys: Set<string>;
  onFundingKeysChange: (next: Set<string>) => void;
  onPrerequisiteKeysChange: (next: Set<string>) => void;
  disabled?: boolean;
};

/** Liste déroulante (popover) à sélection multiple : cases à cocher, inspirée de la fiche référence. */
export function FormationOfferFundingPrereqPickers({
  fundingTemplate,
  prerequisitesTemplate,
  fundingKeys,
  prerequisiteKeys,
  onFundingKeysChange,
  onPrerequisiteKeysChange,
  disabled,
}: FormationOfferFundingPrereqPickersProps) {
  const fundingRows = normalizeFundingBlocks(fundingTemplate);
  const prerequisiteRows = normalizePrerequisitesTable(prerequisitesTemplate);

  const fundingSelectedCount = fundingRows.reduce(
    (n, _, i) => n + (fundingKeys.has(fundingOptionKey(i)) ? 1 : 0),
    0,
  );
  const prereqSelectedCount = prerequisiteRows.reduce(
    (n, _, i) => n + (prerequisiteKeys.has(prerequisiteOptionKey(i)) ? 1 : 0),
    0,
  );

  const fundingSummary = fundingRows.length === 0 ? '—' : `${fundingSelectedCount}/${fundingRows.length}`;

  const prereqSummary =
    prerequisiteRows.length === 0 ? '—' : `${prereqSelectedCount}/${prerequisiteRows.length}`;

  const selectAllFunding = () => {
    onFundingKeysChange(new Set(fundingRows.map((_, i) => fundingOptionKey(i))));
  };
  const clearFunding = () => onFundingKeysChange(new Set());

  const selectAllPrereq = () => {
    onPrerequisiteKeysChange(new Set(prerequisiteRows.map((_, i) => prerequisiteOptionKey(i))));
  };
  const clearPrereq = () => onPrerequisiteKeysChange(new Set());

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 sm:col-span-2">
      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Financement affiché</span>
        <p className="text-xs text-muted-foreground">
          Liste déroulante à{' '}
          <span className="font-medium text-foreground">choix multiples</span> : ouvrez la liste et cochez les
          modalités à afficher (celles de la fiche formation).
        </p>
        {fundingRows.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md px-3 py-2">
            Aucune modalité de financement sur cette fiche référence.
          </p>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 w-full justify-between gap-2 py-2 px-3 font-normal text-start"
                disabled={disabled}
              >
                <span className="leading-snug">
                  Ouvrir la liste — financement
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    Sélection multiple (cases à cocher)
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs tabular-nums">
                  {fundingSummary}
                  <ChevronDown className="size-4 opacity-70" />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[min(calc(100vw-2rem),26rem)] p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={disabled}
                  onClick={selectAllFunding}
                >
                  Tout cocher
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={disabled}
                  onClick={clearFunding}
                >
                  Tout décocher
                </Button>
              </div>
              <ScrollArea className="max-h-72">
                <div className="flex flex-col gap-0.5 p-2">
                  {fundingRows.map((block, i) => {
                    const key = fundingOptionKey(i);
                    const checked = fundingKeys.has(key);
                    const sub = fundingSubtitle(block);
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer gap-3 rounded-md px-2 py-2 text-start hover:bg-accent/60"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(v) => {
                            const nextChecked = v === true;
                            const s = new Set(fundingKeys);
                            if (nextChecked) s.add(key);
                            else s.delete(key);
                            onFundingKeysChange(s);
                          }}
                          className="mt-0.5"
                        />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm leading-snug">{fundingTitle(block, i)}</span>
                          {sub ? (
                            <span className="text-xs font-normal text-muted-foreground leading-snug">{sub}</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Prérequis affichés</span>
        <p className="text-xs text-muted-foreground">
          Même principe : <span className="font-medium text-foreground">liste déroulante</span>, plusieurs lignes
          cochables en même temps.
        </p>
        {prerequisiteRows.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md px-3 py-2">
            Aucun prérequis structuré sur cette fiche référence.
          </p>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 w-full justify-between gap-2 py-2 px-3 font-normal text-start"
                disabled={disabled}
              >
                <span className="leading-snug">
                  Ouvrir la liste — prérequis
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    Sélection multiple (cases à cocher)
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs tabular-nums">
                  {prereqSummary}
                  <ChevronDown className="size-4 opacity-70" />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[min(calc(100vw-2rem),26rem)] p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={disabled}
                  onClick={selectAllPrereq}
                >
                  Tout cocher
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={disabled}
                  onClick={clearPrereq}
                >
                  Tout décocher
                </Button>
              </div>
              <ScrollArea className="max-h-72">
                <div className="flex flex-col gap-0.5 p-2">
                  {prerequisiteRows.map((row, i) => {
                    const key = prerequisiteOptionKey(i);
                    const checked = prerequisiteKeys.has(key);
                    const sub = prerequisiteSubtitle(row);
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer gap-3 rounded-md px-2 py-2 text-start hover:bg-accent/60"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(v) => {
                            const nextChecked = v === true;
                            const s = new Set(prerequisiteKeys);
                            if (nextChecked) s.add(key);
                            else s.delete(key);
                            onPrerequisiteKeysChange(s);
                          }}
                          className="mt-0.5"
                        />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm leading-snug">{prerequisiteTitle(row, i)}</span>
                          {sub ? (
                            <span className="text-xs font-normal text-muted-foreground leading-snug">{sub}</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
