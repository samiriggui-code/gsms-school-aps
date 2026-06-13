'use client';

import { Award, BookOpen, CalendarDays, GraduationCap, Mail, Phone } from 'lucide-react';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';
import type { PortalFormationInstructor } from '@/lib/portal/portal-formation-instructor';
import { Badge } from '@/components/ui/badge';

type Props = {
  instructor: PortalFormationInstructor;
  /** Fallback centre si pas de formateur session (rare). */
  organizationName?: string | null;
};

export function FormationInstructorProfile({ instructor, organizationName }: Props) {
  const stats = [
    instructor.yearsOfExperience != null && instructor.yearsOfExperience > 0
      ? {
          value: `${instructor.yearsOfExperience}+`,
          label: "Années d'expérience",
        }
      : null,
    instructor.specialties.length > 0
      ? {
          value: String(instructor.specialties.length),
          label: 'Domaines dispensés',
        }
      : null,
    instructor.certifications.length > 0
      ? {
          value: String(instructor.certifications.length),
          label: 'Certifications',
        }
      : null,
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <div className="space-y-8">
      {/* Bloc principal type Udemy : photo + identité + stats */}
      <div className="rounded-xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="mx-auto shrink-0 sm:mx-0">
            <SessionUserAvatar
              name={instructor.displayName}
              email={instructor.email}
              avatar={instructor.avatar}
              square
              sizeClassName="size-28 sm:size-32"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {instructor.displayName}
              </h3>
              {instructor.headline ? (
                <p className="mt-1 text-sm font-medium text-primary">{instructor.headline}</p>
              ) : organizationName ? (
                <p className="mt-1 text-sm text-muted-foreground">{organizationName}</p>
              ) : null}
            </div>

            {stats.length > 0 ? (
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:justify-start">
                {stats.map((stat) => (
                  <li key={stat.label} className="text-center sm:text-left">
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
              {instructor.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-4 shrink-0" />
                  {instructor.email}
                </span>
              ) : null}
              {instructor.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-4 shrink-0" />
                  {instructor.phone}
                </span>
              ) : null}
              {instructor.sessionLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 shrink-0" />
                  Session : {instructor.sessionLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Parcours / bio */}
      {instructor.bio ? (
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <GraduationCap className="size-5 text-primary" />
            Parcours & pédagogie
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {instructor.bio}
          </p>
        </section>
      ) : null}

      {instructor.specialties.length > 0 ? (
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <BookOpen className="size-4" />
            Domaines dispensés
          </h4>
          <div className="flex flex-wrap gap-2">
            {instructor.specialties.map((s) => (
              <Badge key={s} variant="secondary" appearance="light">
                {s}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {instructor.certifications.length > 0 ? (
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Award className="size-4" />
            Certifications & agréments
          </h4>
          <ul className="space-y-2">
            {instructor.certifications.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                <Award className="mt-0.5 size-4 shrink-0 text-primary/70" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {instructor.pedagogicalReferences.length > 0 && !instructor.bio ? (
        <section>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Références pédagogiques
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {instructor.pedagogicalReferences.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
