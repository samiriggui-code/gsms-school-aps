import { redirect } from 'next/navigation';

export default function ProtectedEntryPage() {
  redirect('/accueil');
}
