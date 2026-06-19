'use client';

import dynamic from 'next/dynamic';

const SigninPage = dynamic(() => import('./signin-page-with-layout'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return <SigninPage />;
}
