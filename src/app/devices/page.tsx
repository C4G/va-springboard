/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DeviceForm } from './form';
import { DeviceDetails } from './details';
import { VIEWS } from '@/utils/constants';
import { isAdminOrStaff } from '@/utils/role';
import { DeviceGrid } from '@/app/users/devices-grid';

export const metadata: Metadata = {
  title: 'Devices',
  description: 'Devices Management Page',
};

export default async function DevicesPage({ searchParams }: any) {
  const actualSearchParams = await searchParams;
  const view = actualSearchParams?.view || '';
  const id = actualSearchParams?.id || '';

  const session = await auth();

  if (!isAdminOrStaff(session?.user?.role)) {
    redirect('/');
  }

  return (
    <div className='px-4 py-8'>
      <h1 className='mb-4 text-2xl font-bold'>Devices</h1>
      {view === VIEWS.TABLE && <DeviceGrid />}
      {view === VIEWS.CREATE && <DeviceForm />}
      {view === VIEWS.EDIT && <DeviceForm id={id} />}
      {view === VIEWS.DETAILS && <DeviceDetails />}
    </div>
  );
}
