import Link from 'next/link';
import { ArrowRight, HandCoins, FileOutput } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';

const CARDS = [
  {
    title: 'Financeurs',
    description: 'Registre OPCO, CPF, entreprises et dossiers FundingCase.',
    icon: HandCoins,
    href: '/administration-facturation/finance/financeurs',
  },
  {
    title: 'Export EDOF',
    description: 'Catalogue LHEO pour le portail EDOF.',
    icon: FileOutput,
    href: '/administration-facturation/finance/edof-catalog',
  },
];

/** Module Financeurs — dispositifs de financement, distinct du cycle commercial. */
export default function FinanceursLandingPage() {
  return (
    <CrmWiredLeaf path="/administration-facturation/financeurs" level="module">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CARDS.map((card) => (
          <Card key={card.href} className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <card.icon className="size-4 shrink-0" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={card.href}>
                  Ouvrir
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </CrmWiredLeaf>
  );
}
