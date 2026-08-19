'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className='w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500'
    {...props}
  />
);

export function TrainingProgramForm({ id }: { id?: string }) {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    if (status !== 'authenticated') return;
    setIsAdmin(session.user.role === 'ADMIN');
  }, [session, status]);
  console.log(isAdmin);
  const formSchema = z.object({
    name: z.string().min(1, { message: 'Required.' }),
    description: z.string().min(1, { message: 'Required.' }),
    schoolId: isAdmin ? z.string().optional() : z.string().min(1, 'Required.'),
    outcome: z.string().min(1, { message: 'Required.' }),
  });
  const [schools, setSchools] = React.useState<{ id: string; Name: string }[]>(
    []
  );

  const [loading, setLoading] = React.useState<boolean>(!!id);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      schoolId: '',
      outcome: '',
    },
  });

  React.useEffect(() => {
    async function fetchTrainingProgram() {
      if (!id) return;
      try {
        const response = await fetch(`/api/training-program/${id}`);
        if (!response.ok) throw new Error('Failed to fetch program');

        const data = await response.json();
        form.reset(data);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching training program data.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrainingProgram();
  }, [id, form]);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const method = id ? 'PATCH' : 'POST';
      const url = id ? `/api/training-program/${id}` : '/api/training-program';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      let responseData = {};
      try {
        if (
          response.headers.get('content-type')?.includes('application/json')
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          responseData = await response.json();
        }
      } catch (error) {
        console.warn('Failed to parse JSON response:', error);
      }

      if (response.ok) {
        toast.success(
          id
            ? 'Program Updated Successfully'
            : 'Program Registered Successfully',
          { description: `${values.name}` }
        );

        if (!id) form.reset();
      } else {
        toast.error(`Failed to save training program: ${'Unknown error'}`);
      }
    } catch (error) {
      console.error(' Error submitting form:', error);
      toast.error('Error saving training program.');
    }
  }

  if (loading)
    return <div className='p-4 text-center'>Loading program data...</div>;

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {}
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter program name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {}
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

          {}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Activity, Topic)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Enter program description'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {}
          <FormField
            control={form.control}
            name='outcome'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observations/Expected Outcome</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Observations/Expected Outcome'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>
            {id ? 'Save Changes' : 'Create Training Program'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
