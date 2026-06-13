import { redirect } from 'next/navigation';

/** Ancienne route — le dossier CNAPS s’ouvre en sheet depuis Mon dossier. */
export default function CnapsRedirectPage() {
  redirect('/mon-dossier?cnaps=1');
}
