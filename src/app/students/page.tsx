/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VIEWS } from '@/utils/constants';
import { StudentDetails } from './details';
import { StudentForm } from './form';
import { isAdminOrStaff } from '@/utils/role';
import { StudentsGrid } from '@/app/students/students-grid';

export const metadata: Metadata = {
  title: 'Students',
  description: 'Students Management Page',
};

export default async function StudentsPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;

  const view = actualSearchParams?.view;
  const id = actualSearchParams?.id;

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Students</h1>
      {view === VIEWS.TABLE && <StudentsGrid />}
      {view === VIEWS.CREATE && <StudentForm />}
      {view === 'edit' && <StudentForm id={id ?? undefined} />}
      {view === VIEWS.DETAILS && <StudentDetails />}
    </div>
  );
}
