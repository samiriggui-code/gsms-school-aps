'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { AccountUserProfileContent } from '@/app/(protected)/securite-configuration/acces/user-profile/content';

export default function AccountUserProfilePage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <Container>
        <AccountUserProfileContent />
      </Container>
    </Fragment>
  );
}
