import type { Metadata } from 'next';
import { ApprendreClient } from './apprendre-client';

export const metadata: Metadata = {
  title: 'Apprendre',
};

export default function ApprendrePage() {
  return <ApprendreClient />;
}
