import Link from 'next/link';
import { ArrowRight, ScrollText, Wallet, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';

const CARDS = [
  {
    title: 'Budget',
    description: 'Lignes budgétaires, prévu vs réalisé.',
    icon: Wallet,
    href: '/administration-facturation/budget/lignes',
  },
  {
    title: 'BPF',
    description: 'Bilan pédagogique et financier (Cerfa).',
    icon: ScrollText,
    href: '/administration-facturation/budget/bpf',
  },
  {
    title: 'Rapports',
    description: 'Tableaux de bord finance et exports.',
    icon: BarChart3,
    href: '/administration-facturation/budget/rapports',
  },
];

/** Module Budget & pilotage — planification et reporting, distinct du cycle commercial. */
export default function BudgetLandingPage() {
  return (
    <CrmWiredLeaf path="/administration-facturation/budget" level="module">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
