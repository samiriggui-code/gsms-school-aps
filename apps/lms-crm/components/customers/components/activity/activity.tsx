'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ClipboardCheck, GraduationCap } from "lucide-react";

export function ActivityPage() {
  const steps = [
    {
      title: "Évaluation continue",
      description: "Mise en situation et exercices pratiques tout au long de la formation (PC de sécurité, rondes, interventions).",
      icon: <ClipboardCheck className="size-5 text-indigo-500" />,
      badge: "Pratique"
    },
    {
      title: "Examen Théorique (QCU)",
      description: "Questionnaire à Choix Unique pour valider l'acquisition des connaissances théoriques sur l'ensemble des modules.",
      icon: <CheckCircle2 className="size-5 text-green-500" />,
      badge: "Théorie"
    },
    {
      title: "Certification Finale",
      description: "Validation devant un jury de professionnels pour l'obtention du titre certifiant, permettant de demander la carte CNAPS.",
      icon: <GraduationCap className="size-5 text-purple-500" />,
      badge: "Diplôme"
    }
  ];

  return (
    <div className="space-y-5">
      {steps.map((step, index) => (
        <Card key={index} className="bg-accent/50 rounded-md shadow-none border border-border">
          <CardContent className="p-4 flex items-start gap-4">
            <div className="flex items-center justify-center rounded-md bg-background border border-border size-12 shrink-0">
              {step.icon}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <Badge variant="outline" size="sm" className="bg-background">{step.badge}</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
