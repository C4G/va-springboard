'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserTable } from './table';
import { UserForm } from './form';

function UsersPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const id = searchParams.get('id');

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return <div className='p-6'>Loading...</div>;
  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN')
    return null;

  return (
    <div className='p-6'>
      {view === 'create' && (
        <>
          <h1 className='mb-4 text-2xl font-bold'>Add New User</h1>
          <UserForm />
        </>
      )}

      {view === 'edit' && id && (
        <>
          <h1 className='mb-4 text-2xl font-bold'>Edit User</h1>
          <UserForm id={id} />
        </>
      )}

      {!view && (
        <>
          <h1 className='mb-4 text-2xl font-bold'>Users</h1>
          <UserTable />
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className='p-6'>Loading users...</div>}>
      <UsersPageContent />
    </Suspense>
  );
}
