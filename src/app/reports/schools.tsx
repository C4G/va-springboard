'use client';

import * as React from 'react';
import { Student } from '@/utils/types';
import { exportToXlxs } from '@/utils/export';
import { Button } from '@/components/ui/button';

export function ReportSchools() {
  const [schools, setSchools] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) throw new Error('Failed to fetch schools');

        const data: Student[] = await response.json();

        setSchools(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchools();
  }, []);

  const onExport = () => {
    exportToXlxs(schools, 'schools');
  };

  if (loading) {
    return <div className='w-full'>Loading schools...</div>;
  }

  return (
    <div className='w-full'>
      <Button onClick={onExport}>Export Schools to Excel Sheet</Button>
    </div>
  );
}
