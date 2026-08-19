/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronDown, Calendar as SaveIcon } from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@radix-ui/react-dropdown-menu';

const formSchema = z.object({
  Name: z.string().min(1, { message: 'Required.' }),
  Location: z.string().min(1, { message: 'Required.' }),
  Phone: z.string().min(1, { message: 'Required.' }),
  Email: z.string().min(1, { message: 'Required.' }),
  Tier: z.string().min(1, { message: 'Required.' }),
  Notes: z.string().optional(),
});

export function SchoolForm({ id }: { id?: string }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Name: '',
      Location: '',
      Phone: '',
      Tier: '',
      Notes: '',
      Email: '',
    },
  });

  React.useEffect(() => {
    async function fetchSchool() {
      if (!id) return;

      try {
        const response = await fetch(`/api/schools/${id}`);
        if (!response.ok) throw new Error('Failed to fetch school');

        const data = await response.json();
        console.log(' Loaded school data:', data);

        form.reset({
          ...data,
        });
      } catch (error) {
        console.error(' Error fetching school:', error);
      }
    }

    fetchSchool();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const method = id ? 'PATCH' : 'POST';
      const url = id ? `/api/schools/${id}` : '/api/schools';

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
          responseData = await response.json();
        }
      } catch (error) {
        console.warn('Failed to parse JSON response:', error);
      }

      if (response.ok) {
        toast.success(
          id ? 'School Updated Successfully' : 'School Registered Successfully',
          { description: `${values.Name}` }
        );

        if (!id) form.reset();
      } else {
        toast.error(`Failed to save school: ${'Unknown error'}`);
      }
    } catch (error) {
      console.error(' Error submitting form:', error);
      toast.error('Error saving school.');
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
              name='Name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Name</FormLabel>
                  <FormControl>
                    <Input placeholder='School Name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='Location'
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
              name='Phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Phone Number'
                      {...field}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        field.onChange(digitsOnly);
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
              name='Email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='Email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {}
            <FormField
              control={form.control}
              name='Tier'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <FormControl>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='outline'>
                          {field.value || 'Select Tier'}
                          <ChevronDown className='ml-2 h-4 w-4' />
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
                          <DropdownMenuRadioItem value='Tier 1'>
                            Tier 1
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value='Tier 2'>
                            Tier 2
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value='Tier 3'>
                            Tier 3
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='Notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder='Enter any notes'
                      rows={5}
                      className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <Button type='submit'>
              {id ? 'Save Changes' : 'Register School'}
              <SaveIcon />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
