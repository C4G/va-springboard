/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { toast } from 'sonner';

export function SchoolDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [school, setSchool] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchSchool() {
      try {
        console.log('Fetching school with ID:', id);
        const response = await fetch(`/api/schools/${id}`);

        if (!response.ok) {
          console.error(' School not found:', id);
          throw new Error('School not found');
        }

        const data = await response.json();
        console.log(' School found:', data);
        setSchool(data);
      } catch (error) {
        console.error('Error fetching school:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchSchool();
    }
  }, [id]);

  if (loading) {
    return <div className='p-4 text-center'>Loading school details...</div>;
  }

  if (!school) {
    return (
      <div className='p-4 text-center text-red-500'>School not found.</div>
    );
  }

  const schoolData = [
    { label: 'Name', value: school.Name },
    { label: 'Location', value: school.Location },
    { label: 'Phone', value: school.Phone },
    { label: 'Tier', value: school.Tier },
    { label: 'Email', value: school.Email },
    { label: 'Notes', value: school.Notes },
  ];

  const onDelete = async () => {
    try {
      console.log('Deleting school with ID:', id);
      const response = await fetch(`/api/schools/${id}`, { method: 'DELETE' });

      if (!response.ok) throw new Error('Failed to delete school');

      toast.success('Successfully Deleted School', {
        description: school.Name,
      });

      window.location.href = '/schools';
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error('Error deleting school.');
    }
  };

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <div className='flex justify-between'>
        <h1 className='mb-4 pb-2 pl-8 text-4xl font-bold leading-none tracking-tight text-gray-900 dark:text-white md:text-2xl lg:text-2xl'>
          {school.Name}
        </h1>
        <div>
          <Link
            href={`/grantsSchool?view=table&id=${school.id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Eye /> See All Grants for this School
            </Button>
          </Link>
          <Link
            href={`/schools?view=edit&id=${school.id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Pencil /> Edit
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant='outline'>
                <Trash2 /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle className='py-4'>
                  Are you sure you want to delete school?
                </DialogTitle>
                <DialogDescription>
                  {`This will delete ${school.Name} permanently. You cannot undo this action.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className='sm:justify-end'>
                <DialogClose asChild>
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={onDelete}
                  >
                    Delete
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className='flex rounded-md border py-8'>
        <div className='w-1/2'>
          {schoolData.map(({ label }, index) => (
            <div key={`label-${index}`} className='p-1'>
              <h4 className='h-8 px-8 text-base font-medium leading-none'>{`${label}:`}</h4>
              {index < schoolData.length - 1 && (
                <Separator className='my-1 ml-4' />
              )}
            </div>
          ))}
        </div>
        <div className='w-1/2'>
          {schoolData.map(({ value }, index) => (
            <div key={`value-${index}`} className='p-1'>
              <h4 className='h-8 text-sm font-medium leading-none text-muted-foreground'>
                {value}
              </h4>
              {index < schoolData.length - 1 && (
                <Separator className='my-1 w-11/12' />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
