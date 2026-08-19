import { parse } from 'date-fns';
import type { BulkEntryConfig } from '@/lib/bulk-entry/types';

export type BeneficiaryBulkEntryDraft = {
  firstName: string;
  schoolName: string;
  deviceType: string;
  aadharNumber: string;
  gender: string;
  dateOfBirth: string;
  issueDate: string;
  required: string;
  className: string;
  city: string;
};

export type BeneficiaryBulkImportPayload = {
  student: {
    aadharNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    visualAcuity: string;
    className: string;
    city: string;
    phoneNumber: string;
    email: string;
    govDisabilityCert: string;
    caseStory: string;
    schoolName: string;
  };
  device: {
    type: string;
  };
  beneficiary: {
    issueDate: string;
    required: string;
  };
};

function parseDateToIsoOrToday(value: string) {
  const trimmed = value.trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!trimmed) {
    return { iso: today.toISOString(), isInvalid: false };
  }

  const ddmmyyyyDate = parse(trimmed, 'dd/MM/yyyy', new Date());
  if (!Number.isNaN(ddmmyyyyDate.getTime())) {
    return { iso: ddmmyyyyDate.toISOString(), isInvalid: false };
  }

  return { iso: '', isInvalid: true };
}

export const beneficiaryBulkEntryConfig: BulkEntryConfig<
  BeneficiaryBulkEntryDraft,
  BeneficiaryBulkImportPayload
> = {
  columns: [
    {
      key: 'firstName',
      label: 'First Name',
      required: true,
    },
    {
      key: 'schoolName',
      label: 'School Name',
      required: true,
    },
    {
      key: 'deviceType',
      label: 'Device Type',
      required: true,
    },
    {
      key: 'aadharNumber',
      label: 'Aadhar Number',
      required: true,
    },
    {
      key: 'gender',
      label: 'Gender',
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth (DD/MM/YYYY)',
    },
    {
      key: 'issueDate',
      label: 'Issue Date (DD/MM/YYYY)',
    },
    {
      key: 'required',
      label: 'Required',
    },
    {
      key: 'className',
      label: 'Class Name',
    },
    {
      key: 'city',
      label: 'City',
    },
  ],
  failureColumns: [
    { key: 'aadharNumber', label: 'Aadhar Number' },
    { key: 'firstName', label: 'First Name' },
    { key: 'schoolName', label: 'School Name' },
    { key: 'deviceType', label: 'Device Type' },
  ],
  dryRunEndpoint: '/api/beneficiary/full/dryrun',
  saveEndpoint: '/api/beneficiary/full/import',
  createEmptyRow: () => ({
    firstName: '',
    schoolName: '',
    deviceType: '',
    aadharNumber: '',
    gender: '',
    dateOfBirth: '',
    issueDate: '',
    required: '',
    className: '',
    city: '',
  }),
  mapDraftToPayload: (draft, rowNumber) => {
    const firstName = draft.firstName.trim();
    const schoolName = draft.schoolName.trim();
    const deviceType = draft.deviceType.trim();
    const aadharNumber = draft.aadharNumber.trim();
    const dateOfBirth = parseDateToIsoOrToday(draft.dateOfBirth);
    const issueDate = parseDateToIsoOrToday(draft.issueDate);

    if (!firstName || !schoolName || !deviceType || !aadharNumber) {
      return {
        error: `Row ${rowNumber}: First Name, School Name, Device Type, and Aadhar Number are required.`,
      };
    }

    if (dateOfBirth.isInvalid) {
      return {
        error: `Row ${rowNumber}: Date of Birth must be a valid date (DD/MM/YYYY).`,
      };
    }

    if (issueDate.isInvalid) {
      return {
        error: `Row ${rowNumber}: Issue Date must be a valid date (DD/MM/YYYY).`,
      };
    }

    return {
      payload: {
        student: {
          aadharNumber,
          firstName,
          lastName: '',
          dateOfBirth: dateOfBirth.iso,
          gender: draft.gender.trim() || 'U',
          visualAcuity: 'N/A',
          className: draft.className.trim() || 'N/A',
          city: draft.city.trim() || 'N/A',
          phoneNumber: '',
          email: '',
          govDisabilityCert: '',
          caseStory: '',
          schoolName,
        },
        device: {
          type: deviceType,
        },
        beneficiary: {
          issueDate: issueDate.iso,
          required: draft.required.trim() || 'No',
        },
      },
    };
  },
  mapDraftToFailureRow: (draft) => ({
    aadharNumber: draft.aadharNumber.trim(),
    firstName: draft.firstName.trim(),
    schoolName: draft.schoolName.trim(),
    deviceType: draft.deviceType.trim(),
  }),
  mapPayloadToFailureRow: (payload) => ({
    aadharNumber: payload.student.aadharNumber,
    firstName: payload.student.firstName,
    schoolName: payload.student.schoolName,
    deviceType: payload.device.type,
  }),
};
