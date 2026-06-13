import type { Metadata } from 'next';
import { FormationClient } from './formation-client';

export const metadata: Metadata = {
  title: 'Ma formation',
};

export default function FormationPage() {
  return <FormationClient />;
}
