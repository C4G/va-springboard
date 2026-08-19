'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

type Device = {
  id: string;
  type: string;
  desc: string;
  techParam1: string;
  techParam2: string;
};

export function DeviceTable() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchDevices() {
      try {
        const response = await fetch('/api/devices');
        if (!response.ok) throw new Error('Failed to fetch devices');
        const data = await response.json();
        setDevices(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchDevices();
  }, []);

  const columns: ColumnDef<Device>[] = [
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Type <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('type')}</div>,
    },
    {
      accessorKey: 'desc',
      header: 'Description',
      cell: ({ row }) => <div>{row.getValue('desc')}</div>,
    },
    {
      accessorKey: 'techParam1',
      header: 'Tech Param 1',
      cell: ({ row }) => <div>{row.getValue('techParam1')}</div>,
    },
    {
      accessorKey: 'techParam2',
      header: 'Tech Param 2',
      cell: ({ row }) => <div>{row.getValue('techParam2')}</div>,
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
              <Link href={`/devices?view=details&id=${row.original.id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/devices?view=edit&id=${row.original.id}`}>
                Edit
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
    data: devices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  if (loading) return <div className='p-4 text-center'>Loading devices...</div>;

  return (
    <div className='w-full'>
      {}
      <div className='flex items-center py-4'>
        <Link href='/devices?view=create'>
          <Button className='ml-4'>Add Device</Button>
        </Link>
      </div>

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
                  No devices found.
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
