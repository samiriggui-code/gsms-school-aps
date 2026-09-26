import { Container } from '@/components/common/container';
import { QualiopiPageBriefServer } from '@/components/crm/qualiopi-page-brief-server';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Container className="pt-4">
        <QualiopiPageBriefServer
          path="/administration-facturation/finance/devis"
          compact
        />
      </Container>
      {children}
    </>
  );
}
