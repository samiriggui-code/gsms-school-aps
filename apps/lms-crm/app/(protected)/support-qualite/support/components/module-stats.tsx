import { Card, CardContent } from "@repo/ui/card";
import { Package, TrendingUp, Calendar, CreditCard } from "lucide-react";

export function ModuleStats() {
  const stats = [
    {
      title: "Plan Actuel",
      value: "N/A",
      icon: Package,
      description: "-",
      trend: "0 niveaux",
    },
    {
      title: "Utilisateurs",
      value: "0 / 0",
      icon: TrendingUp,
      description: "0% utilisés",
      trend: "0 disponibles",
    },
    {
      title: "Prochain Renouvellement",
      value: "N/A",
      icon: Calendar,
      description: "-",
      trend: "Statique",
    },
    {
      title: "Montant Mensuel",
      value: "0€",
      icon: CreditCard,
      description: "HT",
      trend: "0€ TTC",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-4 gap-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-dashed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-2sm font-bold uppercase text-muted-foreground leading-none">
                    {stat.title}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</span>
                    <span className="text-xs font-medium text-muted-foreground italic">{stat.description}</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50 border border-border shrink-0">
                  <Icon className="h-6 w-6 text-foreground/70" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                <span className="text-2xs font-bold uppercase text-muted-foreground">{stat.trend}</span>
                <div className="size-1.5 rounded-full bg-emerald-500" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}