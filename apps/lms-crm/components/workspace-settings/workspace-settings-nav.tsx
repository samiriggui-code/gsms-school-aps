'use client';

import { ScrollspyMenu } from '@/partials/navbar/scrollspy-menu';
import type { WorkspaceSettingsSectionDef } from '@/config/workspace-settings.config';

export function WorkspaceSettingsNav({
  sections,
}: {
  sections: WorkspaceSettingsSectionDef[];
}) {
  const items = sections.map((s, i) => ({
    title: s.title,
    target: s.anchor,
    active: i === 0,
  }));

  return <ScrollspyMenu items={items} />;
}
