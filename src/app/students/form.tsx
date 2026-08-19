/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Calendar as CalendarIcon, ChevronDown, SaveIcon } from 'lucide-react';

import { toast } from 'sonner';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { DuplicateWarningDialog } from './duplicate-warning-dialog';

const CLASS_OPTIONS = [
  'FIRST',
  'SECOND',
  'THIRD',
  'FOURTH',
  'FIFTH',
  'SIXTH',
  'SEVENTH',
  'EIGHTH',
  'NINTH',
  'TENTH',
  'ELEVENTH',
  'TWELFTH',
  'OTHER',
] as const;

const formSchema = z.object({
  firstName: z.string().min(1, 'Required.'),
  // lastName: z.string().min(1, 'Required.'),
  dateOfBirth: z.date().refine((date) => date < new Date(), {
    message: 'Date of Birth cannot be today or a future date.',
  }),
  age: z.string().optional(),
  gender: z.string().min(1, 'Required.'),
  visualAcuity: z.string().min(1, 'Required.'),
  className: z.string().min(1, 'Required.'),
  studentClass: z.enum(CLASS_OPTIONS),
  aadharNumber: z.string().min(1, 'Required.'),
  city: z.string().min(1, 'Required.'),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  govDisabilityCert: z.string().min(1, 'Required.'),
  schoolId: z.string().min(1, 'Required.'),
  caseStory: z.string().optional(),
});

