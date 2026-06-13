'use client';

import { InstructorShell } from '@/components/instructor/instructor-shell';

/** Layout client — évite les erreurs Turbopack « module factory » (même pattern que `(protected)/layout`). */
export default function FormateurLayout({ children }: { children: React.ReactNode }) {
  return <InstructorShell>{children}</InstructorShell>;
}
