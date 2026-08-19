import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isAdminOrStaff } from '@/utils/role';
import { VIEWS } from '@/utils/constants';
import { BeneficiaryForm } from './form';
import { BeneficiaryDetails } from './details';
import { BeneficiaryGrid } from '@/app/beneficiary/beneficiary-grid';

export const metadata: Metadata = {
  title: 'Student Device Assignment',
  description: 'Student Device Assignment Management Page',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function BeneficiaryPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;

  const view = actualSearchParams?.view || '';
  const id = actualSearchParams?.id || '';

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Student Device Assignment</h1>
      {view === VIEWS.TABLE && <BeneficiaryGrid />}
      {view === VIEWS.CREATE && <BeneficiaryForm />}
      {view === VIEWS.EDIT && <BeneficiaryForm id={id} />}
      {view === VIEWS.DETAILS && <BeneficiaryDetails id={id} />}
    </div>
  );
}
