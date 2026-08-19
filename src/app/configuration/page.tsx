import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/utils/role';

export const metadata: Metadata = {
  title: 'Configuration',
  description: 'Configuration Management Page',
};

export default async function ConfigurationPage() {
  const session = await auth();

  if (!isAdmin(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Configuration</h1>
      <p>This page is currently under construction.</p>
    </div>
  );
}
