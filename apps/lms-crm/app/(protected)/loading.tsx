import { RouteTransitionLoader } from '@/components/common/route-transition-loader';

/** Affiché par Next.js pendant le chargement d’un segment (protected). */
export default function ProtectedSegmentLoading() {
  return <RouteTransitionLoader />;
}
