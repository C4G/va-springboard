'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronDown, SaveIcon } from 'lucide-react';

import { toast } from 'sonner';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';

const formSchema = z.object({
  mouDate: z.coerce.date(),
  grantInf: z.coerce.number(),
  grantInfSp: z.coerce.number(),
  grantTrain: z.coerce.number(),
  grantTrainSp: z.coerce.number(),
  grantTotal: z.coerce.number(),
  schoolId: z.string().min(1, 'Required.'),
});

export function GrantForm({ id }: { id?: string }) {
  const { data: session, status } = useSession();
  const [schools, setSchools] = React.useState<{ id: string; Name: string }[]>(
    []
  );

  React.useEffect(() => {
    async function fetchSchools() {
      if (status !== 'authenticated') return;
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) throw new Error('Failed to fetch schools');
        const data = await response.json();
        const filteredData =
          session?.user?.role === 'STAFF' && session.user.schoolId
            ? data.filter((p) => p.id === session.user.schoolId)
            : data;
        setSchools(filteredData);
        if (filteredData.length === 1) {
          form.setValue('schoolId', filteredData[0].id);
        }
      } catch (error) {
        console.error(' Error fetching schools:', error);
      }
    }
    fetchSchools();
  }, [session, status]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mouDate: new Date(),
      grantInf: 0.0,
      grantInfSp: 0.0,
      grantTrain: 0.0,
      grantTrainSp: 0.0,
      grantTotal: 0.0,
      schoolId: '',
    },
  });

  React.useEffect(() => {
    async function fetchGrant() {
      if (!id) return;

      try {
        const response = await fetch(`/api/grants/${id}`);
        if (!response.ok) throw new Error('Failed to fetch grant');

        const data = await response.json();
        console.log(' Loaded grant data:', data);

        form.reset({
          ...data,
          dateOfBirth: new Date(data.dateOfBirth),
          schoolId: data.schoolId || '',
        });
      } catch (error) {
        console.error(' Error fetching grant:', error);
      }
    }

    fetchGrant();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const method = id ? 'PATCH' : 'POST';
      const url = id ? `/api/grants/${id}` : '/api/grants';

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
          id ? 'Grants Updated Successfully' : 'Grant Registered Successfully',
          { description: `` }
        );

        if (!id) form.reset();
      } else {
        toast.error(`Failed to save grant: ${'Unknown error'}`);
      }
    } catch (error) {
      console.error(' Error submitting form:', error);
      toast.error('Error saving grant.');
    }
  }

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='flex gap-24'>
          <div className='space-y-4'>
            {}
            <FormField
              control={form.control}
              name='mouDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MOU Date</FormLabel>
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
              name='grantInf'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Infrastructure Grant</FormLabel>
                  <FormControl>
                    <Input placeholder='0.0' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='grantTrain'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Grant</FormLabel>
                  <FormControl>
                    <Input placeholder='0.0' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='grantTotal'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Grant</FormLabel>
                  <FormControl>
                    <Input placeholder='0.0' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='grantInfSp'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Infranstructure Grant Amount Spent</FormLabel>
                  <FormControl>
                    <Input placeholder='0.0' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='grantTrainSp'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Grant Amount Spent</FormLabel>
                  <FormControl>
                    <Input placeholder='0.0' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <Button type='submit'>
              {id ? 'Save Changes' : 'Add Grant'}
              <SaveIcon />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
