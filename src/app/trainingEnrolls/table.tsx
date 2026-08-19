/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Enrollment = {
  id: string;
  schoolId: string;
  studentId: string;
  trainingprogramId: string;
  startDate: string;
  endDate: string;
  sessions: number;
  notes: string;
};

export default function EnrollmentTable() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  type School = {
    id: string;
    Name: string;
    Location: string;
    Phone: string;
    Email: string;
    Tier: string;
  };
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [search, setSearch] = React.useState<string>('');
  const [students, setStudents] = React.useState<
    {
      id: string;
      firstName: string;
      schoolId: string;
      school: School;
    }[]
  >([]);

  const [trainingPrograms, setTrainingPrograms] = React.useState<
    { id: string; name: string }[]
  >([]);

  React.useEffect(() => {
    async function fetchOptions() {
      try {
        const [studentsRes, programsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/training-program'),
        ]);

        if (studentsRes.ok) setStudents(await studentsRes.json());
        if (programsRes.ok) setTrainingPrograms(await programsRes.json());
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    }
    fetchOptions();
  }, []);

  React.useEffect(() => {
    async function fetchEnrollments() {
      try {
        const response = await fetch('/api/studentTraining');
        if (!response.ok) throw new Error('Failed to fetch enrollments');

        const data = await response.json();
        setEnrollments((prev) =>
          JSON.stringify(prev) !== JSON.stringify(data) ? data : prev
        );
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      }
    }
    fetchEnrollments();
  }, []);

  const filteredEnrollments = React.useMemo(() => {
    if (!id) return [];
    return enrollments.filter((g) => g.trainingprogramId === id);
  }, [enrollments, id]);

  const columns: ColumnDef<Enrollment>[] = [
    {
      accessorKey: 'studentId',
      header: 'Student',
      cell: ({ row }) => (
        <div>{`${students.find((s) => s.id === row.original.studentId)?.firstName}`}</div>
      ),
    },
    {
      accessorKey: 'schoolId',
      header: 'School',
      cell: ({ row }) => (
        <div>{`${students.find((s) => s.id === row.original.studentId)?.school.Name}`}</div>
      ),
    },
    {
      accessorKey: 'trainingprogramId',
      header: 'Program',
      cell: ({ row }) => (
        <div>
          {
            trainingPrograms.find(
              (s) => s.id === row.original.trainingprogramId
            )?.name
          }
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => (
        <div>{format(new Date(row.original.startDate), 'PPP')}</div>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => (
        <div>{format(new Date(row.original.endDate), 'PPP')}</div>
      ),
    },
    {
      accessorKey: 'sessions',
      header: 'Sessions',
      cell: ({ row }) => <div>{row.original.sessions}</div>,
    },
    {
      id: 'actions',
      header: '',
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
          >
            <DropdownMenuItem>
              <Link
                href={`/studentTraining?view=details&id=${row.original.id}`}
                legacyBehavior
                passHref
              >
                <a>View Enrollment Details</a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href={`/studentTraining?view=edit&id=${row.original.id}`}
                legacyBehavior
                passHref
              >
                <a>Edit Enrollment Details</a>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const table = useReactTable({
    data: filteredEnrollments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: false,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
    },
  });

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
