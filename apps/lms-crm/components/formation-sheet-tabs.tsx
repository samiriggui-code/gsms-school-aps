'use client';

import { TabsList, TabsTrigger } from '@repo/ui/tabs';
import { useFormationSheetLabels } from '@/hooks/useFormationSheetLabels';

type Props = {
  /** BS/BE sheet hides program / prerequisites / sessions */
  variant?: 'full' | 'financingOnly';
  className?: string;
};

export function FormationSheetTabsList({ variant = 'full', className }: Props) {
  const { tabs } = useFormationSheetLabels();

  if (variant === 'financingOnly') {
    return (
      <TabsList className={className}>
        <TabsTrigger value="overview">{tabs.overview}</TabsTrigger>
        <TabsTrigger value="financing">{tabs.financing}</TabsTrigger>
      </TabsList>
    );
  }

  return (
    <TabsList className={className}>
      <TabsTrigger value="overview">{tabs.overview}</TabsTrigger>
      <TabsTrigger value="program">{tabs.program}</TabsTrigger>
      <TabsTrigger value="prerequisites">{tabs.prerequisites}</TabsTrigger>
      <TabsTrigger value="financing">{tabs.financing}</TabsTrigger>
      <TabsTrigger value="sessions">{tabs.sessions}</TabsTrigger>
      <TabsTrigger value="certification">{tabs.certification}</TabsTrigger>
    </TabsList>
  );
}
