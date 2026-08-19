import { parse } from 'date-fns';
import type { BulkEntryConfig } from '@/lib/bulk-entry/types';

export type StudentTrainingBulkEntryDraft = {
  studentName: string;
  schoolName: string;
  trainingProgramName: string;
  startDate: string;
  endDate: string;
  sessions: string;
  notes: string;
};

export type StudentTrainingBulkImportPayload = {
  studentName: string;
  schoolName: string;
  trainingProgramName: string;
  startDate: string;
  endDate: string;
  sessions: number;
  notes: string;
};

function parseDateToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const ddmmyyyyDate = parse(trimmed, 'dd/MM/yyyy', new Date());
  if (!Number.isNaN(ddmmyyyyDate.getTime())) {
    return ddmmyyyyDate.toISOString();
  }

  const isoLikeDate = parse(trimmed, 'yyyy-MM-dd', new Date());
  if (!Number.isNaN(isoLikeDate.getTime())) return isoLikeDate.toISOString();

  return '';
}

export const studentTrainingBulkEntryConfig: BulkEntryConfig<
  StudentTrainingBulkEntryDraft,
  StudentTrainingBulkImportPayload
> = {
  columns: [
    {
      key: 'studentName',
      label: 'Student Name',
      required: true,
    },
    {
      key: 'schoolName',
      label: 'School Name',
      required: true,
    },
    {
      key: 'trainingProgramName',
      label: 'Training Program',
      required: true,
    },
    {
      key: 'startDate',
      label: 'Start Date (DD/MM/YYYY)',
      required: true,
    },
    {
      key: 'endDate',
      label: 'End Date (DD/MM/YYYY)',
      required: true,
    },
    {
      key: 'sessions',
      label: 'Sessions',
      required: true,
    },
    {
      key: 'notes',
      label: 'Notes',
    },
  ],
  failureColumns: [
    { key: 'studentName', label: 'Student Name' },
    { key: 'schoolName', label: 'School Name' },
    { key: 'trainingProgramName', label: 'Training Program' },
  ],
  dryRunEndpoint: '/api/studentTraining/import/dryrun',
  saveEndpoint: '/api/studentTraining/import',
  createEmptyRow: () => ({
    studentName: '',
    schoolName: '',
    trainingProgramName: '',
    startDate: '',
    endDate: '',
    sessions: '',
    notes: '',
  }),
  mapDraftToPayload: (draft, rowNumber) => {
    const studentName = draft.studentName.trim();
    const schoolName = draft.schoolName.trim();
    const trainingProgramName = draft.trainingProgramName.trim();
    const startDate = parseDateToIso(draft.startDate);
    const endDate = parseDateToIso(draft.endDate);
    const sessionsText = draft.sessions.trim();
    const sessions = Number(sessionsText);

    if (!studentName || !schoolName || !trainingProgramName) {
      return {
        error: `Row ${rowNumber}: Student Name, School Name, and Training Program are required.`,
      };
    }

    if (!startDate || !endDate) {
      return {
        error: `Row ${rowNumber}: Start Date and End Date must be valid dates (DD/MM/YYYY).`,
      };
    }

    if (!sessionsText) {
      return {
        error: `Row ${rowNumber}: Sessions is required.`,
      };
    }

    if (!Number.isInteger(sessions) || sessions < 0) {
      return {
        error: `Row ${rowNumber}: Sessions must be a non-negative integer.`,
      };
    }

    return {
      payload: {
        studentName,
        schoolName,
        trainingProgramName,
        startDate,
        endDate,
        sessions,
        notes: draft.notes.trim(),
      },
    };
  },
  mapDraftToFailureRow: (draft) => ({
    studentName: draft.studentName.trim(),
    schoolName: draft.schoolName.trim(),
    trainingProgramName: draft.trainingProgramName.trim(),
  }),
  mapPayloadToFailureRow: (payload) => ({
    studentName: payload.studentName,
    schoolName: payload.schoolName,
    trainingProgramName: payload.trainingProgramName,
  }),
};
