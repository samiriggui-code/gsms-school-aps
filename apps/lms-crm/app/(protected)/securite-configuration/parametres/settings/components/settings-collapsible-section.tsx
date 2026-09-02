'use client';

import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  SETTINGS_SECTION_SCROLL_MARGIN,
  type SettingsAnchorId,
} from '../lib/settings-anchors';
import { useSettingsSections } from './settings-sections-context';

type SettingsCollapsibleSectionProps = {
  id: SettingsAnchorId;
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function SettingsCollapsibleSection({
  id,
  title,
  description,
  children,
}: SettingsCollapsibleSectionProps) {
  const { isOpen, toggle } = useSettingsSections();
  const open = isOpen(id);

  return (
    <section
      id={id}
      className={cn(SETTINGS_SECTION_SCROLL_MARGIN, 'scroll-smooth')}
    >
      <Collapsible open={open} onOpenChange={() => toggle(id)}>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-4 text-start transition-colors hover:bg-muted/30 lg:px-5 lg:py-5"
              aria-expanded={open}
            >
              <ChevronDown
                className={cn(
                  'mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block text-base font-semibold text-foreground">{title}</span>
                {description ? (
                  <span className="block text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </span>
                ) : null}
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border/60 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="space-y-5 p-4 lg:space-y-7.5 lg:p-5">{children}</div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </section>
  );
}
