// Section B - Gestion des Ressources components
// Re-export shared components (only truly generic ones)
export { HelpSection } from '@/components/common/help-section';

// Section B specific components
import { RessourcesStatsDynamic } from './section-b-stats-dynamic';
export { SectionBMenuCards } from './section-b-menu-cards';
export { RessourcesStatsDynamic };
export { WelcomeCallout } from './section-b-welcome-callout';
export { SecurityHighlightsB } from './section-b-security-highlights';
export { SecurityStats } from './security-stats';
