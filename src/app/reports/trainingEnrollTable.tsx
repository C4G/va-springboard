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

export function TrainingEnrollmentsReportTable({ data }: { data: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Aadhar No.</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Visual Acuity</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Program</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Sessions</TableHead>
          <TableHead>Expected Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry, idx) => (
          <TableRow key={idx}>
            <TableCell>{entry.Student}</TableCell>
            <TableCell>{entry.Age}</TableCell>
            <TableCell>{entry.AadharNo}</TableCell>
            <TableCell>{entry.Gender}</TableCell>
            <TableCell>{entry.VisualAcuity}</TableCell>
            <TableCell>{entry.School}</TableCell>
            <TableCell>{entry.Class}</TableCell>
            <TableCell>{entry.Location}</TableCell>
            <TableCell>{entry.Program}</TableCell>
            <TableCell>{entry.StartDate}</TableCell>
            <TableCell>{entry.EndDate}</TableCell>
            <TableCell>{entry.Sessions}</TableCell>
            <TableCell>{entry.ExpectedOutcome}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
