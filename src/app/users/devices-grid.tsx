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
import type { Device } from '@prisma/client';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { Trash2 } from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  editable: true,
};

// Define a type for your delete button component props
interface DeleteButtonRendererProps extends ICellRendererParams {
  // You can add custom props here if needed,
  // for example, a custom onClick handler.
  onDelete: (id: string) => void;
}

function DeleteButtonRenderer(props: DeleteButtonRendererProps) {
  // Extract the device ID from the row data
  const deviceId = props.data.id;

  const handleButtonClick = () => {
    // Call the delete function passed from the parent component
    if (props.onDelete) {
      props.onDelete(deviceId);
    }
  };

  return (
    <div className='flex h-full items-center justify-center'>
      <Button onClick={handleButtonClick} variant='destructive' size='sm'>
        <Trash2 /> Delete
      </Button>
    </div>
  );
}

export function DeviceGrid() {
  const [rowData, setRowData] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [effectTrigger, setEffectTrigger] = useState(0);

  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const updateDevice = useCallback(async (deviceData: Device) => {
    try {
      const response = await fetch(`/api/devices/${deviceData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });

      if (!response.ok) {
        throw new Error('Failed to update device');
      }

      const updatedDevice = await response.json();
      toast({
        title: 'Device Updated',
        description: `Successfully updated device ${updatedDevice.name}`,
      });
      return updatedDevice;
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: 'Error',
        description: 'Failed to update device. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  const onRowValueChanged = useCallback(
    (event: RowValueChangedEvent<Device, unknown>) => {
      if (event.data) {
        setIsLoading(true);
        updateDevice(event.data);
      }
    },
    [updateDevice]
  );

  // This is the delete function that will be called from the button
  const deleteDevice = useCallback(async (deviceId: string) => {
    const confirmed = confirm('Are you sure you want to delete this device?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete device');
      }

      toast({
        title: 'Device Deleted',
        description: `Successfully deleted device`,
      });
    } catch (error) {
      console.error('Error deleting device:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Re-fetch data to update the grid
      setEffectTrigger((effectTrigger) => effectTrigger + 1);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/devices')
      .then((response) => response.json())
      .then((data) => {
        setRowData(data);
        setIsLoading(false);
      })
      .catch((error) => console.error('Error fetching devices:', error));
  }, [effectTrigger]);

  const columnDefs: ColDef[] = useMemo(() => {
    return [
      { field: 'type' },
      { field: 'desc', headerName: 'Description' },
      { field: 'techParam1', headerName: 'Tech Parameter 1' },
      { field: 'techParam2', headerName: 'Tech Parameter 2' },
      {
        headerName: 'Actions',
        field: 'actions', // A placeholder field
        cellRenderer: DeleteButtonRenderer,
        cellRendererParams: {
          onDelete: deleteDevice, // Pass the delete function to the renderer
        },
        editable: false, // Prevents the column from being editable
        filter: false, // Prevents filtering on this column
        sortable: false, // Prevents sorting on this column
        width: 120, // Adjust width as needed
      },
    ];
  }, [deleteDevice]);

  return (
    <div className='h-full w-full'>
      <div className='flex items-center py-4'>
        <Link href='/devices?view=create'>
          <Button className='ml-4'>Add Device</Button>
        </Link>
      </div>
      <AgGridReact<Device>
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
