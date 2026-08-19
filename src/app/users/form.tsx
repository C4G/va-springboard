/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const formSchema = z
  .object({
    name: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
    role: z.enum(['ADMIN', 'STAFF', 'READ_ONLY']),
    schoolId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role === 'STAFF') {
        return !!data.schoolId;
      }
      return true;
    },
    {
      message: 'School is required for STAFF role',
      path: ['schoolId'],
    }
  );

export function UserForm({ id }: { id?: string }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'STAFF',
      schoolId: '',
    },
  });

  const [schools, setSchools] = React.useState<{ id: string; Name: string }[]>(
    []
  );

  useEffect(() => {
    async function fetchSchools() {
      const response = await fetch('/api/schools');
      const data = await response.json();
      setSchools(data);
    }
    fetchSchools();
  }, []);

  useEffect(() => {
    if (!id) return;
    async function fetchUser() {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      form.reset(data);
    }
    fetchUser();
  }, [id, form]);

  const onSubmit = async (values: any) => {
    try {
      const method = id ? 'PATCH' : 'POST';
      const url = id ? `/api/users/${id}` : '/api/users';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to save user:', errorData);
        toast.error('Failed to save user');
        return;
      }

      toast.success(
        id ? 'User updated successfully' : 'User created successfully'
      );

      if (!id) form.reset();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error saving user');
    }
  };

  const role = form.watch('role');
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='role'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline'>
                      {field.value || 'Select a Role'}
                      <ChevronDown className='ml-2 h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start'>
                    <DropdownMenuRadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <DropdownMenuRadioItem value='ADMIN'>
                        ADMIN
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='STAFF'>
                        STAFF
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='READ_ONLY'>
                        READ ONLY
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
          name='schoolId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>School</FormLabel>
              <FormControl>
                {role === 'STAFF' ? (
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
                ) : (
                  <Input disabled value='Only required for STAFF role' />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>{id ? 'Save Changes' : 'Add User'}</Button>
      </form>
    </Form>
  );
}
