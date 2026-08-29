'use client';

import { LeafScaffoldPage } from '@/components/common/leaf-scaffold-page';

export default function BpfPage() {
  return (
    <LeafScaffoldPage
      path="/administration-facturation/finance/bpf"
      chantierId="GSMS-OF-07"
      summary="Bilan Pédagogique et Financier (Cerfa C–G) avec garde-fous déterministes — après registre financeurs (OF-04)."
      nextSteps={[
        'Agrégats session → lignes Cerfa (pas LLM)',
        'Écran pilote avec erreurs de contrôle',
        'Export PDF',
      ]}
      stats={[
        { label: 'Exercices', value: '0', detail: 'BPF' },
        { label: 'Alertes ctrl', value: '0', detail: 'Garde-fous' },
        { label: 'Exports', value: '0', detail: 'PDF' },
      ]}
      backHref="/administration-facturation/finance"
    />
  );
}
