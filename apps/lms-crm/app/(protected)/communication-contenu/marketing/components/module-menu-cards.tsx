import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Bell, Settings, Share2 } from "lucide-react";

export function ModuleMenuCards() {
  const menuItems = [
    {
      title: "Marketing",
      description: "Reglages generaux de la plateforme et configuration globale.",
      icon: Settings,
      href: "/communication-contenu/marketing",
      badge: "Reglages",
      stats: "Configuration generale",
    },
    {
      title: "Notifications",
      description: "Regles de notifications systeme, web et email.",
      icon: Bell,
      href: "/communication-contenu/marketing/notifications",
      badge: "Actif",
      stats: "Gestion des alertes",
    },
    {
      title: "Social",
      description: "Liens et canaux sociaux utilises par la plateforme.",
      icon: Share2,
      href: "/communication-contenu/marketing/social",
      badge: "Canaux",
      stats: "Reseaux sociaux",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="group">
            <Card className="transition-all hover:border-primary border-dashed h-full flex flex-col">
              <CardHeader className="flex-grow pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50 border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</CardTitle>
                      <Badge appearance="light" className="w-fit font-bold uppercase text-2xs">
                        {item.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-4 text-2sm text-muted-foreground leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <div className="flex items-center gap-2 text-2xs font-bold uppercase text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-dashed">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {item.stats}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}