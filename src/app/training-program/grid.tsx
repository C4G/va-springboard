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
import type { TrainingProgram } from '@prisma/client';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { Pencil, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  editable: true,
};

interface DeleteButtonRendererProps extends ICellRendererParams {
  onDelete: (id: string) => void;
}

type ExcelRow = {
  Name: string;
  Description: string;
  'School Name'?: string;
  Outcome?: string;
};

type ImportData = {
  name: string;
  description: string;
  schoolName?: string;
  outcome?: string;
};

type DryRunResult = {
  successful: { index: number; payload: ImportData }[];
  failed: { index: number; reason: string; payload: ImportData }[];
};

type ImportStatus = {
  type: 'success' | 'error' | 'info';
  message: string;
};

function ActionsButtonRenderer(props: DeleteButtonRendererProps) {
  // Extract the training program ID from the row data
  const trainingProgramId = props.data.id;

  const handleDeleteButtonClick = () => {
    // Call the delete function passed from the parent component
    if (props.onDelete) {
      props.onDelete(trainingProgramId);
    }
  };

  return (
    <div className='flex h-full items-center justify-center gap-2'>
      <Link href={`/training-program?view=edit&id=${trainingProgramId}`}>
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

export function TrainingProgramsGrid() {
  const [rowData, setRowData] = useState<TrainingProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [effectTrigger, setEffectTrigger] = useState(0);
  const [failedRows, setFailedRows] = React.useState<
    { row: Record<string, string>; reason: string }[]
  >([]);
  const [isDryRunning, setIsDryRunning] = React.useState<boolean>(false);
  const [dryRunResults, setDryRunResults] = React.useState<DryRunResult | null>(
    null
  );
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [importStatus, setImportStatus] = React.useState<ImportStatus | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const updateTrainingProgram = useCallback(
    async (trainingProgramData: TrainingProgram) => {
      try {
        const response = await fetch(
          `/api/training-program/${trainingProgramData.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(trainingProgramData),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update Training Program');
        }

        const updatedTrainingProgram = await response.json();
        toast({
          title: 'Training Program Updated',
          description: `Successfully updated Training Program ${updatedTrainingProgram.name}`,
        });
        return updatedTrainingProgram;
      } catch (error) {
        console.error('Error updating Training Program:', error);
        toast({
          title: 'Error',
          description: 'Failed to update Training Program. Please try again.',
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
    (event: RowValueChangedEvent<TrainingProgram, unknown>) => {
      if (event.data) {
        setIsLoading(true);
        updateTrainingProgram(event.data);
      }
    },
    [updateTrainingProgram]
  );

  // This is the delete function that will be called from the button
  const deleteTrainingProgram = useCallback(
    async (trainingProgramId: string) => {
      const confirmed = confirm(
        'Are you sure you want to delete this training program?'
      );
      if (!confirmed) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/training-program/${trainingProgramId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete training program');
        }

        toast({
          title: 'Training Program Deleted',
          description: 'Successfully deleted training program',
        });
      } catch (error) {
        console.error('Error deleting training program:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete training program. Please try again.',
          variant: 'destructive',
        });
      } finally {
        // Re-fetch data to update the grid
        setEffectTrigger((effectTrigger) => effectTrigger + 1);
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetch('/api/training-program')
      .then((response) => response.json())
      .then((data) => {
        setRowData(data);
        setIsLoading(false);
      })
      .catch((error) =>
        console.error('Error fetching Training Programs:', error)
      );
  }, [effectTrigger]);

  // --- EXCEL IMPORT LOGIC ---
  const mapRowToImportData = (row: ExcelRow): ImportData => {
    return {
      name: String(row['Name'] || '').trim(),
      description: String(row['Description'] || '').trim(),
      schoolName: String(row['School Name'] || '').trim(),
      outcome: String(row['Outcome'] || '').trim(),
    };
  };

  const processDryRun = async (excelData: ExcelRow[]) => {
    setIsDryRunning(true);
    setDryRunResults(null);

    try {
      const importPayload = excelData.map((row) => mapRowToImportData(row));

      const response = await fetch('/api/training-program/import/dryrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPayload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const message =
          errorBody.error || 'A critical error occurred during validation.';
        setImportStatus({ type: 'error', message });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      const results: DryRunResult = await response.json();
      setDryRunResults(results);

      if (results.failed.length > 0) {
        setFailedRows(
          results.failed.map((f) => ({
            row: {
              Name: f.payload.name,
              Description: f.payload.description,
              'School Name': f.payload.schoolName || 'Global',
            },
            reason: f.reason,
          }))
        );

        const message = `${results.failed.length} record(s) failed validation. Please fix and re-upload.`;
        setImportStatus({ type: 'error', message });
        toast({
          title: 'Validation Failed',
          description: message,
          variant: 'destructive',
        });
      } else {
        setFailedRows([]);
        const message = `${results.successful.length} records are ready to be saved.`;
        setImportStatus({ type: 'success', message });
        toast({
          title: 'Validation Success',
          description: message,
        });
      }
    } catch (error) {
      console.error('Dry Run error:', error);
      const message = 'Failed to communicate with the dry-run service.';
      setImportStatus({ type: 'error', message });
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDryRunning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- FINAL SAVE CALLER ---
  const processActualSave = async () => {
    if (!dryRunResults || dryRunResults.successful.length === 0) {
      const message = 'No valid records found to save.';
      setImportStatus({ type: 'error', message });
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const rowsToSave = dryRunResults.successful.map((r) => r.payload);

      const response = await fetch('/api/training-program/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowsToSave),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const message = errorBody.error || 'Failed to save imported rows.';
        setImportStatus({ type: 'error', message });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();
      const message = `Created ${result.created} records. ${result.skipped > 0 ? `${result.skipped} skipped.` : ''}`;
      setImportStatus({ type: 'success', message });
      toast({
        title: 'Import Success',
        description: message,
      });

      setDryRunResults(null);
      setFailedRows([]);
      setEffectTrigger((value) => value + 1);
    } catch (error) {
      console.error('Save import error:', error);
      const message = 'There was an overall error during import saving.';
      setImportStatus({ type: 'error', message });
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFailedRows([]);
    setImportStatus(null);
    setDryRunResults(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      try {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);

        if (data.length === 0) {
          setDryRunResults(null);
          const message = 'File appears empty';
          setImportStatus({ type: 'error', message });
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
          return;
        }

        const mandatoryHeaders = ['Name', 'Description'];
        const fileHeaders = Object.keys(data[0] || {});

        const missingHeaders = mandatoryHeaders.filter(
          (header) => !fileHeaders.includes(header)
        );

        if (missingHeaders.length > 0) {
          setDryRunResults(null);
          const message = `Import failed: Missing columns: ${missingHeaders.join(', ')}`;
          setImportStatus({ type: 'error', message });
          toast({
            title: 'Import Failed',
            description: message,
            variant: 'destructive',
          });
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setImportStatus({ type: 'info', message: 'Validating import file...' });
        processDryRun(data);
      } catch (error) {
        console.error(error);
        setDryRunResults(null);
        const message = 'Failed to parse Excel file';
        setImportStatus({ type: 'error', message });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerFileInput = () => {
    if (!isDryRunning && !isSaving) {
      fileInputRef.current?.click();
    }
  };
  // --- END IMPORT LOGIC ---

  const columnDefs: ColDef[] = useMemo(() => {
    const caseInsensitiveComparator = (valueA, valueB) => {
      // Handle null or non-string values
      const strA = valueA ? String(valueA).toLowerCase() : '';
      const strB = valueB ? String(valueB).toLowerCase() : '';
      return strA.localeCompare(strB);
    };

    return [
      { field: 'name', comparator: caseInsensitiveComparator },
      { field: 'description' },
      { field: 'outcome' },
      {
        field: 'school',
        valueGetter: (params) =>
          params.data.school ? params.data.school.Name : '',
        comparator: caseInsensitiveComparator,
        editable: false,
      },
      {
        headerName: 'Actions',
        field: 'actions', // A placeholder field
        cellRenderer: ActionsButtonRenderer,
        cellRendererParams: {
          onDelete: deleteTrainingProgram, // Pass the delete function to the renderer
        },
        editable: false, // Prevents the column from being editable
        filter: false, // Prevents filtering on this column
        sortable: false, // Prevents sorting on this column
        width: 180, // Adjust width as needed
        suppressCsvExport: true,
      },
    ];
  }, [deleteTrainingProgram]);

  return (
    <div className='h-full w-full'>
      <div className='flex items-center justify-between py-4'>
        <div className='flex items-center'>
          <Link href='/training-program?view=create'>
            <Button className='ml-4'>Add Training Program</Button>
          </Link>
        </div>
        <div className='flex items-center'>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept='.xlsx, .xls'
            className='hidden'
          />
          <Button
            onClick={triggerFileInput}
            disabled={isDryRunning || isSaving}
            className='flex items-center gap-2'
          >
            <Upload className='h-4 w-4' />
            {isDryRunning
              ? 'Validating...'
              : isSaving
                ? 'Saving...'
                : 'Import from Excel'}
          </Button>
        </div>
      </div>

      {importStatus && (
        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            importStatus.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-200'
              : importStatus.type === 'success'
                ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-700/50 dark:bg-green-900/20 dark:text-green-200'
                : 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-200'
          }`}
        >
          {importStatus.message}
        </div>
      )}

      {dryRunResults && dryRunResults.successful.length > 0 && (
        <div className='mx-4 mb-4 flex items-center justify-between rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700/50 dark:bg-yellow-900/20'>
          <div>
            <p className='text-sm font-semibold text-yellow-800 dark:text-yellow-200'>
              Validation Complete: Ready to Save
            </p>
            {dryRunResults.failed.length > 0 && (
              <p className='mt-1 text-xs text-yellow-700 dark:text-yellow-300'>
                {dryRunResults.failed.length} invalid row(s) found and shown
                below.
              </p>
            )}
            <p className='text-sm text-gray-700 dark:text-gray-300'>
              Valid rows:{' '}
              <span className='font-bold text-green-700 dark:text-green-300'>
                {dryRunResults.successful.length}
              </span>
            </p>
          </div>

          <Button onClick={processActualSave} disabled={isSaving}>
            {isSaving
              ? 'Saving...'
              : `Confirm Save (${dryRunResults.successful.length})`}
          </Button>
        </div>
      )}

      {failedRows.length > 0 && (
        <div className='mx-4 mb-4 rounded-md border border-red-500 bg-red-50 p-4 dark:bg-red-900/10'>
          <h3 className='mb-3 text-lg font-semibold text-red-700 dark:text-red-300'>
            Failed Imports ({failedRows.length})
          </h3>
          <p className='mb-4 text-sm text-red-600 dark:text-red-400'>
            The following rows failed validation and were not imported.
          </p>
          <div className='max-h-72 overflow-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>School Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedRows.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.row['Name'] || 'N/A'}</TableCell>
                    <TableCell>{item.row['Description'] || 'N/A'}</TableCell>
                    <TableCell>{item.row['School Name'] || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AgGridReact<TrainingProgram>
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
