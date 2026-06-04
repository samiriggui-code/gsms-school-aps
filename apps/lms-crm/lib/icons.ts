import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpenCheck,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Clock3,
  GraduationCap,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
} from 'lucide-react';

type IconLike = LucideIcon | string | null | undefined;

const FALLBACK_ICON: LucideIcon = AlertCircle;

/**
 * Icônes résolues par nom (API / config). Import explicite : avec Turbopack / `import *`
 * depuis `lucide-react`, les noms non référencés statiquement peuvent être absents → tout
 * retombait sur {@link FALLBACK_ICON}.
 */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  AlertCircle,
  AlertTriangle,
  BookOpenCheck,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Clock3,
  GraduationCap,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
};

export function getIcon(icon: IconLike): LucideIcon {
  if (!icon) {
    return FALLBACK_ICON;
  }

  if (typeof icon !== 'string') {
    return icon;
  }

  const key = icon.trim();
  if (!key) {
    return FALLBACK_ICON;
  }

  return ICON_REGISTRY[key] ?? FALLBACK_ICON;
}
