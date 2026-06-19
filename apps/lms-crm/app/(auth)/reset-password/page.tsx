'use client';

import dynamic from 'next/dynamic';

const ResetPasswordPage = dynamic(() => import('./reset-password-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return <ResetPasswordPage />;
}
