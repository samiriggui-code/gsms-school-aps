// Section B - Gestion des Ressources components
// Re-export shared components (only truly generic ones)
export { HelpSection } from '@/components/common/help-section';
export { SecurityStats } from '@/components/common/security-stats';

// Section B specific components
import { RessourcesStatsDynamic } from './section-b-stats-dynamic';
export { SectionBMenuCards } from './section-b-menu-cards';
export { RessourcesStatsDynamic };
export { WelcomeCallout } from './section-b-welcome-callout';
export { SecurityHighlightsB } from './section-b-security-highlights';