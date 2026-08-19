/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GrantDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [grant, setGrant] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [schools, setSchools] = React.useState<{ id: string; Name: string }[]>(
    []
  );

  React.useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) throw new Error('Failed to fetch schools');
        const data = await response.json();
        setSchools(data);
      } catch (error) {
        console.error(' Error fetching schools:', error);
      }
    }
    fetchSchools();
  }, []);

  React.useEffect(() => {
    async function fetchGrant() {
      if (!id) return;
      try {
        const response = await fetch(`/api/grants/${id}`);
        if (!response.ok) throw new Error('Failed to fetch grant');
        const data = await response.json();
        setGrant(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchGrant();
  }, [id]);

  if (loading) return <div>Loading grant details...</div>;

  return (
    <div className='p-6 text-white'>
      <h1 className='mb-4 text-3xl font-bold'>Grant Details</h1>

      {grant ? (
        <div className='rounded-lg bg-gray-800 p-6 shadow-md'>
          <Link
            href={`/grants?view=edit&id=${grant.id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Pencil /> Edit
            </Button>
          </Link>
          <p className='mb-2 text-lg font-semibold'>
            <strong>MOU Date:</strong>{' '}
            {new Date(grant.mouDate).toLocaleDateString()}
          </p>
          <p className='mb-2 text-lg font-semibold'>
            <strong>School:</strong>{' '}
            {schools.find((s) => s.id === grant.schoolId)?.Name || 'Unknown'}
          </p>
          <p className='mb-2 text-lg font-semibold'>
            <strong>Total Grant:</strong> ${grant.grantTotal.toFixed(2)}
          </p>
          <p className='mb-2 text-lg font-semibold'>
            <strong>Infrastructure Grant:</strong> ${grant.grantInf.toFixed(2)}
          </p>
          <p className='mb-2 text-lg font-semibold'>
            <strong>Training Grant:</strong> ${grant.grantTrain.toFixed(2)}
          </p>
          <p className='mb-2 text-lg font-semibold'>
            <strong>Infrastructure Grant Amount Spent:</strong> $
            {grant.grantInfSp.toFixed(2)}
          </p>
          <p className='mb-4 text-lg font-semibold'>
            <strong>Training Grant Amount Spent:</strong> $
            {grant.grantTrainSp.toFixed(2)}
          </p>
        </div>
      ) : (
        <div className='text-red-400'>Grant not found.</div>
      )}
    </div>
  );
}
