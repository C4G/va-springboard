'use client';

import { Suspense } from 'react';
import EnrollmentForm from './form';
import EnrollmentDetails from './details';
import { VIEWS } from '@/utils/constants';
import { useSearchParams } from 'next/navigation';
import { EnrollmentsGrid } from '@/app/studentTraining/studentTraining-grid';

function PageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const id = searchParams.get('id') || '';

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold'>Student Training Enrollment</h1>
      {view === 'create' && <EnrollmentForm />}
      {view === VIEWS.TABLE && <EnrollmentsGrid />}
      {view === 'edit' && id ? <EnrollmentForm id={id} /> : null}
      {view === 'details' && id ? <EnrollmentDetails /> : null}
    </div>
  );
}

export default function EnrollmentPage() {
  return (
    <Suspense fallback={<div className='p-6'>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
