'use client';

import {
  SectionSecurityHighlightsCard,
  type SectionSecurityHighlightsCardProps,
  type ISecurityHighlightsRow,
  type ISecurityHighlightsItem,
} from '@/components/common/section-security-highlights-card';

type Props = Omit<SectionSecurityHighlightsCardProps, 'titleKey'>;

const SecurityHighlightsI = (props: Props) => (
  <SectionSecurityHighlightsCard
    titleKey="sections.administrationFacturation.securityHighlightsTitle"
    {...props}
  />
);

export {
  SecurityHighlightsI,
  type ISecurityHighlightsRow,
  type ISecurityHighlightsItem,
  type Props as ISecurityHighlightsProps,
};

export type ISecurityHighlightsRows = ISecurityHighlightsRow[];
export type ISecurityHighlightsItems = ISecurityHighlightsItem[];
