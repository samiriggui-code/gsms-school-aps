'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartBar, FileText, ReceiptText, Wallet } from 'lucide-react';

export function FinanceWelcomeCallout() {
  return (
    <Fragment>
      <style>
        {`
          .finance-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .finance-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat finance-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <ReceiptText className="w-8 h-8 text-primary" />
              </div>
              <div className="flex -space-x-2.5">
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-1.png')} />
                  <AvatarFallback>1</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} />
                  <AvatarFallback>2</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-3.png')} />
                  <AvatarFallback>3</AvatarFallback>
                </Avatar>
                <Avatar className="size-10 ring-2 ring-background bg-primary text-white text-xs">
                  <AvatarFallback>+12</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Module <span className="text-primary">Finance</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Suivez vos devis, factures et paiements <br />
              pour piloter la performance financiere en temps reel.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" asChild>
            <Link href="/administration-facturation/finance/budget">
              <ChartBar className="size-4 mr-1" />
              Budget
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/administration-facturation/finance/devis">
              <FileText className="size-4 mr-1" />
              Devis
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/administration-facturation/finance/factures">
              <ReceiptText className="size-4 mr-1" />
              Factures
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/administration-facturation/finance/paiements">
              <Wallet className="size-4 mr-1" />
              Paiements
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/administration-facturation/finance/rapports">
              <ChartBar className="size-4 mr-1" />
              Rapports
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
