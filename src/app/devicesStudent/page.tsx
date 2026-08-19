/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DevicesStudentTable } from './table';
import { VIEWS } from '@/utils/constants';
import { isAdminOrStaff } from '@/utils/role';

export const metadata: Metadata = {
  title: 'Devices',
  description: 'Devices Management Page',
};

export default async function DevicesStudentPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;
  const view = actualSearchParams?.view || '';

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Devices for Student</h1>
      {view === VIEWS.TABLE && <DevicesStudentTable />}
    </div>
  );
}
