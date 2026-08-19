'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
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

export function StudentDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchStudent() {
      try {
        console.log('Fetching student with ID:', id);
        const response = await fetch(`/api/students/${id}`);

        if (!response.ok) {
          console.error(' Student not found:', id);
          throw new Error('Student not found');
        }

        const data = await response.json();
        console.log(' Student found:', data);
        setStudent(data);
      } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchStudent();
    }
  }, [id]);

  if (loading) {
    return <div className='p-4 text-center'>Loading student details...</div>;
  }

  if (!student) {
    return (
      <div className='p-4 text-center text-red-500'>Student not found.</div>
    );
  }

  const fullName = `${student.firstName}`;

  const studentData = [
    { label: 'Name', value: fullName },
    {
      label: 'Date of Birth',
      value: format(new Date(student.dateOfBirth), 'PPP'),
    },
    { label: 'Gender', value: student.gender },
    { label: 'Visual Acuity', value: student.visualAcuity },
    { label: 'Class', value: student.className },
    { label: 'Aadhar No.', value: student.aadharNumber },
    { label: 'City', value: student.city },
    { label: 'Email', value: student.email },
    {
      label: 'Government Disability Certificate',
      value: student.govDisabilityCert,
    },
    {
      label: 'Student Case Story (if specified)',
      value: student.caseStory,
    },
  ];

  const onDelete = async () => {
    try {
      console.log('Deleting student with ID:', id);
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });

      if (!response.ok) throw new Error('Failed to delete student');

      toast.success('Successfully Deleted Student', { description: fullName });

      window.location.href = '/students';
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Error deleting student.');
    }
  };

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <div className='flex justify-between'>
        <h1 className='mb-4 pb-2 pl-8 text-4xl font-bold leading-none tracking-tight text-gray-900 dark:text-white md:text-2xl lg:text-2xl'>
          {fullName}
        </h1>
        <div>
          <Link
            href={`/students?view=edit&id=${student.id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Pencil /> Edit
            </Button>
          </Link>
          <Link
            href={`/studentEnrolls?view=table&id=${student.id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Eye /> See All Assigned Training Programs for Student
            </Button>
          </Link>
          <Link
            href={`/devicesStudent?view=table&id=${student.id}`}
            legacyBehavior
            passHref
          >
            <Button variant='outline'>
              <Eye /> See All Assigned Devices for Student
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
                  Are you sure you want to delete student?
                </DialogTitle>
                <DialogDescription>
                  {`This will delete ${fullName} permanently. You cannot undo this action.`}
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
          {studentData.map(({ label }, index) => (
            <div key={`label-${index}`} className='p-1'>
              <h4 className='h-8 px-8 text-base font-medium leading-none'>{`${label}:`}</h4>
              {index < studentData.length - 1 && (
                <Separator className='my-1 ml-4' />
              )}
            </div>
          ))}
        </div>
        <div className='w-1/2'>
          {studentData.map(({ value }, index) => (
            <div key={`value-${index}`} className='p-1'>
              <h4 className='h-8 text-sm font-medium leading-none text-muted-foreground'>
                {value}
              </h4>
              {index < studentData.length - 1 && (
                <Separator className='my-1 w-11/12' />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
