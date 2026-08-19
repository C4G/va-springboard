/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ChevronDown } from 'lucide-react';
import { School } from '@/utils/types';
import { useSession } from 'next-auth/react';

const formSchema = z.object({
  schoolId: z.string().min(1, 'Required'),
  studentId: z.string().min(1, 'Required'),
  deviceId: z.string().min(1, 'Required'),
  issueDate: z.date(),
  required: z.string().min(1, 'Required'),
});

export function BeneficiaryForm({ id }: { id?: string }) {
  const [students, setStudents] = React.useState<
    {
      id: string;
      firstName: string;
      schoolId: string;
      schoolName: string;
      school: School;
    }[]
  >([]);
  const [devices, setDevices] = React.useState<{ id: string; type: string }[]>(
    []
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolId: '',
      studentId: '',
      deviceId: '',
      issueDate: new Date(),
      required: 'N',
    },
  });

  const [schoolName, setSchoolName] = React.useState<string>('');
  const { data: session, status } = useSession();

  React.useEffect(() => {
    async function fetchOptions() {
      if (status !== 'authenticated') return;
      try {
        const [studentsRes, devicesRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/devices'),
        ]);

        const filteredData =
          session?.user?.role === 'STAFF' && session.user.schoolId
            ? (await studentsRes.json()).filter(
                (student) => student.schoolId === session.user.schoolId
              )
            : await studentsRes.json();
        if (studentsRes.ok) setStudents(filteredData);
        if (devicesRes.ok) setDevices(await devicesRes.json());
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    }
    fetchOptions();
  }, [session, status]);

  React.useEffect(() => {
    async function fetchBeneficiary() {
      if (!id) return;

      try {
        const response = await fetch(`/api/beneficiary/${id}`);
        if (!response.ok) throw new Error('Failed to fetch beneficiary');

        const data = await response.json();
        console.log('Loaded Beneficiary:', data);

        form.reset({
          ...data,
          issueDate: new Date(data.issueDate),
        });

        const student = students.find((s) => s.id === data.studentId);
        if (student) {
          form.setValue('schoolId', student.schoolId);
        }
      } catch (error) {
        console.error('Error fetching beneficiary:', error);
      }
    }
    fetchBeneficiary();
  }, [id, form, students]);

  function handleStudentSelect(studentId: string) {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      form.setValue('schoolId', student.schoolId, { shouldValidate: true });
      setSchoolName(student.school.name || '');
    }
    form.setValue('studentId', studentId);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/beneficiary/${id}` : '/api/beneficiary';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          schoolId: form.getValues('schoolId'),
        }),
      });

      if (response.ok) {
        toast.success(
          id
            ? 'Beneficiary Updated Successfully'
            : 'Beneficiary Registered Successfully',
          {
            description: `Assigned Device to Student`,
          }
        );

        if (!id) form.reset();
      } else {
        const responseData = await response.json();
        toast.error(`Failed to save beneficiary: ${'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error saving beneficiary.');
    }
  }

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-6'
        >
          {}
          <FormField
            control={form.control}
            name='studentId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student</FormLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>
                      {students.find((s) => s.id === field.value)?.firstName ||
                        'Select Student'}
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='center'
                    className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
                  >
                    {students.map((student) => (
                      <DropdownMenuItem
                        key={student.id}
                        onClick={() => handleStudentSelect(student.id)}
                      >
                        {student.firstName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='hidden'>
            <FormField
              control={form.control}
              name='schoolId'
              render={() => (
                <FormItem>
                  <FormLabel>
                    School (Auto-filled from student selection)
                  </FormLabel>
                  <FormControl>
                    <Input
                      value={schoolName}
                      readOnly
                      className='cursor-not-allowed'
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {}
          <FormField
            control={form.control}
            name='deviceId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device</FormLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>
                      {devices.find((d) => d.id === field.value)?.type ||
                        'Select Device'}
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='center'
                    className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
                  >
                    {devices.map((device) => (
                      <DropdownMenuItem
                        key={device.id}
                        onClick={() => field.onChange(device.id)}
                      >
                        {device.type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='issueDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input
                    type='date'
                    {...field}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='required'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required</FormLabel>
                <FormControl>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline'>
                        {field.value}
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align='center'
                      className='rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
                    >
                      <DropdownMenuRadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <DropdownMenuRadioItem value='Y'>
                          Y
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value='N'>
                          N
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />
          <Button type='submit'>{id ? 'Save Changes' : 'Assign Device'}</Button>
        </form>
      </Form>
    </div>
  );
}
