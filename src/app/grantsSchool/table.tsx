'use client';

import * as React from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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

type Grant = {
  id: string;
  mouDate: string;
  schoolId: string;
  grantTotal: number;
  grantInf: number;
  grantTrain: number;
  grantInfSp: number;
  grantTrainSp: number;
};

export function GrantTable() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [grants, setGrants] = React.useState<Grant[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [schools, setSchools] = React.useState<{ id: string; Name: string }[]>(
    []
  );

  React.useEffect(() => {
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

  React.useEffect(() => {
    async function fetchGrants() {
      try {
        const response = await fetch('/api/grants');
        if (!response.ok) throw new Error('Failed to fetch grants');
        const data = await response.json();
        setGrants(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchGrants();
  }, []);

  const filteredGrants = React.useMemo(() => {
    if (!id) return [];
    return grants.filter((g) => g.schoolId === id);
  }, [grants, id]);

  const totalSums = React.useMemo(() => {
    return filteredGrants.reduce(
      (totals, grant) => {
        return {
          grantInf: totals.grantInf + grant.grantInf,
          grantInfSp: totals.grantInfSp + grant.grantInfSp,
          grantTrain: totals.grantTrain + grant.grantTrain,
          grantTrainSp: totals.grantTrainSp + grant.grantTrainSp,
          grantTotal: totals.grantTotal + grant.grantTotal,
        };
      },
      {
        grantInf: 0,
        grantInfSp: 0,
        grantTrain: 0,
        grantTrainSp: 0,
        grantTotal: 0,
      }
    );
  }, [filteredGrants]);
  const columns: ColumnDef<Grant>[] = [
    {
      accessorKey: 'schoolId',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          School <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div>{schools.find((s) => s.id === row.original.schoolId)?.Name}</div>
      ),
    },
    {
      accessorKey: 'mouDate',
      header: 'MOU Date',
      cell: ({ row }) => (
        <div>{new Date(row.original.mouDate).toLocaleDateString()}</div>
      ),
    },
    {
      accessorKey: 'grantInf',
      header: 'Infrastructure Grant',
      cell: ({ row }) => <div>{row.original.grantInf.toFixed(2)}</div>,
    },
    {
      accessorKey: 'grantTrain',
      header: 'Training Grant',
      cell: ({ row }) => <div>{row.original.grantTrain.toFixed(2)}</div>,
    },
    {
      accessorKey: 'grantTotal',
      header: 'Total Grant',
      cell: ({ row }) => <div>{row.original.grantTotal.toFixed(2)}</div>,
    },
    {
      accessorKey: 'grantInfSp',
      header: 'Infrastructure Grant Spent',
      cell: ({ row }) => <div>{row.original.grantInfSp.toFixed(2)}</div>,
    },
    {
      accessorKey: 'grantTrainSp',
      header: 'Training Grant Spent',
      cell: ({ row }) => <div>{row.original.grantTrainSp.toFixed(2)}</div>,
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
          <DropdownMenuContent
            align='end'
            className='rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
          >
            <DropdownMenuItem>
              <Link href={`/grants?view=details&id=${row.original.id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/grants?view=edit&id=${row.original.id}`}>Edit</Link>
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
    data: filteredGrants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    manualPagination: false,
    state: {
      pagination,
    },
  });

  if (loading) return <div className='p-4 text-center'>Loading grants...</div>;

  return (
    <div className='w-full'>
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
            {filteredGrants.length ? (
              filteredGrants.map((grant) => {
                const row = table
                  .getRowModel()
                  .rows.find((r) => r.original.id === grant.id);
                return row ? (
                  <TableRow key={grant.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ) : null;
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='text-center'>
                  No grants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='mt-4 border-t p-4'>
        <p>
          <strong>Total Grants:</strong> ${totalSums.grantTotal.toFixed(2)}
        </p>
        <p>
          <strong>Total Infrastructure Grants:</strong> $
          {totalSums.grantInf.toFixed(2)}
        </p>
        <p>
          <strong>Total Training Grants:</strong> $
          {totalSums.grantTrain.toFixed(2)}
        </p>
        <p>
          <strong>Infrastructure Grant Amount Spent:</strong> $
          {totalSums.grantInfSp.toFixed(2)}
        </p>
        <p>
          <strong>Training Grant Amount Spent:</strong> $
          {totalSums.grantTrainSp.toFixed(2)}
        </p>
        <p>
          <strong>Net balance:</strong> $
          {(
            totalSums.grantTotal -
            totalSums.grantTrainSp -
            totalSums.grantInfSp
          ).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
