import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardList, MessageSquare, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';

const LMS_CARDS = [
  {
    title: 'Cours LMS',
    description: 'Contenus déposés pour les apprenants.',
    icon: BookOpen,
    href: '/gestion-academique/lms/cours',
  },
  {
    title: 'Devoirs LMS',
    description: 'Travaux à rendre et corrections.',
    icon: ClipboardList,
    href: '/gestion-academique/lms/devoirs',
  },
  {
    title: 'Discussions LMS',
    description: 'Forums de cours.',
    icon: MessageSquare,
    href: '/gestion-academique/lms/discussions',
  },
  {
    title: 'Inscriptions LMS',
    description: 'Inscriptions aux parcours en ligne.',
    icon: UserPlus,
    href: '/gestion-academique/lms/inscriptions',
  },
];

/** Module LMS — distinct de Vie scolaire (présentiel) : cours, devoirs, discussions, inscriptions en ligne. */
export default function LmsLandingPage() {
  return (
    <CrmWiredLeaf path="/gestion-academique/lms" level="module">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {LMS_CARDS.map((card) => (
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
