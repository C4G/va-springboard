'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type {
  BulkEntryConfig,
  BulkEntryDryRunResult,
  BulkEntryFailedRow,
  BulkEntryRowErrorMap,
  BulkEntrySaveResult,
  BulkEntryStatus,
  BulkEntryValidationSummary,
} from '@/lib/bulk-entry/types';

type UseBulkEntryOptions = {
  onSaved?: () => void;
};

export type BulkEntryController<
  TDraft extends Record<string, string>,
  TPayload,
> = {
  config: BulkEntryConfig<TDraft, TPayload>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rows: TDraft[];
  status: BulkEntryStatus | null;
  failedRows: BulkEntryFailedRow[];
  rowErrors: BulkEntryRowErrorMap;
  validationSummary: BulkEntryValidationSummary | null;
  isValidating: boolean;
  isSaving: boolean;
  canConfirmSave: boolean;
  markRowsChanged: () => void;

  addRow: () => void;
  removeRow: (rowIndex: number) => void;
  clearRows: () => void;
  validateRows: () => Promise<void>;
  confirmSave: () => Promise<void>;
};

function hasAnyRowValue<TDraft extends Record<string, string>>(
  row: TDraft,
  keys: Array<keyof TDraft & string>
) {
  return keys.some((key) => (row[key] ?? '').trim().length > 0);
}

function formatApiErrorMessage(body: unknown, fallback: string) {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
}

function buildRowErrors(failedRows: BulkEntryFailedRow[]) {
  const rowErrors: BulkEntryRowErrorMap = {};

  for (const failedRow of failedRows) {
    if (failedRow.rowIndex == null) continue;

    if (!rowErrors[failedRow.rowIndex]) {
      rowErrors[failedRow.rowIndex] = { reasons: [] };
    }

    rowErrors[failedRow.rowIndex].reasons.push(failedRow.reason);
  }

  return rowErrors;
}

