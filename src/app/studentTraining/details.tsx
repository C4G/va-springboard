/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';
import { format } from 'date-fns';
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

export default function EnrollmentDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [enrollment, setEnrollment] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [students, setStudents] = React.useState<
    {
      id: string;
      firstName: string;
      schoolId: string;
      schoolName: string;
      school: School;
    }[]
  >([]);

  type School = {
    id: string;
    Name: string;
    Location: string;
    Phone: string;
    Email: string;
    Tier: string;
  };

  const [trainingPrograms, setTrainingPrograms] = React.useState<
    { id: string; name: string }[]
  >([]);

  React.useEffect(() => {
    async function fetchEnrollment() {
      try {
        console.log('Fetching enrollment with ID:', id);
        const response = await fetch(`/api/studentTraining/${id}`);
        const students = await fetch(`/api/students`);
        const trainingPrograms = await fetch(`/api/training-program`);
        if (!response.ok) {
          console.error('Enrollment not found:', id);
          throw new Error('Enrollment not found');
        }

        const data = await response.json();
        console.log('Enrollment found:', data);
        setEnrollment(data);
        setStudents(await students.json());
        setTrainingPrograms(await trainingPrograms.json());
      } catch (error) {
        console.error('Error fetching enrollment:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchEnrollment();
    }
  }, [id]);

  if (loading) {
    return <div className='p-4 text-center'>Loading enrollment details...</div>;
  }

  if (!enrollment) {
    return (
      <div className='p-4 text-center text-red-500'>Enrollment not found.</div>
    );
  }

  const enrollmentData = [
    {
      label: 'Student Name',
      value: `${students.find((s) => s.id === enrollment.studentId)?.firstName}`,
    },
    {
      label: 'Training Program',
      value: trainingPrograms.find((s) => s.id === enrollment.trainingprogramId)
        ?.name,
    },
    {
      label: 'School',
      value: students.find((s) => s.id === enrollment.studentId)?.school.Name,
    },
    {
      label: 'Start Date',
      value: format(new Date(enrollment.startDate), 'PPP'),
    },
    { label: 'End Date', value: format(new Date(enrollment.endDate), 'PPP') },
    { label: 'Sessions', value: enrollment.sessions },
    { label: 'Notes', value: enrollment.notes || 'N/A' },
  ];

  const onDelete = async () => {
    try {
      console.log('Deleting enrollment with ID:', id);
      const response = await fetch(`/api/studentTraining/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete enrollment');

      toast.success('Successfully Deleted Enrollment');

      window.location.href = '/studentTraining';
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Error deleting enrollment.');
    }
  };

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <div className='flex justify-between'>
        <h1 className='mb-4 pb-2 pl-8 text-4xl font-bold leading-none tracking-tight text-gray-900 dark:text-white md:text-2xl lg:text-2xl'>
          Enrollment Details
        </h1>
        <div>
          {/* Edit Button */}
          <Link
            href={`/studentTraining?view=edit&id=${id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Pencil /> Edit
            </Button>
          </Link>

          {/* Delete Confirmation Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant='outline'>
                <Trash2 /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle className='py-4'>
                  Are you sure you want to delete this enrollment?
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete the enrollment. You cannot undo
                  this action.
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

      {/* Enrollment Details Display */}
      <div className='flex rounded-md border py-8'>
        <div className='w-1/2'>
          {enrollmentData.map(({ label }, index) => (
            <div key={`label-${index}`} className='p-1'>
              <h4 className='h-8 px-8 text-base font-medium leading-none'>{`${label}:`}</h4>
              {index < enrollmentData.length - 1 && (
                <Separator className='my-1 ml-4' />
              )}
            </div>
          ))}
        </div>
        <div className='w-1/2'>
          {enrollmentData.map(({ value }, index) => (
            <div key={`value-${index}`} className='p-1'>
              <h4 className='h-8 text-sm font-medium leading-none text-muted-foreground'>
                {value}
              </h4>
              {index < enrollmentData.length - 1 && (
                <Separator className='my-1 w-11/12' />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
