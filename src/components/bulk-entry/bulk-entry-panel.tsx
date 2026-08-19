'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
  type CellFocusedEvent,
  type ColDef,
  colorSchemeDark,
  themeAlpine,
} from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BulkEntryController } from '@/lib/bulk-entry/use-bulk-entry';

ModuleRegistry.registerModules([AllCommunityModule]);

type BulkEntryPanelProps<TDraft extends Record<string, string>, TPayload> = {
  controller: BulkEntryController<TDraft, TPayload>;
  title: string;
};

function getStatusClasses(statusType: 'success' | 'error' | 'info') {
  if (statusType === 'error') {
    return 'border-red-300 bg-red-50 text-red-800 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-200';
  }

  if (statusType === 'success') {
    return 'border-green-300 bg-green-50 text-green-800 dark:border-green-700/50 dark:bg-green-900/20 dark:text-green-200';
  }

  return 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-200';
}

const INDEX_COL_ID = '__row_index__';
const REMOVE_COL_ID = '__row_remove__';

export function BulkEntryPanel<
  TDraft extends Record<string, string>,
  TPayload,
>({ controller, title }: BulkEntryPanelProps<TDraft, TPayload>) {
  const isDarkTheme = useIsDarkTheme();

  const agGridTheme = React.useMemo(
    () => (isDarkTheme ? themeAlpine.withPart(colorSchemeDark) : themeAlpine),
    [isDarkTheme]
  );

  const defaultColDef = React.useMemo<ColDef>(
    () => ({
      editable: true,
      sortable: false,
      filter: false,
      resizable: true,
      flex: 1,
    }),
    []
  );

  const columnDefs = React.useMemo<ColDef<TDraft>[]>(
    () => [
      {
        colId: INDEX_COL_ID,
        headerName: '#',
        editable: false,
        width: 70,
        valueGetter: (params) => (params.node.rowIndex ?? 0) + 1,
        suppressNavigable: true,
      },
      ...controller.config.columns.map((column): ColDef<TDraft> => {
        return {
          field: column.key as ColDef<TDraft>['field'],
          headerName: `${column.label}${column.required ? ' *' : ''}`,
          cellClassRules: column.required
            ? {
                'bg-red-50 dark:bg-red-900/20': (params) =>
                  !String(params.value ?? '').trim(),
              }
            : undefined,
          tooltipValueGetter: (params) => {
            const rowIndex = params.node.rowIndex;
            if (rowIndex == null) return '';

            const rowError = controller.rowErrors[rowIndex];
            if (!rowError) return '';

            return rowError.reasons.join('\n');
          },
        };
      }),
      {
        colId: REMOVE_COL_ID,
        headerName: 'Remove',
        editable: false,
        width: 95,
        valueGetter: () => 'Remove',
        suppressNavigable: true,
        cellStyle: { color: '#b91c1c', fontWeight: 600, cursor: 'pointer' },
      },
    ],
    [controller]
  );

  const getRowStyle = React.useCallback(
    (params: { node: { rowIndex: number | null } }) => {
      const rowIndex = params.node.rowIndex;
      if (rowIndex == null) return undefined;

      if (controller.rowErrors[rowIndex]) {
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.16)',
        };
      }

      return undefined;
    },
    [controller.rowErrors]
  );

  const handleCellValueChanged = React.useCallback(() => {
    controller.markRowsChanged();
  }, [controller]);

  const handleCellClicked = React.useCallback(
    (event: CellClickedEvent<TDraft>) => {
      if (event.column.getColId() !== REMOVE_COL_ID) return;
      if (event.node.rowIndex == null) return;
      controller.removeRow(event.node.rowIndex);
    },
    [controller]
  );

  const handleCellFocused = React.useCallback(
    (event: CellFocusedEvent<TDraft>) => {
      const rowIndex = event.rowIndex;
      const colId =
        typeof event.column === 'string'
          ? event.column
          : event.column?.getColId();
      if (rowIndex == null || !colId) return;
      if (colId === INDEX_COL_ID || colId === REMOVE_COL_ID) return;

      const currentlyEditing = event.api.getEditingCells().some((cell) => {
        const editingColId =
          typeof cell.column === 'string'
            ? cell.column
            : cell.column.getColId();
        return cell.rowIndex === rowIndex && editingColId === colId;
      });
      if (currentlyEditing) return;

      setTimeout(() => {
        event.api.startEditingCell({
          rowIndex,
          colKey: colId,
        });
      }, 0);
    },
    []
  );

  if (!controller.isOpen) return null;

  return (
    <div className='mb-4 rounded-md border bg-background p-4'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h3 className='text-sm font-semibold'>{title}</h3>
          <p className='text-xs text-muted-foreground'>
            Enter one or more rows.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' onClick={controller.addRow}>
            <Plus className='mr-1 h-4 w-4' /> Add Row
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={controller.clearRows}
            disabled={controller.isValidating || controller.isSaving}
          >
            Clear Rows
          </Button>
          <Button
            size='sm'
            onClick={controller.validateRows}
            disabled={controller.isValidating || controller.isSaving}
          >
            {controller.isValidating ? 'Validating...' : 'Validate'}
          </Button>
          <Button
            size='sm'
            onClick={controller.confirmSave}
            disabled={
              controller.isValidating ||
              controller.isSaving ||
              !controller.canConfirmSave
            }
          >
            {controller.isSaving ? 'Saving...' : 'Confirm Save'}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => controller.setIsOpen(false)}
            disabled={controller.isValidating || controller.isSaving}
          >
            Close
          </Button>
        </div>
      </div>

      {controller.status && (
        <div
          className={`mb-3 rounded-md border px-3 py-2 text-sm ${getStatusClasses(controller.status.type)}`}
        >
          {controller.status.message}
        </div>
      )}

      {controller.validationSummary &&
        controller.validationSummary.successful > 0 && (
          <div className='mb-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700/50 dark:bg-yellow-900/20 dark:text-yellow-200'>
            Validation complete. Ready to save:{' '}
            <span className='font-semibold'>
              {controller.validationSummary.successful}
            </span>
            {controller.validationSummary.failed > 0 && (
              <span className='ml-2 text-xs'>
                ({controller.validationSummary.failed} failed)
              </span>
            )}
          </div>
        )}

      {Object.keys(controller.rowErrors).length > 0 && (
        <p className='mb-2 text-xs text-red-700 dark:text-red-300'>
          Invalid rows are highlighted in red.
        </p>
      )}
      <div style={{ height: 360, width: '100%' }}>
        <AgGridReact<TDraft>
          rowData={controller.rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={agGridTheme}
          domLayout='normal'
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={50}
          enterNavigatesVertically={true}
          enterNavigatesVerticallyAfterEdit={true}
          onCellValueChanged={handleCellValueChanged}
          onCellClicked={handleCellClicked}
          onCellFocused={handleCellFocused}
          enableBrowserTooltips={true}
          suppressMovableColumns={true}
          getRowStyle={getRowStyle}
          rowHeight={44}
          headerHeight={40}
        />
      </div>

      {controller.failedRows.length > 0 && (
        <div className='rounded-md border border-red-500 bg-red-50 p-3 dark:bg-red-900/10'>
          <h4 className='mb-2 text-sm font-semibold text-red-700 dark:text-red-300'>
            Failed Rows ({controller.failedRows.length})
          </h4>
          <div className='max-h-64 overflow-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  {controller.config.failureColumns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {controller.failedRows.map((failedRow, index) => (
                  <TableRow key={index}>
                    <TableCell>{failedRow.reason}</TableCell>
                    {controller.config.failureColumns.map((column) => (
                      <TableCell key={`${index}-${column.key}`}>
                        {failedRow.row[column.key] || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