export function useBulkEntry<TDraft extends Record<string, string>, TPayload>(
  config: BulkEntryConfig<TDraft, TPayload>,
  options: UseBulkEntryOptions = {}
): BulkEntryController<TDraft, TPayload> {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rows, setRows] = React.useState<TDraft[]>([config.createEmptyRow()]);
  const [status, setStatus] = React.useState<BulkEntryStatus | null>(null);
  const [failedRows, setFailedRows] = React.useState<BulkEntryFailedRow[]>([]);
  const [rowErrors, setRowErrors] = React.useState<BulkEntryRowErrorMap>({});
  const [validationSummary, setValidationSummary] =
    React.useState<BulkEntryValidationSummary | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [readyToSavePayloads, setReadyToSavePayloads] = React.useState<
    TPayload[]
  >([]);

  const columnKeys = React.useMemo(
    () => config.columns.map((column) => column.key),
    [config.columns]
  );

  const clearValidationState = React.useCallback(() => {
    setFailedRows([]);
    setRowErrors({});
    setValidationSummary(null);
    setReadyToSavePayloads([]);
    setStatus(null);
  }, []);

  const markRowsChanged = React.useCallback(() => {
    clearValidationState();
  }, [clearValidationState]);

  const addRow = React.useCallback(() => {
    setRows((prevRows) => [...prevRows, config.createEmptyRow()]);
  }, [config]);

  const removeRow = React.useCallback(
    (rowIndex: number) => {
      setRows((prevRows) => {
        const nextRows = prevRows.filter((_, index) => index !== rowIndex);
        return nextRows.length > 0 ? nextRows : [config.createEmptyRow()];
      });
      clearValidationState();
    },
    [clearValidationState, config]
  );

  const clearRows = React.useCallback(() => {
    setRows([config.createEmptyRow()]);
    clearValidationState();
  }, [clearValidationState, config]);

  const validateRows = React.useCallback(async () => {
    const localFailedRows: BulkEntryFailedRow[] = [];
    const payloadRows: TPayload[] = [];
    const originalIndices: number[] = [];

    setIsValidating(true);
    setStatus(null);
    setFailedRows([]);
    setValidationSummary(null);
    setReadyToSavePayloads([]);

    try {
      for (let index = 0; index < rows.length; index++) {
        const draftRow = rows[index];
        if (!hasAnyRowValue(draftRow, columnKeys)) {
          continue;
        }

        const mapped = config.mapDraftToPayload(draftRow, index + 1);
        if ('error' in mapped) {
          localFailedRows.push({
            row: config.mapDraftToFailureRow(draftRow),
            reason: mapped.error,
            rowIndex: index,
          });
          continue;
        }

        payloadRows.push(mapped.payload);
        originalIndices.push(index);
      }

      if (payloadRows.length === 0) {
        const message =
          localFailedRows.length > 0
            ? 'No valid rows to validate. Fix row errors and try again.'
            : 'No data rows entered.';
        setFailedRows(localFailedRows);
        setRowErrors(buildRowErrors(localFailedRows));
        setStatus({ type: 'error', message });
        toast.error(message);
        return;
      }

      const response = await fetch(config.dryRunEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadRows),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = formatApiErrorMessage(
          errorBody,
          'Dry-run validation failed.'
        );
        setFailedRows(localFailedRows);
        setRowErrors(buildRowErrors(localFailedRows));
        setStatus({ type: 'error', message });
        toast.error(message);
        return;
      }

      const apiResults =
        (await response.json()) as BulkEntryDryRunResult<TPayload>;
      const successfulPayloads = apiResults.successful.map(
        (row) => row.payload
      );
      const apiFailedRows: BulkEntryFailedRow[] = apiResults.failed.map(
        (failed) => {
          const originalRowIndex =
            originalIndices[failed.index] ?? failed.index;
          const originalRowNumber = originalRowIndex + 1;
          return {
            row: config.mapPayloadToFailureRow(failed.payload),
            reason: `Row ${originalRowNumber}: ${failed.reason}`,
            rowIndex: originalRowIndex,
          };
        }
      );

      const combinedFailedRows = [...localFailedRows, ...apiFailedRows];
      setFailedRows(combinedFailedRows);
      setRowErrors(buildRowErrors(combinedFailedRows));
      setReadyToSavePayloads(successfulPayloads);
      setValidationSummary({
        successful: successfulPayloads.length,
        failed: combinedFailedRows.length,
      });

      if (successfulPayloads.length > 0) {
        const message = `${successfulPayloads.length} row(s) are ready to save.`;
        setStatus({ type: 'success', message });
        toast.success(message);
      } else {
        const message = 'Validation complete with no savable rows.';
        setStatus({ type: 'error', message });
        toast.error(message);
      }
    } catch (error) {
      console.error('Bulk entry dry-run error:', error);
      const message = 'Failed to validate rows.';
      setFailedRows(localFailedRows);
      setRowErrors(buildRowErrors(localFailedRows));
      setStatus({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsValidating(false);
    }
  }, [columnKeys, config, rows]);

  const confirmSave = React.useCallback(async () => {
    if (readyToSavePayloads.length === 0) {
      const message = 'No validated rows to save.';
      setStatus({ type: 'error', message });
      toast.error(message);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(config.saveEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readyToSavePayloads),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = formatApiErrorMessage(
          errorBody,
          'Failed to save rows.'
        );
        setStatus({ type: 'error', message });
        toast.error(message);
        return;
      }

      const result = (await response.json()) as BulkEntrySaveResult;
      const message = `Created ${result.created} row(s). ${result.skipped > 0 ? `${result.skipped} skipped.` : ''}${result.failed > 0 ? ` ${result.failed} failed.` : ''}`;

      if (result.failed > 0) {
        setStatus({ type: 'error', message });
        toast.error(message);
      } else {
        setStatus({ type: 'success', message });
        toast.success(message);
      }

      setRows([config.createEmptyRow()]);
      setFailedRows([]);
      setRowErrors({});
      setValidationSummary(null);
      setReadyToSavePayloads([]);

      options.onSaved?.();
    } catch (error) {
      console.error('Bulk entry save error:', error);
      const message = 'Failed to save validated rows.';
      setStatus({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [config, options, readyToSavePayloads]);

  return {
    config,
    isOpen,
    setIsOpen,
    rows,
    status,
    failedRows,
    rowErrors,
    validationSummary,
    isValidating,
    isSaving,
    canConfirmSave: readyToSavePayloads.length > 0,
    markRowsChanged,
    addRow,
    removeRow,
    clearRows,
    validateRows,
    confirmSave,
  };
}
