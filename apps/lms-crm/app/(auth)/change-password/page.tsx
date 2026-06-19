'use client';

import dynamic from 'next/dynamic';

const ChangePasswordPage = dynamic(() => import('./change-password-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return <ChangePasswordPage />;
}
