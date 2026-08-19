import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isAdminOrStaff } from '@/utils/role';
import { VIEWS } from '@/utils/constants';
import { GrantForm } from './form';
import GrantDetails from './details';
import { GrantsGrid } from '@/app/grants/grid';

export const metadata: Metadata = {
  title: 'Grant',
  description: 'Grant Management Page',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function GrantPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;

  const view = actualSearchParams?.view || '';
  const id = actualSearchParams?.id || '';

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Grant</h1>
      {view === VIEWS.TABLE && <GrantsGrid />}
      {view === VIEWS.CREATE && <GrantForm />}
      {view === VIEWS.EDIT && <GrantForm id={id} />}
      {view === VIEWS.DETAILS && <GrantDetails />}
    </div>
  );
}
