'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CombinedReport from './unified';
import { isKnownRole } from '@/utils/role';

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return <div className='p-6'>Loading...</div>;
  if (status === 'unauthenticated' || !isKnownRole(session?.user?.role)) {
    return null;
  }

  return (
    <div className='p-6'>
      {view === 'unified' && (
        <>
          <h1 className='mb-4 text-2xl font-bold'>Reports</h1>
          <CombinedReport />
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className='p-6'>Loading reports...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
