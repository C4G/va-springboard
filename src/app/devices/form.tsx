/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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

const formSchema = z.object({
  type: z.string().min(1, 'Required.'),
  desc: z.string().min(1, 'Required.'),
  techParam1: z.string().min(1, 'Required.'),
  techParam2: z.string().min(1, 'Required.'),
});

export function DeviceForm({ id }: { id?: string }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      desc: '',
      techParam1: '',
      techParam2: '',
    },
  });

  React.useEffect(() => {
    async function fetchDevice() {
      if (!id) return;

      try {
        const response = await fetch(`/api/devices/${id}`);
        if (!response.ok) throw new Error('Failed to fetch device');

        const data = await response.json();
        console.log(' Loaded device data:', data);

        form.reset({
          type: data.type,
          desc: data.desc,
          techParam1: data.techParam1,
          techParam2: data.techParam2,
        });
      } catch (error) {
        console.error('Error fetching device:', error);
      }
    }

    fetchDevice();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const method = id ? 'PATCH' : 'POST';
      const url = id ? `/api/devices/${id}` : '/api/devices';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const responseData =
        response.headers.get('content-length') !== '0'
          ? await response.json()
          : {};

      if (response.ok) {
        toast.success(
          id ? 'Device Updated Successfully' : 'Device Registered Successfully',
          { description: `${values.type}` }
        );

        if (!id) form.reset();
      } else {
        toast.error(`Failed to save device: ${'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error saving device.');
    }
  }

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {}
          <FormField
            control={form.control}
            name='type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Input placeholder='Device Type' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {}
          <FormField
            control={form.control}
            name='desc'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder='Device Description' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {}
          <FormField
            control={form.control}
            name='techParam1'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technical Parameter 1</FormLabel>
                <FormControl>
                  <Input placeholder='Parameter 1' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {}
          <FormField
            control={form.control}
            name='techParam2'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technical Parameter 2</FormLabel>
                <FormControl>
                  <Input placeholder='Parameter 2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {}
          <Button type='submit'>
            {id ? 'Save Changes' : 'Register Device'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
