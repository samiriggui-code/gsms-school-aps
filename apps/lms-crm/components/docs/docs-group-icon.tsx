import {
  BookOpen,
  Briefcase,
  Globe,
  GraduationCap,
  LifeBuoy,
  Rocket,
  Route,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  rocket: Rocket,
  globe: Globe,
  'user-check': UserCheck,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  'life-buoy': LifeBuoy,
  route: Route,
  book: BookOpen,
};

export function DocsGroupIcon({ name }: { name?: string }) {
  const Icon = (name && MAP[name]) || BookOpen;
  return <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />;
}
