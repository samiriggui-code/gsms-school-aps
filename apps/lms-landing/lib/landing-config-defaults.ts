import {
  DEFAULT_LANDING_SECTIONS,
  type LandingSectionConfig,
} from '@repo/database/browser';

export type LandingPageConfig = {
  enabled: boolean;
  sections: LandingSectionConfig[];
};

export const DEFAULT_LANDING_PAGE_CONFIG: LandingPageConfig = {
  enabled: true,
  sections: DEFAULT_LANDING_SECTIONS,
};
