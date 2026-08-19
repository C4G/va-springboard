import * as React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TrainingProgramForm } from './form';
import { VIEWS } from '@/utils/constants';
import { isAdminOrStaff } from '@/utils/role';
import TrainingProgramDetails from './details';
import { TrainingProgramsGrid } from '@/app/training-program/grid';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Training Programs',
  description: 'Training Programs Management Page',
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function TrainingProgramPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;

  const view = actualSearchParams?.view || '';
  const id = actualSearchParams?.id || '';

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Training Programs</h1>
      {view === VIEWS.TABLE && <TrainingProgramsGrid />}
      {view === 'details' && id ? <TrainingProgramDetails /> : null}
      {view === VIEWS.CREATE && <TrainingProgramForm />}
      {view === VIEWS.EDIT && <TrainingProgramForm id={id} />}
    </div>
  );
}
