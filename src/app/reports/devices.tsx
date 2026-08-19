'use client';

import * as React from 'react';
import { Student } from '@/utils/types';
import { exportToXlxs } from '@/utils/export';
import { Button } from '@/components/ui/button';

export function ReportDevices() {
  const [devices, setDevices] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchDevices() {
      try {
        const response = await fetch('/api/devices');
        if (!response.ok) throw new Error('Failed to fetch devices');

        const data: Student[] = await response.json();

        setDevices(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchDevices();
  }, []);

  const onExport = () => {
    exportToXlxs(devices, 'devices');
  };

  if (loading) {
    return <div className='w-full'>Loading devices...</div>;
  }

  return (
    <div className='w-full'>
      <Button onClick={onExport}>Export Devices to Excel Sheet</Button>
    </div>
  );
}
