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
import type { School } from '@prisma/client';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { Trash2, Pencil } from 'lucide-react';

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
  // Extract the school ID from the row data
  const schoolId = props.data.id;

  const handleDeleteButtonClick = () => {
    // Call the delete function passed from the parent component
    if (props.onDelete) {
      props.onDelete(schoolId);
    }
  };

  return (
    <div className='flex h-full items-center justify-center gap-2'>
      {/*<Link href={`/schools?view=details&id=${schoolId}`}>*/}
      {/*  <Button variant='outline' size='sm'>*/}
      {/*    <Eye className='mr-1 h-4 w-4' /> View*/}
      {/*  </Button>*/}
      {/*</Link>*/}
      <Link href={`/schools?view=edit&id=${schoolId}`}>
        <Button variant='outline' size='sm'>
          <Pencil className='mr-1 h-4 w-4' /> View/Edit Notes
        </Button>
      </Link>
      <Button onClick={handleDeleteButtonClick} variant='destructive' size='sm'>
        <Trash2 />
      </Button>
    </div>
  );
}

export function SchoolGrid() {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [effectTrigger, setEffectTrigger] = useState(0);

  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const updateSchool = useCallback(async (schoolData: School) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schoolData),
      });

      if (!response.ok) {
        throw new Error('Failed to update school');
      }

      const updatedSchool = await response.json();
      toast({
        title: 'School Updated',
        description: `Successfully updated School ${updatedSchool.name}`,
      });
      return updatedSchool;
    } catch (error) {
      console.error('Error updating school:', error);
      toast({
        title: 'Error',
        description: 'Failed to update school. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  const onRowValueChanged = useCallback(
    (event: RowValueChangedEvent<School, unknown>) => {
      if (event.data) {
        setIsLoading(true);
        updateSchool(event.data);
      }
    },
    [updateSchool]
  );

  // This is the delete function that will be called from the button
  const deleteSchool = useCallback(async (schoolId: string) => {
    const confirmed = confirm('Are you sure you want to delete this school?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete school');
      }

      toast({
        title: 'School Deleted',
        description: `Successfully deleted school`,
      });
    } catch (error) {
      console.error('Error deleting school:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete school. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Re-fetch data to update the grid
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/schools')
      .then((response) => response.json())
      .then((data) => {
        setRowData(data);
        setIsLoading(false);
      })
      .catch((error) => console.error('Error fetching schools:', error));
  }, [effectTrigger]);

  const columnDefs: ColDef[] = useMemo(() => {
    return [
      { field: 'Name' },
      { field: 'Location' },
      { field: 'Phone' },
      { field: 'Email' },
      { field: 'Tier' },
      {
        headerName: 'Actions',
        field: 'actions', // A placeholder field
        cellRenderer: ActionsButtonRenderer,
        cellRendererParams: {
          onDelete: deleteSchool, // Pass the delete function to the renderer
        },
        editable: false, // Prevents the column from being editable
        filter: false, // Prevents filtering on this column
        sortable: false, // Prevents sorting on this column
        width: 200, // Adjust width as needed
        suppressCsvExport: true,
      },
    ];
  }, [deleteSchool]);

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
        <Link href='/schools?view=create'>
          <Button className='ml-4'>Add School</Button>
        </Link>
        <Button className='ml-4' onClick={onBtnExport}>
          Export as Excel
        </Button>
      </div>
      <AgGridReact<School>
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
