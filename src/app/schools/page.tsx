import * as React from 'react';

import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VIEWS } from '@/utils/constants';
import { SchoolDetails } from './details';
import { SchoolForm } from './form';
import { isAdminOrStaff } from '@/utils/role';
import { SchoolGrid } from './schools-grid';

export const metadata: Metadata = {
  title: 'Schools',
  description: 'Schools Management Page',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function SchoolsPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;

  const view = actualSearchParams?.view || '';
  const id = actualSearchParams?.id || '';

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Schools</h1>
      {view === VIEWS.TABLE && <SchoolGrid />}
      {view === VIEWS.CREATE && <SchoolForm />}
      {view === VIEWS.EDIT && <SchoolForm id={id} />}
      {view === VIEWS.DETAILS && <SchoolDetails />}
    </div>
  );
}
