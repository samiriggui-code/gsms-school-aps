import { Container } from '@/components/common/container';
import { QualiopiPageBriefServer } from '@/components/crm/qualiopi-page-brief-server';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Container className="pt-4">
        <QualiopiPageBriefServer path="/gestion-ressources/rh/formateurs" compact />
      </Container>
      {children}
    </>
  );
}
