'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  themeAlpine,
  colorSchemeDark,
  type RowValueChangedEvent,
  type ICellRendererParams,
} from 'ag-grid-community';
import type { Grant } from '@prisma/client';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { Pencil } from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  editable: true,
};

interface DeleteButtonRendererProps extends ICellRendererParams {
  onDelete: (id: string) => void;
}

function EditButtonRenderer(props: DeleteButtonRendererProps) {
  // Extract the grant ID from the row data
  const grantId = props.data.id;

  return (
    <div className='flex h-full items-center justify-center gap-2'>
      <Link href={`/grants?view=edit&id=${grantId}`}>
        <Button variant='outline' size='sm'>
          <Pencil className='mr-1 h-4 w-4' /> Edit
        </Button>
      </Link>
    </div>
  );
}

export function GrantsGrid() {
  const [rowData, setRowData] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [effectTrigger, setEffectTrigger] = useState(0);

  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const updateGrant = useCallback(async (grantData: Grant) => {
    try {
      const response = await fetch(`/api/grants/${grantData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grantData),
      });

      if (!response.ok) {
        throw new Error('Failed to update Grant');
      }

      const updatedGrant = await response.json();
      toast({
        title: 'Grant Updated',
        description: `Successfully updated grant ${updatedGrant.name}`,
      });
      return updatedGrant;
    } catch (error) {
      console.error('Error updating grant:', error);
      toast({
        title: 'Error',
        description: 'Failed to update grant. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  const onRowValueChanged = useCallback(
    (event: RowValueChangedEvent<Grant, unknown>) => {
      if (event.data) {
        setIsLoading(true);
        updateGrant(event.data);
      }
    },
    [updateGrant]
  );

  useEffect(() => {
    fetch('/api/grants')
      .then((response) => response.json())
      .then((data) => {
        setRowData(data);
        setIsLoading(false);
      })
      .catch((error) => console.error('Error fetching Grants:', error));
  }, [effectTrigger]);

  const columnDefs: ColDef[] = useMemo(() => {
    const caseInsensitiveComparator = (valueA, valueB) => {
      // Handle null or non-string values
      const strA = valueA ? String(valueA).toLowerCase() : '';
      const strB = valueB ? String(valueB).toLowerCase() : '';
      return strA.localeCompare(strB);
    };

    return [
      {
        field: 'school',
        valueGetter: (params) =>
          params.data.school ? params.data.school.Name : '',
        comparator: caseInsensitiveComparator,
        editable: false,
      },
      {
        field: 'mouDate',
        headerName: 'MOU Date',
        cellRenderer: (params) => {
          return new Date(params.value).toLocaleDateString();
        },
      },
      { field: 'grantInf', headerName: 'Infrastructure Grant' },
      { field: 'grantTrain', headerName: 'Training Grant' },
      { field: 'grantTotal', headerName: 'Total Grant' },
      { field: 'grantInfSp', headerName: 'Infrastructure Grant Spent' },
      { field: 'grantTrainSp', headerName: 'Training Grant Spent' },

      {
        headerName: 'Actions',
        field: 'actions', // A placeholder field
        cellRenderer: EditButtonRenderer,
        editable: false, // Prevents the column from being editable
        filter: false, // Prevents filtering on this column
        sortable: false, // Prevents sorting on this column
        width: 120, // Adjust width as needed
      },
    ];
  }, []);

  return (
    <div className='h-full w-full'>
      <div className='flex items-center py-4'>
        <Link href='/grants?view=create'>
          <Button className='ml-4'>Add Grant</Button>
        </Link>
      </div>
      <AgGridReact<Grant>
        gridOptions={{
          columnDefs,
          defaultColDef,
          domLayout: 'autoHeight',
          editType: 'fullRow',
          pagination: true,
          paginationPageSize: 20,
        }}
        loading={isLoading}
        onRowValueChanged={onRowValueChanged}
        rowData={rowData}
        theme={agGridTheme}
      />
    </div>
  );
}
