'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Beneficiary = {
  id: string;
  schoolId?: string;
  studentId?: string;
  deviceId?: string;
  issueDate: string;
  required: string;
};

export function DevicesStudentTable() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [beneficiaries, setBeneficiaries] = React.useState<Beneficiary[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [students, setStudents] = React.useState<
    {
      id: string;
      firstName: string;
      schoolId: string;
      schoolName: string;
      school: School;
    }[]
  >([]);

  const [devices, setDevices] = React.useState<
    { id: string; type: string; required: string }[]
  >([]);

  type School = {
    id: string;
    Name: string;
    Location: string;
    Phone: string;
    Email: string;
    Tier: string;
  };

  React.useEffect(() => {
    async function fetchBeneficiaries() {
      try {
        const response = await fetch('/api/beneficiary');
        if (!response.ok) throw new Error('Failed to fetch beneficiaries');
        const data = await response.json();
        setBeneficiaries((prev) =>
          JSON.stringify(prev) !== JSON.stringify(data) ? data : prev
        );
        const [studentsRes, devicesRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/devices'),
        ]);

        if (studentsRes.ok) setStudents(await studentsRes.json());
        if (devicesRes.ok) setDevices(await devicesRes.json());
      } catch (error) {
        console.error('Error fetching beneficiaries:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBeneficiaries();
  }, []);

  const columns: ColumnDef<Beneficiary>[] = [
    {
      accessorKey: 'deviceId',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Device ID
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.deviceId || 'N/A'}</div>,
    },
    {
      accessorKey: 'schoolId',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          School Name
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          {`${students.find((s) => s.id === row.original.studentId)?.school.Name}` ||
            'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'studentName',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Student Name
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          {`${students.find((s) => s.id === row.original.studentId)?.firstName}` ||
            'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'device.type',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Device Type
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          {`${devices.find((s) => s.id === row.original.deviceId)?.type}` ||
            'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'issueDate',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Issue Date
        </Button>
      ),
      cell: ({ row }) => (
        <div>{format(new Date(row.original.issueDate), 'PPP')}</div>
      ),
    },
    {
      accessorKey: 'required',
      header: 'Required',
      cell: ({ row }) => <div>{row.original.required || 'N/A'}</div>,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
          >
            <DropdownMenuItem>
              <Link
                href={`/students?view=details&id=${row.original.studentId}`}
              >
                View Student Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/schools?view=details&id=${row.original.schoolId}`}>
                View School Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/beneficiary?view=edit&id=${row.original.id}`}>
                Edit Beneficiary
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const filteredBeneficiaries = React.useMemo(() => {
    if (!id) return [];
    return beneficiaries.filter((ben) => ben.studentId === id);
  }, [beneficiaries, id]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const table = useReactTable({
    data: filteredBeneficiaries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (loading) {
    return <div className='p-4 text-center'>Loading beneficiaries...</div>;
  }

  return (
    <div className='w-full'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='text-center'>
                  No beneficiaries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className='flex justify-center p-4'>
          <div className='flex items-center gap-6'>
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
