'use client';



import { Container } from '@/components/common/container';

import {

  Toolbar,

  ToolbarHeading,

  ToolbarTitle,

  ToolbarDescription,

} from '@/components/common/toolbar';

import { usePageToolbarMeta } from '@/components/common/translated-toolbar';

import { LandingTeamList } from './components/landing-team-list';



export default function EquipeLandingPage() {

  const { title, description } = usePageToolbarMeta('/communication-contenu/cms/equipe-landing');



  return (

    <>

      <Container>

        <Toolbar>

          <ToolbarHeading>

            <ToolbarTitle>{title}</ToolbarTitle>

            <ToolbarDescription>{description}</ToolbarDescription>

          </ToolbarHeading>

        </Toolbar>

      </Container>

      <Container>

        <LandingTeamList />

      </Container>

    </>

  );

}


