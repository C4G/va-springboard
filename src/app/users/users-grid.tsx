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
} from 'ag-grid-community';
import type { User } from '@prisma/client';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { toast } from '@/hooks/use-toast';

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  editable: true,
};

const columnDefs: ColDef[] = [
  { field: 'name' },
  { field: 'email' },
  {
    field: 'role',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: [null, 'ADMIN', 'STAFF'],
    },
  },
  { field: 'id', editable: false },
  {
    field: 'createdAt',
    editable: false,
    valueFormatter: (params) =>
      params.value ? new Date(params.value).toLocaleString() : '',
  },
  {
    field: 'updatedAt',
    editable: false,
    valueFormatter: (params) =>
      params.value ? new Date(params.value).toLocaleString() : '',
  },
];

export function UsersGrid() {
  const [rowData, setRowData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [effectTrigger, setEffectTrigger] = useState(0);

  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const updateUser = useCallback(async (userData: User) => {
    try {
      const response = await fetch(`/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      toast({
        title: 'User Updated',
        description: `Successfully updated user ${updatedUser.name}`,
      });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  const onRowValueChanged = useCallback(
    (event: RowValueChangedEvent<User, unknown>) => {
      if (event.data) {
        setIsLoading(true);
        updateUser(event.data);
      }
    },
    [updateUser]
  );

  useEffect(() => {
    fetch('/api/users')
      .then((response) => response.json())
      .then((data) => {
        setRowData(data);
        setIsLoading(false);
      })
      .catch((error) => console.error('Error fetching users:', error));
  }, [effectTrigger]);

  return (
    <div className='h-full w-full'>
      <AgGridReact<User>
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
