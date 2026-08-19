export type BulkEntryStatusType = 'success' | 'error' | 'info';

export type BulkEntryStatus = {
  type: BulkEntryStatusType;
  message: string;
};

export type DryRunResultRow<TPayload> = {
  index: number;
  payload: TPayload;
};

export type DryRunFailedRow<TPayload> = {
  index: number;
  reason: string;
  payload: TPayload;
};

export type BulkEntryDryRunResult<TPayload> = {
  successful: DryRunResultRow<TPayload>[];
  failed: DryRunFailedRow<TPayload>[];
};

export type BulkEntrySaveError = {
  index: number;
  reason: string;
};

export type BulkEntrySaveResult = {
  created: number;
  skipped: number;
  failed: number;
  errors: BulkEntrySaveError[];
};

export type BulkEntryColumn<TDraft> = {
  key: keyof TDraft & string;
  label: string;
  required?: boolean;
};

export type BulkEntryFailureColumn = {
  key: string;
  label: string;
};

export type BulkEntryMapPayloadResult<TPayload> =
  | { payload: TPayload }
  | { error: string };

export type BulkEntryConfig<TDraft extends Record<string, string>, TPayload> = {
  columns: BulkEntryColumn<TDraft>[];
  failureColumns: BulkEntryFailureColumn[];
  dryRunEndpoint: string;
  saveEndpoint: string;
  createEmptyRow: () => TDraft;
  mapDraftToPayload: (
    draft: TDraft,
    rowNumber: number
  ) => BulkEntryMapPayloadResult<TPayload>;
  mapDraftToFailureRow: (draft: TDraft) => Record<string, string>;
  mapPayloadToFailureRow: (payload: TPayload) => Record<string, string>;
};

export type BulkEntryFailedRow = {
  row: Record<string, string>;
  reason: string;
  rowIndex?: number;
};

export type BulkEntryValidationSummary = {
  successful: number;
  failed: number;
};

export type BulkEntryRowErrorMap = Record<
  number,
  {
    reasons: string[];
  }
>;
