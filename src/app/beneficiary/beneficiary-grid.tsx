'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import type { Beneficiary } from '@prisma/client';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { BeneficiaryImport } from './beneficiary-import';
import { BulkEntryPanel } from '@/components/bulk-entry/bulk-entry-panel';
import { useBulkEntry } from '@/lib/bulk-entry/use-bulk-entry';
import { beneficiaryBulkEntryConfig } from './bulk-entry-config';

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  editable: true,
};

interface DeleteButtonRendererProps extends ICellRendererParams {
  onDelete: (id: string) => void;
}

function ActionsButtonRenderer(props: DeleteButtonRendererProps) {
  // Extract the beneficiary ID from the row data
  const beneficiaryId = props.data.id;

  const handleDeleteButtonClick = () => {
    // Call the delete function passed from the parent component
    if (props.onDelete) {
      props.onDelete(beneficiaryId);
    }
  };

  return (
    <div className='flex h-full items-center justify-center gap-2'>
      <Link href={`/beneficiary?view=edit&id=${beneficiaryId}`}>
        <Button variant='outline' size='sm'>
          <Pencil className='mr-1 h-4 w-4' /> Edit
        </Button>
      </Link>
      <Button onClick={handleDeleteButtonClick} variant='destructive' size='sm'>
        <Trash2 />
      </Button>
    </div>
  );
}

export function BeneficiaryGrid() {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [effectTrigger, setEffectTrigger] = useState(0);
  const bulkEntry = useBulkEntry(beneficiaryBulkEntryConfig, {
    onSaved: () => setEffectTrigger((value) => value + 1),
  });

  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const updateBeneficiary = useCallback(
    async (beneficiaryData: Beneficiary) => {
      try {
        const response = await fetch(`/api/beneficiary/${beneficiaryData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(beneficiaryData),
        });

        if (!response.ok) {
          throw new Error('Failed to update beneficiary');
        }

        const updatedBeneficiary = await response.json();
        toast({
          title: 'Beneficiary Updated',
          description: `Successfully updated Beneficiary ${updatedBeneficiary.name}`,
        });
        return updatedBeneficiary;
      } catch (error) {
        console.error('Error updating Beneficiary:', error);
        toast({
          title: 'Error',
          description: 'Failed to update Beneficiary. Please try again.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setEffectTrigger((effectTrigger) => effectTrigger + 1);
        setIsLoading(false);
      }
    },
    []
  );

  const onRowValueChanged = useCallback(
    (event: RowValueChangedEvent<Beneficiary, unknown>) => {
      if (event.data) {
        setIsLoading(true);
        updateBeneficiary(event.data);
      }
    },
    [updateBeneficiary]
  );

  // This is the delete function that will be called from the button
  const deleteBeneficiary = useCallback(async (beneficiaryId: string) => {
    const confirmed = confirm(
      'Are you sure you want to delete this beneficiary?'
    );
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/beneficiary/${beneficiaryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete beneficiary');
      }

      toast({
        title: 'Beneficiary Deleted',
        description: `Successfully deleted beneficiary`,
      });
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete beneficiary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Re-fetch data to update the grid
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/beneficiary')
      .then((response) => response.json())
      .then((data) => {
        setRowData(data);
        setIsLoading(false);
      })
      .catch((error) => console.error('Error fetching beneficiarys:', error));
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
        field: 'student',
        headerName: 'Student Name',
        valueGetter: (params) => params.data.student?.firstName ?? '',
        comparator: caseInsensitiveComparator,
        editable: false,
      },
      {
        field: 'deviceType',
        headerName: 'Device Type',
        valueGetter: (params) => params.data.device?.type ?? '',
        comparator: caseInsensitiveComparator,
        editable: false,
      },
      {
        field: 'school',
        headerName: 'School Name',
        valueGetter: (params) => params.data.school?.Name ?? '',
        comparator: caseInsensitiveComparator,
        editable: false,
      },
      {
        field: 'issueDate',
        headerName: 'Issue Date',
        valueFormatter: (params) =>
          params.value ? format(new Date(params.value), 'PPP') : '',
        editable: false,
      },

      {
        field: 'required',
        headerName: 'Required',
        comparator: caseInsensitiveComparator,
      },
      {
        headerName: 'Actions',
        field: 'actions', // A placeholder field
        cellRenderer: ActionsButtonRenderer,
        cellRendererParams: {
          onDelete: deleteBeneficiary, // Pass the delete function to the renderer
        },
        editable: false, // Prevents the column from being editable
        filter: false, // Prevents filtering on this column
        sortable: false, // Prevents sorting on this column
        width: 220, // Adjust width as needed
        suppressCsvExport: true,
      },
    ];
  }, [deleteBeneficiary]);

  const getColumnsToExport = () => {
    const allColumns = gridRef.current.api.getAllGridColumns();
    return allColumns
      .filter((column) => !column.getColDef().suppressCsvExport)
      .map((column) => column.getColId());
  };

  const onBtnExport = useCallback(() => {
    gridRef.current.api.exportDataAsCsv({
      columnKeys: getColumnsToExport(),
    });
  }, []);

  return (
    <div className='h-full w-full'>
      <div className='flex items-center py-4'>
        <Link href='/beneficiary?view=create'>
          <Button className='ml-4'>Add Beneficiary</Button>
        </Link>
        <Button className='ml-4' onClick={onBtnExport}>
          Export as Excel
        </Button>
        <BeneficiaryImport
          leftAction={
            <Button
              className='mr-2'
              variant='outline'
              onClick={() => bulkEntry.setIsOpen((value) => !value)}
            >
              {bulkEntry.isOpen ? 'Hide Bulk Entry' : 'Bulk Entry'}
            </Button>
          }
        />
      </div>
      <BulkEntryPanel controller={bulkEntry} title='Beneficiary Bulk Entry' />
      <AgGridReact<Beneficiary>
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
        ref={gridRef}
      />
    </div>
  );
}
