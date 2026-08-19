/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function BeneficiariesReportTable({ data }: { data: any[] }) {
  const { data: session, status } = useSession();
  const [devices, setDevices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [schoolsRes, studentsRes, devicesRes] = await Promise.all([
          fetch('/api/schools'),
          fetch('/api/students'),
          fetch('/api/devices'),
        ]);

        const schoolData = await schoolsRes.json();
        setSchools(schoolData);

        const userSchoolId = session?.user?.schoolId;
        const filteredStudents = (await studentsRes.json()).filter((s: any) =>
          session?.user?.role === 'STAFF' ? s.schoolId === userSchoolId : true
        );
        setStudents(filteredStudents);

        setDevices(await devicesRes.json());
      } catch (err) {
        console.error('Error fetching:', err);
      }
    }

    if (status === 'authenticated') fetchAll();
  }, [session, status]);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Aadhar No.</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Visual Acuity</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Required</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((b, idx) => (
          <TableRow key={idx}>
            <TableCell>{b.studentName}</TableCell>
            <TableCell>{b.aadharNumber}</TableCell>
            <TableCell>{b.gender}</TableCell>
            <TableCell>{b.age}</TableCell>
            <TableCell>{b.visualAcuity}</TableCell>
            <TableCell>{b.school}</TableCell>
            <TableCell>{b.device}</TableCell>
            <TableCell>{b.issueDate}</TableCell>
            <TableCell>{b.required}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
