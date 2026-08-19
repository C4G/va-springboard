'use client';

import * as React from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { useMemo } from 'react';

type School = {
  id: string;
  Name: string;
  Location: string;
  Phone: string;
  Email: string;
  Tier: string;
};

export function SchoolTable() {
  const [schools, setSchools] = React.useState<School[]>([]);
  const [search, setSearch] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) throw new Error('Failed to fetch schools');
        const data = await response.json();
        setSchools(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchools();
  }, []);

  const filteredSchools = useMemo(() => {
    return schools.filter(
      (school) =>
        school.Name.toLowerCase().includes(search.toLowerCase()) ||
        school.Location.toLowerCase().includes(search.toLowerCase())
    );
  }, [schools, search]);

  const columns: ColumnDef<School>[] = [
    {
      accessorKey: 'Name',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('Name')}</div>,
    },
    {
      accessorKey: 'Location',
      header: 'Location',
      cell: ({ row }) => <div>{row.getValue('Location')}</div>,
    },
    {
      accessorKey: 'Phone',
      header: 'Phone',
      cell: ({ row }) => <div>{row.getValue('Phone')}</div>,
    },
    {
      accessorKey: 'Email',
      header: 'Email',
      cell: ({ row }) => <div>{row.getValue('Email')}</div>,
    },
    {
      accessorKey: 'Tier',
      header: 'Tier',
      cell: ({ row }) => <div>{row.getValue('Tier')}</div>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost'>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Link
                href={`/schools?view=details&id=${row.original.id}`}
                legacyBehavior
                passHref
              >
                <a>View School Details</a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/schools?view=edit&id=${row.original.id}`}>
                Edit School Details
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
    data: filteredSchools,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    manualPagination: false,
    state: {
      pagination,
    },
  });

  if (loading) {
    return <div className='p-4 text-center'>Loading schools...</div>;
  }

  return (
    <div className='w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder='Search...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm'
        />
        <Link href='/schools?view=create'>
          <Button className='ml-4'>Add School</Button>
        </Link>
      </div>
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
            {table.getRowModel().rows?.length ? (
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
                  No results.
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
