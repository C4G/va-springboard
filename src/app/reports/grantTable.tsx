/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';

export function GrantReportTable({ data }: { data: any[] }) {
  const [schools, setSchools] = useState<any[]>([]);
  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) throw new Error('Failed to fetch schools');
        const data = await response.json();
        setSchools(data);
      } catch (error) {
        console.error(' Error fetching schools:', error);
      }
    }
    fetchSchools();
  }, []);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>School Name</TableHead>
          <TableHead>School Tier</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>MOU Date</TableHead>
          <TableHead>Infra Grant</TableHead>
          <TableHead>Training Grant</TableHead>
          <TableHead>Infra Grant Spent</TableHead>
          <TableHead>Training Grant Spent</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((g, idx) => (
          <TableRow key={idx}>
            <TableCell>
              {schools.find((x) => x.id === g.schoolId)?.Name || ''}
            </TableCell>
            <TableCell>
              {schools.find((x) => x.id === g.schoolId)?.Tier || ''}
            </TableCell>
            <TableCell>
              {schools.find((x) => x.id === g.schoolId)?.Location || ''}
            </TableCell>
            <TableCell>{g.mouDate}</TableCell>
            <TableCell>{g.grantInf}</TableCell>
            <TableCell>{g.grantTrain}</TableCell>
            <TableCell>{g.grantInfSp}</TableCell>
            <TableCell>{g.grantTrainSp}</TableCell>
            <TableCell>{g.grantTotal}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
