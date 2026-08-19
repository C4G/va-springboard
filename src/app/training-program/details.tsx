/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
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
type School = {
  id: string;
  Name: string;
  Location: string;
  Phone: string;
  Email: string;
  Tier: string;
};

export default function TrainingProgramDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [program, setProgram] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [schools, setSchools] = React.useState<School[]>([]);

  React.useEffect(() => {
    async function fetchProgram() {
      try {
        console.log('Fetching training program with ID:', id);
        const response = await fetch(`/api/training-program/${id}`);

        if (!response.ok) {
          console.error('Training Program not found:', id);
          throw new Error('Training Program not found');
        }

        const data = await response.json();
        console.log('Training Program found:', data);
        setProgram(data);
      } catch (error) {
        console.error('Error fetching training program:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProgram();
    }
  }, [id]);

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

  if (loading) {
    return (
      <div className='p-4 text-center'>Loading training program details...</div>
    );
  }

  if (!program) {
    return (
      <div className='p-4 text-center text-red-500'>
        Training Program not found.
      </div>
    );
  }

  const onDelete = async () => {
    try {
      console.log('Deleting training program with ID:', id);
      const response = await fetch(`/api/training-program/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete training program');

      toast.success('Successfully Deleted Training Program', {
        description: program.name,
      });

      window.location.href = '/training-program';
    } catch (error) {
      console.error('Error deleting training program:', error);
      toast.error('Error deleting training program.');
    }
  };

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <div className='flex justify-between'>
        <h1 className='mb-4 pb-2 pl-8 text-4xl font-bold leading-none tracking-tight text-gray-900 dark:text-white md:text-2xl lg:text-2xl'>
          {program.name}
        </h1>
        <div>
          <Link
            href={`/trainingEnrolls?view=table&id=${program.id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Pencil /> See All Students Enrolled in this Training Program
            </Button>
          </Link>
          <Link
            href={`/training-program?view=edit&id=${program.id}`}
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
                  Are you sure you want to delete this training program?
                </DialogTitle>
                <DialogDescription>
                  {`This will delete "${program.name}" permanently. You cannot undo this action.`}
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
          <div className='p-1'>
            <h4 className='h-8 px-8 text-base font-medium leading-none'>{`Description:`}</h4>
            <Separator className='my-1 ml-4' />
          </div>
          <div className='p-1'>
            <h4 className='h-8 px-8 text-base font-medium leading-none'>{`School:`}</h4>
          </div>
        </div>
        <div className='w-1/2'>
          <div className='p-1'>
            <h4 className='h-8 text-sm font-medium leading-none text-muted-foreground'>
              {program.description}
            </h4>
            <Separator className='my-1 w-11/12' />
          </div>
          <div className='p-1'>
            <h4 className='h-8 text-sm font-medium leading-none text-muted-foreground'>
              {schools.find((s) => s.id === program.schoolId)?.Name ||
                'Unknown'}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
