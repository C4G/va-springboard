'use client';

import { Suspense } from 'react';
import EnrollmentTable from './table';

export default function EnrollmentPage() {
  return (
    <Suspense fallback={<div>Loading table...</div>}>
      <div className='p-6'>
        <h1 className='text-2xl font-bold'>Training Enrollments for Student</h1>
        <EnrollmentTable />
      </div>
    </Suspense>
  );
}
