'use client';

import {
  SectionSecurityHighlightsCard,
  type SectionSecurityHighlightsCardProps,
  type ISecurityHighlightsRow,
  type ISecurityHighlightsItem,
} from '@/components/common/section-security-highlights-card';

type Props = Omit<SectionSecurityHighlightsCardProps, 'titleKey'>;

const SecurityHighlightsB = (props: Props) => (
  <SectionSecurityHighlightsCard
    titleKey="sections.supportQualite.securityHighlightsTitle"
    {...props}
  />
);

export {
  SecurityHighlightsB,
  type ISecurityHighlightsRow,
  type ISecurityHighlightsItem,
  type Props as ISecurityHighlightsProps,
};

export type ISecurityHighlightsRows = ISecurityHighlightsRow[];
export type ISecurityHighlightsItems = ISecurityHighlightsItem[];
