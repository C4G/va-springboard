'use client';

import * as React from 'react';
import { Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';
import { parse } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type TrainingExcelRow = {
  'Sl No.': number;
  'School Name': string;
  Name: string;
  Age: number;
  'Gender(F/M)': string;
  'Visual Acuity(Blind/ Low Vision)': string;
  'Name of the Training Programme attached to': string;
  Class: string;
  'Aadhar No.': string;
  City: string;
  'Phone No.': string;
  'E-mail Id': string;
  'Goverment Disability Certificate (Y/N)': string;
  'Start Date': string;
  'End Date': string;
  Sessions: number;
  Notes: string;
};

type BeneficiaryExcelRow = {
  'Sl No.': number;
  Name: string;
  Age: number;
  Gender: string;
  'Visual Acuity': string;
  'Gov Disability Cert': string;
  'School Name': string;
  'Employed / Unemployed/ Job seeker/ Student/ Homemaker': string;
  'Class /Yr of college\n if student': string;
  'Educational Qualification': string;
  'Aadhar Number': string;
  City: string;
  'Phone Number': string;
  Email: string;
  'Device Type': string;
  'Issue Date': string;
};

type TrainingImportData = {
  studentName: string;
  schoolName: string;
  trainingProgramName: string;
  startDate: string;
  endDate: string;
  sessions: number;
  notes?: string;
  aadharNumber?: string;
  gender?: string;
  visualAcuity?: string;
  className?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  govDisabilityCert?: string;
  age?: number;
};

type BeneficiaryImportData = {
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

type DryRunResult = {
  training: {
    successful: { index: number; payload: TrainingImportData }[];
    failed: { index: number; reason: string; payload: TrainingImportData }[];
  };
  beneficiary: {
    successful: { index: number; payload: BeneficiaryImportData }[];
    failed: { index: number; reason: string; payload: BeneficiaryImportData }[];
  };
};

type QuarterlyImportProps = {
  onClose: () => void;
};

export function QuarterlyImport({ onClose }: QuarterlyImportProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDryRunning, setIsDryRunning] = React.useState<boolean>(false);
  const [dryRunResults, setDryRunResults] = React.useState<DryRunResult | null>(
    null
  );
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [selectedFile, setSelectedFile] = React.useState<{
    name: string;
  } | null>(null);

  const steps = [
    { key: 1, label: 'Upload file' },
    { key: 2, label: 'Review validation' },
    { key: 3, label: 'Confirm import' },
  ] as const;

  const currentStep = isSaving ? 3 : isDryRunning || dryRunResults ? 2 : 1;

  const safeParseDate = (
    dateString: string | undefined,
    dateFormat: string
  ): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!dateString) {
      return today.toISOString();
    }

    try {
      const parsedDate = parse(dateString, dateFormat, new Date());
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid Date');
      }
      return parsedDate.toISOString();
    } catch {
      console.warn(
        `Could not parse date: ${dateString}. Using today's date as default.`
      );
      return today.toISOString();
    }
  };

  const processDryRun = async (
    trainingData: TrainingExcelRow[],
    beneficiaryData: BeneficiaryExcelRow[]
  ) => {
    setIsDryRunning(true);
    setDryRunResults(null);
    const DATE_FORMAT = 'dd/MM/yyyy';

    try {
      // Build training payload
      const trainingPayload: TrainingImportData[] = [];
      for (const row of trainingData) {
        // Split multiple programs by "&"
        const programNames = String(
          row['Name of the Training Programme attached to'] || ''
        )
          .split('&')
          .map((p) => p.trim())
          .filter((p) => p);

        // Create one record per program
        for (const programName of programNames) {
          trainingPayload.push({
            studentName: String(row['Name'] || '').trim(),
            schoolName: String(row['School Name'] || '').trim(),
            trainingProgramName: programName,
            startDate: safeParseDate(
              String(row['Start Date'] || ''),
              DATE_FORMAT
            ),
            endDate: safeParseDate(String(row['End Date'] || ''), DATE_FORMAT),
            sessions: Number(row['Sessions']) || 0,
            notes: String(row['Notes'] || '').trim(),
            aadharNumber: String(row['Aadhar No.'] || '')
              .trim()
              .replace(/\s/g, ''),
            gender: String(row['Gender(F/M)'] || 'U').trim(),
            visualAcuity: String(
              row['Visual Acuity(Blind/ Low Vision)'] || 'N/A'
            ).trim(),
            className: String(row['Class'] || 'N/A').trim(),
            city: String(row['City'] || 'N/A').trim(),
            phoneNumber: String(row['Phone No.'] || '').trim(),
            email: String(row['E-mail Id'] || '').trim(),
            govDisabilityCert: String(
              row['Goverment Disability Certificate (Y/N)'] || ''
            ).trim(),
            age: Number(row['Age']) || undefined,
          });
        }
      }

      // Build beneficiary payload
      const beneficiaryPayload: BeneficiaryImportData[] = beneficiaryData.map(
        (row) => {
          const age = Number(row['Age']) || 0;
          const dateOfBirth =
            age > 0
              ? new Date(
                  new Date().getFullYear() - age,
                  new Date().getMonth(),
                  new Date().getDate()
                ).toISOString()
              : new Date().toISOString();

          return {
            student: {
              aadharNumber: String(row['Aadhar Number'] || '')
                .trim()
                .replace(/\s/g, ''),
              firstName: String(row['Name'] || '').trim(),
              lastName: '',
              dateOfBirth,
              gender: String(row['Gender'] || 'U').trim(),
              visualAcuity: String(row['Visual Acuity'] || 'N/A').trim(),
              className: String(
                row['Class /Yr of college\n if student'] ||
                  row['Class /Yr of college if student'] ||
                  row['Class /Yr of college\r\n if student'] ||
                  'N/A'
              ).trim(),
              city: String(row['City'] || 'N/A').trim(),
              phoneNumber: String(row['Phone Number'] || '').trim(),
              email: String(row['Email'] || '').trim(),
              govDisabilityCert: String(
                row['Gov Disability Cert'] || ''
              ).trim(),
              caseStory: '',
              schoolName: String(row['School Name'] || '').trim(),
            },
            device: {
              type: String(row['Device Type'] || '').trim(),
            },
            beneficiary: {
              issueDate: safeParseDate(
                String(row['Issue Date'] || ''),
                DATE_FORMAT
              ),
              required: 'Yes',
            },
          };
        }
      );

      // Call dry-run API
      const response = await fetch('/api/reports/quarterly/dryrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingRecords: trainingPayload,
          beneficiaryRecords: beneficiaryPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Validation failed');
      }

      const result: DryRunResult = await response.json();
      setDryRunResults(result);

      toast({
        title: 'Dry Run Complete',
        description: `Training: ${result.training.successful.length} valid, ${result.training.failed.length} failed | Beneficiary: ${result.beneficiary.successful.length} valid, ${result.beneficiary.failed.length} failed`,
      });
    } catch (error) {
      console.error('Dry-run error:', error);
      toast({
        title: 'Validation Error',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDryRunning(false);
    }
  };

  const processActualSave = async () => {
    if (!dryRunResults) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/reports/quarterly/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingRecords: dryRunResults.training.successful.map(
            (s) => s.payload
          ),
          beneficiaryRecords: dryRunResults.beneficiary.successful.map(
            (s) => s.payload
          ),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();

      toast({
        title: 'Import Complete',
        description: `Training: ${result.training.created} created, ${result.training.skipped} skipped, ${result.training.failed} failed | Beneficiary: ${result.beneficiary.created} created, ${result.beneficiary.skipped} skipped, ${result.beneficiary.failed} failed`,
      });

      // Reset state after successful save
      setDryRunResults(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Error',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name });

    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (bstr) {
        try {
          const wb = XLSX.read(bstr, { type: 'binary' });

          // Check for required sheets
          const requiredSheets = [
            'TRG. PROG. STUDENT INFO',
            'Device BENEFICIARY INFO',
          ];
          const missingSheets = requiredSheets.filter(
            (sheet) => !wb.SheetNames.includes(sheet)
          );

          if (missingSheets.length > 0) {
            toast({
              title: 'Import Failed: Missing Sheets',
              description: `The following required sheet(s) are missing: ${missingSheets.join(', ')}`,
              variant: 'destructive',
            });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          // Parse both sheets (skip first row which is title, use row 2 as headers)
          const trainingSheet = wb.Sheets['TRG. PROG. STUDENT INFO'];
          const beneficiarySheet = wb.Sheets['Device BENEFICIARY INFO'];

          const trainingData = XLSX.utils.sheet_to_json<TrainingExcelRow>(
            trainingSheet,
            { range: 1 }
          );
          const beneficiaryData = XLSX.utils.sheet_to_json<BeneficiaryExcelRow>(
            beneficiarySheet,
            { range: 1 }
          );

          if (trainingData.length === 0 && beneficiaryData.length === 0) {
            toast({
              title: 'Error',
              description: 'Both sheets appear to be empty',
              variant: 'destructive',
            });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          processDryRun(trainingData, beneficiaryData);
        } catch (error) {
          console.error(error);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          toast({
            title: 'Error',
            description: 'Failed to parse Excel file',
            variant: 'destructive',
          });
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerFileInput = () => {
    if (!isDryRunning && !isSaving) {
      fileInputRef.current?.click();
    }
  };

  const handleClose = () => {
    const hasUploadedState = Boolean(
      selectedFile || dryRunResults || isDryRunning
    );
    if (!hasUploadedState) {
      onClose();
      return;
    }

    const shouldClose = window.confirm(
      'Close quarterly import? Your uploaded file and validation results will be lost.'
    );
    if (!shouldClose) return;

    setDryRunResults(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-900'>
        <button
          onClick={handleClose}
          className='absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100'
        >
          <X className='h-4 w-4' />
        </button>

        <h2 className='mb-4 text-2xl font-bold'>Quarterly Report Import</h2>
        <div className='mb-5'>
          <div className='flex flex-wrap gap-2'>
            {steps.map((step) => {
              const isActive = step.key === currentStep;
              const isComplete = step.key < currentStep;

              return (
                <div
                  key={step.key}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    isActive
                      ? 'border-green-600 bg-green-100 text-green-800 dark:border-green-500 dark:bg-green-900/30 dark:text-green-200'
                      : isComplete
                        ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300'
                        : 'border-gray-300 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {step.key}. {step.label}
                </div>
              );
            })}
          </div>
        </div>
        <p className='mb-6 text-sm text-gray-600 dark:text-gray-400'>
          Upload the quarterly report Excel file. The system will import data
          from &quot;TRG. PROG. STUDENT INFO&quot; and &quot;Device BENEFICIARY
          INFO&quot; tabs.
        </p>

        {/* Import Button and hidden file input */}
        <div className='space-y-3'>
          {selectedFile && (
            <div className='flex flex-col justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/60 md:flex-row md:items-center'>
              <div>
                <p className='font-medium text-gray-900 dark:text-gray-100'>
                  {selectedFile.name}
                </p>
              </div>
              <Button
                onClick={triggerFileInput}
                disabled={isDryRunning || isSaving}
                variant='outline'
                size='sm'
              >
                Change file
              </Button>
            </div>
          )}

          <div className='flex items-center justify-end gap-2'>
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
                  : selectedFile
                    ? 'Re-select Quarterly Report File'
                    : 'Select Quarterly Report File'}
            </Button>
          </div>
        </div>

        {/* Dry Run Results */}
        {dryRunResults && (
          <>
            {/* Training Results */}
            {dryRunResults.training.successful.length > 0 && (
              <div className='mt-6 rounded-md border border-green-300 bg-green-50 p-4 dark:border-green-700/50 dark:bg-green-900/20'>
                <h3 className='text-lg font-semibold text-green-800 dark:text-green-200'>
                  Training Import Results
                </h3>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  Valid records:{' '}
                  <span className='font-bold text-green-700 dark:text-green-300'>
                    {dryRunResults.training.successful.length}
                  </span>
                </p>
                {dryRunResults.training.failed.length > 0 && (
                  <p className='text-xs text-yellow-700 dark:text-yellow-300'>
                    {dryRunResults.training.failed.length} failed record(s)
                  </p>
                )}
              </div>
            )}

            {/* Beneficiary Results */}
            {dryRunResults.beneficiary.successful.length > 0 && (
              <div className='mt-4 rounded-md border border-green-300 bg-green-50 p-4 dark:border-green-700/50 dark:bg-green-900/20'>
                <h3 className='text-lg font-semibold text-green-800 dark:text-green-200'>
                  Beneficiary Import Results
                </h3>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  Valid records:{' '}
                  <span className='font-bold text-green-700 dark:text-green-300'>
                    {dryRunResults.beneficiary.successful.length}
                  </span>
                </p>
                {dryRunResults.beneficiary.failed.length > 0 && (
                  <p className='text-xs text-yellow-700 dark:text-yellow-300'>
                    {dryRunResults.beneficiary.failed.length} failed record(s)
                  </p>
                )}
              </div>
            )}

            {/* Confirm Save Button */}
            {(dryRunResults.training.successful.length > 0 ||
              dryRunResults.beneficiary.successful.length > 0) && (
              <div className='mt-6 flex justify-end'>
                <Button
                  onClick={processActualSave}
                  disabled={isSaving}
                  variant='default'
                >
                  {isSaving
                    ? 'Saving...'
                    : `Confirm Import (${dryRunResults.training.successful.length + dryRunResults.beneficiary.successful.length} records)`}
                </Button>
              </div>
            )}

            {/* Failed Training Records */}
            {dryRunResults.training.failed.length > 0 && (
              <div className='mt-6 rounded-md border border-red-500 bg-red-50 p-4 dark:bg-red-900/10'>
                <h3 className='mb-3 text-lg font-semibold text-red-700 dark:text-red-300'>
                  Failed Training Imports (
                  {dryRunResults.training.failed.length})
                </h3>
                <div className='max-h-96 overflow-auto rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row #</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Program</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dryRunResults.training.failed.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className='font-mono text-xs'>
                            {item.index + 1}
                          </TableCell>
                          <TableCell className='text-xs font-medium text-red-800 dark:text-red-200'>
                            {item.reason}
                          </TableCell>
                          <TableCell>
                            {item.payload.studentName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.payload.schoolName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.payload.trainingProgramName || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Failed Beneficiary Records */}
            {dryRunResults.beneficiary.failed.length > 0 && (
              <div className='mt-6 rounded-md border border-red-500 bg-red-50 p-4 dark:bg-red-900/10'>
                <h3 className='mb-3 text-lg font-semibold text-red-700 dark:text-red-300'>
                  Failed Beneficiary Imports (
                  {dryRunResults.beneficiary.failed.length})
                </h3>
                <div className='max-h-96 overflow-auto rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row #</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Device</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dryRunResults.beneficiary.failed.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className='font-mono text-xs'>
                            {item.index + 1}
                          </TableCell>
                          <TableCell className='text-xs font-medium text-red-800 dark:text-red-200'>
                            {item.reason}
                          </TableCell>
                          <TableCell>
                            {item.payload.student.firstName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.payload.student.schoolName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.payload.device.type || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
