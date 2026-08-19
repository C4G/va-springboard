'use client';

import * as React from 'react';
import { Student } from '@/utils/types';
import { exportToXlxs } from '@/utils/export';
import { Button } from '@/components/ui/button';

export function ReportStudents() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Failed to fetch students');

        const data: Student[] = await response.json();

        setStudents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const onExport = () => {
    exportToXlxs(students, 'students');
  };

  if (loading) {
    return <div className='w-full'>Loading students...</div>;
  }

  return (
    <div className='w-full'>
      <Button onClick={onExport}>Export Students to Excel Sheet</Button>
    </div>
  );
}
