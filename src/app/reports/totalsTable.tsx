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

export function SummaryTable({
  trainingSummary,
  deviceSummary,
}: {
  trainingSummary: any[];
  deviceSummary: any[];
}) {
  return (
    <>
      <h3 className='my-4 font-semibold'>Training Program Summary</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Program Name</TableHead>
            <TableHead>Enrolled Students</TableHead>
            <TableHead>Expected Outcome/Observations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainingSummary.map((p, idx) => (
            <TableRow key={idx}>
              <TableCell>{p['Program Name']}</TableCell>
              <TableCell>{p['Enrolled Students']}</TableCell>
              <TableCell>{p['Expected Outcome/Observations']}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h3 className='my-4 font-semibold'>Device Assignment Summary</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Assigned Students</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deviceSummary.map((d, idx) => (
            <TableRow key={idx}>
              <TableCell>{d['Device Type']}</TableCell>
              <TableCell>{d['Description']}</TableCell>
              <TableCell>{d['Assigned Students']}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
