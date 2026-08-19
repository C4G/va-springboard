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
import type { Student } from '@prisma/client';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { Eye, Trash2, Pencil } from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  editable: true,
};

const getAge = (dateOfBirth: string) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

interface DeleteButtonRendererProps extends ICellRendererParams {
  onDelete: (id: string) => void;
}

function ActionsButtonRenderer(props: DeleteButtonRendererProps) {
  const studentId = props.data.id;

  const handleDeleteButtonClick = () => {
    if (props.onDelete) {
      props.onDelete(studentId);
    }
  };

  return (
    <div className='flex h-full items-center justify-center gap-2'>
      <Link href={`/students?view=details&id=${studentId}`}>
        <Button variant='outline' size='sm'>
          <Eye className='mr-1 h-4 w-4' /> View
        </Button>
      </Link>
      <Link href={`/students?view=edit&id=${studentId}`}>
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

export function StudentsGrid() {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [effectTrigger, setEffectTrigger] = useState(0);

  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const updateStudent = useCallback(async (studentData: Student) => {
    try {
      const response = await fetch(`/api/students/${studentData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      const updatedStudent = await response.json();
      toast({
        title: 'Student Updated',
        description: `Successfully updated Student ${updatedStudent.name}`,
      });
      return updatedStudent;
    } catch (error) {
      console.error('Error updating Student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update Student. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  const onRowValueChanged = useCallback(
    (event: RowValueChangedEvent<Student, unknown>) => {
      if (event.data) {
        setIsLoading(true);
        updateStudent(event.data);
      }
    },
    [updateStudent]
  );

  const deleteStudent = useCallback(async (studentId: string) => {
    const confirmed = confirm('Are you sure you want to delete this student?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      toast({
        title: 'Student Deleted',
        description: `Successfully deleted student`,
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Re-fetch data to update the grid
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/students')
      .then((response) => response.json())
      .then((data) => {
        setRowData(data);
        setIsLoading(false);
      })
      .catch((error) => console.error('Error fetching students:', error));
  }, [effectTrigger]);

  const columnDefs: ColDef[] = useMemo(() => {
    const caseInsensitiveComparator = (valueA, valueB) => {
      const strA = valueA ? String(valueA).toLowerCase() : '';
      const strB = valueB ? String(valueB).toLowerCase() : '';
      return strA.localeCompare(strB);
    };

    return [
      {
        field: 'firstName',
        headerName: 'Name',
        comparator: caseInsensitiveComparator,
      },
      {
        field: 'dateOfBirth',
        headerName: 'Age',
        valueGetter: (params) => getAge(params.data.dateOfBirth),
        width: 100,
      },
      {
        field: 'gender',
        width: 100,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['M', 'F'],
        },
      },
      {
        field: 'school',
        valueGetter: (params) =>
          params.data.school ? params.data.school.Name : '',
        comparator: caseInsensitiveComparator,
        editable: false,
      },
      {
        field: 'visualAcuity',
        width: 150,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['BLIND', 'LV'],
        },
      },
      { field: 'className', width: 150 },
      {
        field: 'aadharNumber',
        width: 200,
        cellEditor: 'agTextCellEditor',
        cellEditorParams: {
          maxLength: 12,
        },
        valueParser: (params) => {
          const newValue = params.newValue;
          if (/^\d*$/.test(newValue)) {
            return newValue;
          } else {
            return params.oldValue;
          }
        },
      },
      { field: 'city', comparator: caseInsensitiveComparator },
      { field: 'email', comparator: caseInsensitiveComparator },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: ActionsButtonRenderer,
        cellRendererParams: {
          onDelete: deleteStudent,
        },
        editable: false,
        filter: false,
        sortable: false,
        width: 220,
        suppressCsvExport: true,
      },
    ];
  }, [deleteStudent]);

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
        <Link href='/students?view=create'>
          <Button className='ml-4'>Add Student</Button>
        </Link>
        <Button className='ml-4' onClick={onBtnExport}>
          Export as Excel
        </Button>
      </div>
      <AgGridReact<Student>
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
