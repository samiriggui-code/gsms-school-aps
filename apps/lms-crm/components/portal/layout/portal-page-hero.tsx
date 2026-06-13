'use client';



import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { portalLabel, portalMuted, portalPageTitle } from './portal-ui';



type Props = {

  title: string;

  description?: string;

  badge?: string;

  actions?: ReactNode;

  className?: string;

  meta?: ReactNode;

};



export function PortalPageHero({ title, description, badge, actions, className, meta }: Props) {

  return (

    <section

      className={cn(

        'relative overflow-hidden rounded-xl border bg-card px-4 py-5 shadow-xs sm:px-6 sm:py-6',

        className,

      )}

    >

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0 space-y-2">

          {badge ? (

            <span className={cn('inline-flex rounded-md border border-primary/15 bg-primary/8 px-2 py-0.5 text-primary', portalLabel)}>

              {badge}

            </span>

          ) : null}

          <h1 className={portalPageTitle}>{title}</h1>

          {description ? <p className={cn('max-w-2xl', portalMuted)}>{description}</p> : null}

          {meta ? <div className="flex flex-wrap items-center gap-2 pt-0.5">{meta}</div> : null}

        </div>

        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}

      </div>

    </section>

  );

}

