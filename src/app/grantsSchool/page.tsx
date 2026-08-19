import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isAdminOrStaff } from '@/utils/role';
import { VIEWS } from '@/utils/constants';
import { GrantTable } from './table';

export const metadata: Metadata = {
  title: 'Grant',
  description: 'Grant Management Page',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function GrantPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;

  const view = actualSearchParams?.view || '';

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Grants for School</h1>
      {view === VIEWS.TABLE && <GrantTable />}
    </div>
  );
}