export function StudentForm({ id }: { id?: string }) {
  const [schools, setSchools] = React.useState<{ id: string; Name: string }[]>(
    []
  );
  const [mode, setMode] = useState('age'); // 'dob' or 'age'
  const { data: session, status } = useSession();
  const [duplicates, setDuplicates] = useState<
    {
      id: string;
      firstName: string;
      lastName: string | null;
      aadharNumber: string;
      gender: string;
      schoolName: string | null;
    }[]
  >([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<
    typeof formSchema
  > | null>(null);

  React.useEffect(() => {
    if (status !== 'authenticated') return;

    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) throw new Error('Failed to fetch schools');

        const data = await response.json();

        const filteredData =
          session.user.role === 'STAFF' && session.user.schoolId
            ? data.filter((school) => school.id === session.user.schoolId)
            : data;

        setSchools(filteredData);
        if (filteredData.length === 1) {
          form.setValue('schoolId', filteredData[0].id);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    }

    fetchSchools();
  }, [status, session]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      // lastName: '',
      dateOfBirth: new Date(),
      gender: 'M',
      visualAcuity: 'LV',
      className: 'OTHER',
      studentClass: 'OTHER',
      aadharNumber: '',
      city: '',
      phoneNumber: '',
      email: '',
      govDisabilityCert: '',
      schoolId: '',
      caseStory: '',
    },
  });

  React.useEffect(() => {
    async function fetchStudent() {
      if (!id) return;

      try {
        const response = await fetch(`/api/students/${id}`);
        if (!response.ok) throw new Error('Failed to fetch student');

        const data = await response.json();
        console.log('Loaded student data:', data);

        form.reset({
          ...data,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          visualAcuity: data.visualAcuity,
          schoolId: data.schoolId || '',
        });
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    }

    fetchStudent();
  }, [id, form]);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;

    if (newMode === 'age') {
      // Switching to AGE: Clear the DOB value
      form.setValue('dateOfBirth', null);
    } else {
      // Switching to DOB: Clear the Age value
      form.setValue('age', null);
    }
    setMode(newMode);
  };

  async function saveStudent(
    values: z.infer<typeof formSchema>,
    skipDuplicateCheck = false
  ) {
    const method = id ? 'PATCH' : 'POST';
    const url = id ? `/api/students/${id}` : '/api/students';
    const payload = {
      ...values,
      ...(skipDuplicateCheck ? { skipDuplicateCheck: true } : {}),
    };
    delete payload.age;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const isJson = response.headers
      .get('content-type')
      ?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (response.ok) {
      toast.success(
        id ? 'Student Updated Successfully' : 'Student Registered Successfully',
        { description: `${values.firstName}` }
      );

      if (!id && data?.id) {
        window.location.href = `/students?view=edit&id=${data.id}`;
        return;
      }

      form.reset({
        ...values,
        dateOfBirth: new Date(values.dateOfBirth),
      });
    } else {
      toast.error(`Failed to save student: ${data?.error ?? 'Unknown error'}`);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Check for duplicates before saving
      const checkRes = await fetch('/api/students/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: values.firstName,
          gender: values.gender,
          schoolId: values.schoolId,
          aadharNumber: values.aadharNumber,
          excludeId: id || undefined,
        }),
      });

      const checkData = await checkRes.json();

      if (checkData.duplicates && checkData.duplicates.length > 0) {
        setDuplicates(checkData.duplicates);
        setPendingValues(values);
        setShowDuplicateDialog(true);
        return;
      }

      await saveStudent(values);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error saving student.');
    }
  }

  async function handleProceedAnyway() {
    setShowDuplicateDialog(false);
    if (pendingValues) {
      try {
        await saveStudent(pendingValues, true);
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error('Error saving student.');
      }
      setPendingValues(null);
    }
  }

  const calculateDOBFromAge = (age: number): Date => {
    const today = new Date();
    // Calculate the birth year
    const birthYear = today.getFullYear() - age;
    // For simplicity when only age is known, approximate the DOB as January 1st
    // of the calculated birth year.
    return new Date(birthYear, 0, 1);
  };

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='flex gap-24'>
          <div className='space-y-4'>
            {}
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='city'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder='City' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone No. (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='Phone No.' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='Email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Toggle Control */}
          {/*<div className="flex justify-center p-1 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-inner">*/}
          <div className='space-y-4'>
            <input
              id='radio-dob'
              type='radio'
              name='input-mode'
              value='dob'
              checked={mode === 'dob'}
              onChange={() => handleModeSwitch('dob')}
              className='h-4 w-4 cursor-pointer border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700'
            />
            <label
              htmlFor='radio-dob'
              className='ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300'
            >
              Date of Birth
            </label>

            <input
              id='radio-age'
              type='radio'
              name='input-mode'
              value='age'
              checked={mode === 'age'}
              onChange={() => handleModeSwitch('age')}
              className='h-4 w-4 cursor-pointer border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700'
            />
            <label
              htmlFor='radio-age'
              className='ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300'
            >
              Age
            </label>
            {}
            {mode === 'dob' && (
              <FormField
                control={form.control}
                name='dateOfBirth'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          const today = new Date();
                          const value = (
                            today.getFullYear() - date.getFullYear()
                          ).toString();
                          field.onChange(date);
                          form.setValue('age', value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {mode === 'age' && (
              <FormField
                control={form.control}
                name='age'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        inputMode='numeric'
                        pattern='\d{1,2}'
                        maxLength={2}
                        placeholder='e.g., 30'
                        {...field}
                        /*// The 'value' is a number, so we display it directly*/
                        value={field.value ?? ''}
                        // value={calculateDOBFromAge(field.value).toISOString().split('T')[0] ?? ''}
                        onChange={(e) => {
                          // Convert string input to a number or null if empty
                          const ageInput = e.target.value;
                          const newAge = ageInput ? Number(ageInput) : null;

                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 2) {
                            field.onChange(value);
                          }

                          if (newAge && newAge > 0) {
                            const calculatedDOB = calculateDOBFromAge(newAge);
                            form.setValue('dateOfBirth', calculatedDOB);
                          } else {
                            form.setValue('dateOfBirth', null);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {}
            <FormField
              control={form.control}
              name='aadharNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhar No.</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode='numeric'
                      pattern='\d{12}'
                      maxLength={12}
                      placeholder='Aadhar No.'
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 12) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='gender'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
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
                        className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
                      >
                        <DropdownMenuRadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <DropdownMenuRadioItem value='M'>
                            M
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value='F'>
                            F
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='visualAcuity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Acuity</FormLabel>
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
                        className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
                      >
                        <DropdownMenuRadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <DropdownMenuRadioItem value='LV'>
                            LV
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value='Blind'>
                            Blind
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='studentClass'
              render={({ field }) => {
                const handleValueChange = (
                  newValue: (typeof CLASS_OPTIONS)[number]
                ) => {
                  // a. Update the field controlling the dropdown (studentClass)
                  field.onChange(newValue);

                  // b. Update the second field (className) using form.setValue
                  //    We need access to the 'form' object, which is usually passed
                  //    into the parent component or accessible via useForm().
                  form.setValue('className', newValue);
                };

                return (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline'>
                            {field.value || 'Select a Class'}
                            <ChevronDown className='ml-2 h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start'>
                          <DropdownMenuRadioGroup
                            value={field.value}
                            onValueChange={handleValueChange}
                          >
                            {/* Use .map() to dynamically generate the radio items */}
                            {CLASS_OPTIONS.map((class_opt) => (
                              <DropdownMenuRadioItem
                                key={class_opt}
                                value={class_opt}
                              >
                                {/* The text displayed to the user */}
                                {class_opt}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {}
            {schools.length > 1 ? (
              <FormField
                control={form.control}
                name='schoolId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <FormControl>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline'>
                            {schools.find((s) => s.id === field.value)?.Name ||
                              'Select a School'}
                            <ChevronDown />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='center'
                          className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
                        >
                          <DropdownMenuRadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <DropdownMenuRadioItem value=''>
                              None
                            </DropdownMenuRadioItem>
                            {schools.map((school) => (
                              <DropdownMenuRadioItem
                                key={school.id}
                                value={school.id}
                              >
                                {school.Name}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <input type='hidden' {...form.register('schoolId')} />
            )}

            {}
            <FormField
              control={form.control}
              name='govDisabilityCert'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Government Disability Certificate (Y/N/ NA)
                  </FormLabel>
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
                        className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
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
                          <DropdownMenuRadioItem value='N/A'>
                            N/A
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='caseStory'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Story (optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder='Write any case story here...'
                      className='w-full rounded border p-2'
                      rows={4}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {id ? 'Save Changes' : 'Add Student'}
              <SaveIcon />
            </Button>
          </div>
        </form>
      </Form>

      <DuplicateWarningDialog
        open={showDuplicateDialog}
        duplicates={duplicates}
        onCancel={() => {
          setShowDuplicateDialog(false);
          setPendingValues(null);
        }}
        onProceed={handleProceedAnyway}
      />
    </div>
  );
}
