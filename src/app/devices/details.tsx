/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { toast } from 'sonner';

export function DeviceDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [device, setDevice] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchDevice() {
      try {
        console.log('Fetching device with ID:', id);
        const response = await fetch(`/api/devices/${id}`);

        if (!response.ok) {
          console.error(' Device not found:', id);
          throw new Error('Device not found');
        }

        const data = await response.json();
        console.log(' Device found:', data);
        setDevice(data);
      } catch (error) {
        console.error('Error fetching device:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDevice();
    }
  }, [id]);

  if (loading) {
    return <div className='p-4 text-center'>Loading device details...</div>;
  }

  if (!device) {
    return (
      <div className='p-4 text-center text-red-500'>Device not found.</div>
    );
  }

  const onDelete = async () => {
    try {
      console.log('Deleting device with ID:', id);
      const response = await fetch(`/api/devices/${id}`, { method: 'DELETE' });

      if (!response.ok) throw new Error('Failed to delete device');

      toast.success('Successfully Deleted Device', {
        description: device.type,
      });

      window.location.href = '/devices';
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Error deleting device.');
    }
  };

  return (
    <div className='h-full w-full rounded-md border p-8'>
      <div className='flex justify-between'>
        <h1 className='mb-4 text-2xl font-bold'>{device.type}</h1>
        <div>
          <Link
            href={`/devices?view=edit&id=${device.id}`}
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
                  Are you sure you want to delete this device?
                </DialogTitle>
                <DialogDescription>
                  {`This will delete ${device.type} permanently. You cannot undo this action.`}
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button type='button' variant='destructive' onClick={onDelete}>
                  Delete
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className='flex rounded-md border py-8'>
        <div className='w-1/2'>
          <div className='p-1'>
            <h4 className='h-8 px-8 text-base font-medium leading-none'>
              Type:
            </h4>
            <p className='ml-4'>{device.type}</p>
          </div>
          <div className='p-1'>
            <h4 className='h-8 px-8 text-base font-medium leading-none'>
              Description:
            </h4>
            <p className='ml-4'>{device.desc}</p>
          </div>
        </div>
        <div className='w-1/2'>
          <div className='p-1'>
            <h4 className='h-8 px-8 text-base font-medium leading-none'>
              Tech Parameter 1:
            </h4>
            <p className='ml-4'>{device.techParam1}</p>
          </div>
          <div className='p-1'>
            <h4 className='h-8 px-8 text-base font-medium leading-none'>
              Tech Parameter 2:
            </h4>
            <p className='ml-4'>{device.techParam2}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
