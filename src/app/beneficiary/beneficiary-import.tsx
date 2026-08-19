'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
// import { Toast } from '@/components/ui/toast';
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

// Define structure for incoming Excel data based on your models
type ExcelRow = {
  // Student fields
  'First Name': string;
  'Last Name': string;
  'Date of Birth': string; // Assuming date is text/string in Excel
  Gender: string;
  'Visual Acuity': string;
  'Class Name': string;
  'Aadhar Number': string; // Used as unique identifier for the Student
  City: string;
  'Phone Number': string;
  Email: string;
  'Gov Disability Cert': string;
  'Case Story': string;

  // School field (used to link Student/Beneficiary)
  'School Name': string; // Used to look up the school ID

  // Device/Beneficiary fields (used to create Device and Beneficiary record)
  'Device Type': string; // Used to identify/create device (Assuming type is unique key for Device)
  Required: string; // Beneficiary field
  'Issue Date': string; // Beneficiary field (Assuming date is text/string in Excel)
};

export type ReducedExcelRow = {
  'First Name'?: string;
  'School Name'?: string;
  'Aadhar Number'?: string;
  'Device Type'?: string;
  // Note: Using '?' (optional) is good practice since some values might be missing
};

type ImportData = {
  student: {
    aadharNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO string
    gender: string;
    visualAcuity: string;
    className: string;
    city: string;
    phoneNumber: string;
    email: string;
    govDisabilityCert: string;
    caseStory: string;
    schoolName: string; // Used to resolve School ID
  };
  device: {
    type: string; // Used to resolve Device ID
    // Add other required device fields here
  };
  beneficiary: {
    issueDate: string; // ISO string
    required: string;
  };
};

type DryRunResult = {
  successful: { index: number; payload: ImportData }[];
  failed: { index: number; reason: string; payload: ImportData }[];
};

type BeneficiaryImportProps = {
  leftAction?: React.ReactNode;
};

export function BeneficiaryImport({ leftAction }: BeneficiaryImportProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [failedRows, setFailedRows] = React.useState<
    { row: ReducedExcelRow; reason: string }[]
  >([]);
  const [isDryRunning, setIsDryRunning] = React.useState<boolean>(false);
  const [dryRunResults, setDryRunResults] = React.useState<DryRunResult | null>(
    null
  );
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [originalExcelData, setOriginalExcelData] = React.useState<ExcelRow[]>(
    []
  );

  // --- UPDATED EXCEL IMPORT LOGIC ---

  const safeParseDate = (
    dateString: string | undefined,
    dateFormat: string
  ): string => {
    // --- Today's Date Logic ---
    const today = new Date();
    // Set time components to midnight to ensure consistency if only date is important
    today.setHours(0, 0, 0, 0);
    // --- End Today's Date Logic ---

    if (!dateString) {
      // If the dateString is missing, return today's date as the default.
      return today.toISOString();
    }

    try {
      // Attempt to parse the date using the specified format.
      // The third argument (new Date()) is the reference date for fields not in the format string.
      const parsedDate = parse(dateString, dateFormat, new Date());

      // Check if the resulting date is invalid (e.g., parsing "abc" yields Invalid Date)
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid Date');
      }

      // Success: return the parsed date as an ISO string
      return parsedDate.toISOString();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.warn(
        `Could not parse date: ${dateString}. Using today's date (${today.toISOString()}) as default.`
      );

      // If parsing fails, return today's date as the default.
      return today.toISOString();
    }
  };

  const processDryRun = async (excelData: ExcelRow[]) => {
    setIsDryRunning(true);
    setDryRunResults(null);
    setOriginalExcelData(excelData);
    const DATE_FORMAT = 'dd/MM/yyyy';
    const importPayload: ImportData[] = [];

    try {
      // Build the full payload array
      for (const row of excelData) {
        // Ensure the payload structure is correct for the backend
        const combinedImportData = {
          student: {
            // Required fields (Aadhar, First Name, School Name) should still be validated
            // outside this block, but given defaults for safe object creation.
            aadharNumber: String(row['Aadhar Number'] || '').trim(), // If Aadhar is REQUIRED and unique, you MUST validate this
            firstName: row['Name'],
            lastName: '', // Deprecated, ignore even if present

            // Safely parse date or use a default
            dateOfBirth: safeParseDate(row['Date of Birth'], DATE_FORMAT),

            gender: row['Gender'] || 'U', // U for Unknown
            visualAcuity: row['Visual Acuity'] || 'N/A',
            className: row['Class Name'] || 'N/A',
            city: row['City'] || 'N/A',
            phoneNumber: String(row['Phone Number'] || '').trim(), // Optional
            email: row['Email'] || '', // Optional
            govDisabilityCert: row['Gov Disability Cert'] || '',
            caseStory: row['Case Story'] || '', // Optional

            // School name is critical for linking
            schoolName: row['School Name'],
          },
          device: {
            type: row['Device Type'],
          },
          beneficiary: {
            issueDate: safeParseDate(row['Issue Date'], DATE_FORMAT),
            required: row['Required'] || 'No',
          },
        };
        importPayload.push(combinedImportData as ImportData);
      }

      const response = await fetch('/api/beneficiary/full/dryrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPayload),
      });

      if (response.ok) {
        const results: DryRunResult = await response.json();
        setDryRunResults(results);

        if (results.failed.length === 0) {
          // All valid, prepare data for final save and open modal
          // setDataToSave(results.successful.map(r => r.payload));
          console.log('Dry run success');
          toast({
            title: 'Dry Run Success',
            description: `${results.successful.length} records are ready to be saved.`,
          });
        } else {
          // Show failures directly
          console.log(results.failed);
          setFailedRows(
            results.failed.map((f) => {
              const { student, device } = f.payload; // Destructure the relevant nested objects

              const reducedRow = {
                'First Name': student.firstName,
                'School Name': student.schoolName,
                'Aadhar Number': student.aadharNumber,
                'Device Type': device.type,
              };

              return {
                row: reducedRow, // Store the minimized object
                reason: f.reason,
              };
            })
          );
          console.log('Dry run success with some failed rows');

          toast({
            title: 'Validation Failed',
            description: `${results.failed.length} records failed validation. Please fix and re-upload.`,
            variant: 'destructive',
          });
        }
      } else {
        const errorBody = await response.json();
        toast({
          title: 'Dry Run Error',
          description:
            errorBody.error || 'A critical error occurred during validation.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Dry Run error:', error);
      toast({
        title: 'Error',
        description: 'Failed to communicate with the dry-run service.',
        variant: 'destructive',
      });
    } finally {
      setIsDryRunning(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input regardless
    }
  };

  // --- 3. FINAL SAVE CALLER ---
  const processActualSave = async () => {
    if (!dryRunResults || dryRunResults.successful.length === 0) {
      toast({
        title: 'Error',
        description: 'No valid records found to save.',
        variant: 'destructive',
      });
      return;
    }

    // Filter the original data based on the indices of the successful records
    const indicesToSave = dryRunResults.successful.map((r) => r.index);

    const rowsToSave = originalExcelData.filter((_, index) =>
      indicesToSave.includes(index)
    );

    // Call the sequential processor with only the valid subset of rows
    await processRecordsSequentially(rowsToSave);
  };
  const processRecordsSequentially = async (excelData: ExcelRow[]) => {
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    // NOTE: Date format parsing needs to be robust.
    // Expecting DD/MM/YYYY from the import sheet.
    const DATE_FORMAT = 'dd/MM/yyyy';

    try {
      for (const row of excelData) {
        // 1. Prepare data structure for the multi-table import API
        const studentData = {
          // Required fields (Aadhar, First Name, School Name) should still be validated
          // outside this block, but given defaults for safe object creation.
          aadharNumber: String(row['Aadhar Number'] || '').trim(), // If Aadhar is REQUIRED and unique, you MUST validate this
          firstName: row['Name'],
          lastName: '', // Deprecated, ignore even if present

          // Safely parse date or use a default
          dateOfBirth: safeParseDate(row['Date of Birth'], DATE_FORMAT),

          gender: row['Gender'] || 'U', // U for Unknown
          visualAcuity: row['Visual Acuity'] || 'N/A',
          className: row['Class Name'] || 'N/A',
          city: row['City'] || 'N/A',
          phoneNumber: String(row['Phone Number'] || '').trim(), // Optional
          email: row['Email'] || '', // Optional
          govDisabilityCert: row['Gov Disability Cert'] || '',
          caseStory: row['Case Story'] || '', // Optional

          // School name is critical for linking
          schoolName: row['School Name'],
        };

        const deviceData = {
          // Assuming Device Type is the unique field used to identify/create device
          type: row['Device Type'],
          // Add other required device fields if any
        };

        const beneficiaryData = {
          // Convert date string from Excel to ISO string for backend
          issueDate: safeParseDate(row['Issue Date'], DATE_FORMAT),
          required: row['Required'] || 'No',
          // studentId, deviceId, schoolId will be resolved by the backend API
        };

        // Combine all data for a single import endpoint call
        const combinedImportData = {
          student: studentData,
          device: deviceData,
          beneficiary: beneficiaryData,
        };

        console.log(combinedImportData);

        try {
          if (
            !studentData.firstName ||
            !studentData.schoolName ||
            !deviceData.type
          ) {
            continue; // Skip to next row
          }
          // Use a single, comprehensive API endpoint for importing related data
          // This is the cleanest approach for relational imports.
          const response = await fetch('/api/beneficiary/full', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(combinedImportData),
          });

          if (response.ok) {
            // The backend API should handle:
            // 1. School lookup/creation by Name.
            // 2. Device lookup/creation by Type.
            // 3. Student lookup/creation (upsert) by Aadhar Number, linking to schoolId.
            // 4. Beneficiary creation, linking the resolved studentId and deviceId.
            successCount++;
          }
        } catch (error) {
          console.error('Network or unknown record error:', error);
          errorCount++;
        }
      }

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} records. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Overall Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'There was an overall error during import processing.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setOriginalExcelData([]);
      setDryRunResults(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFailedRows([]);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (bstr) {
        try {
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsName = wb.SheetNames[0];
          const ws = wb.Sheets[wsName];
          // sheet_to_json auto-converts headers to keys
          const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);

          if (data.length === 0) {
            toast({
              title: 'Error',
              description: 'File appears empty',
              variant: 'destructive',
            });
            return;
          }
          // --- NEW MANDATORY COLUMN CHECK ---
          const mandatoryHeaders = [
            'Aadhar Number',
            'Name', // Note: ExcelRow defines 'First Name' not 'Name'
            'School Name',
            'Device Type',
          ];

          // Use the headers from the first row of data keys
          const fileHeaders = Object.keys(data[0] || {});

          console.log('Trying to process data 4');

          const missingHeaders = mandatoryHeaders.filter(
            (header) => !fileHeaders.includes(header)
          );

          if (missingHeaders.length > 0) {
            toast({
              title: 'Import Failed: Missing Columns',
              description: `The following mandatory column(s) are missing from the file: ${missingHeaders.join(', ')}. Please check your template.`,
              variant: 'destructive',
            });
            // Clear the file input to allow re-upload
            if (fileInputRef.current) fileInputRef.current.value = '';
            console.log('Trying to process data 5');
            return;
          }

          console.log('Trying to process data');

          processDryRun(data);

          // processAndSaveData(data);
        } catch (error) {
          console.log('Error 1');
          console.error(error);
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
      console.log('importing');
      fileInputRef.current?.click();
    }
    // if (!isImporting) {
    //   console.log("importing");
    //   fileInputRef.current?.click();
    // }
  };

  // --- END IMPORT LOGIC ---
  return (
    <div className='w-full'>
      {/* Import Button and hidden file input */}
      <div className='flex items-center justify-end gap-2 p-2'>
        {leftAction}
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
      {dryRunResults && dryRunResults.successful.length > 0 && (
        <div className='mt-4 flex items-center justify-between rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700/50 dark:bg-yellow-900/20'>
          <div>
            <p className='text-sm font-semibold text-yellow-800 dark:text-yellow-200'>
              Validation Complete: Ready to Save
            </p>
            {dryRunResults.failed.length > 0 && (
              <p className='mt-1 text-xs text-yellow-700 dark:text-yellow-300'>
                ⚠️ {dryRunResults.failed.length} invalid record(s) found and
                displayed below.
              </p>
            )}
            <p className='text-sm text-gray-700 dark:text-gray-300'>
              Valid records ready:{' '}
              <span className='font-bold text-green-700 dark:text-green-300'>
                {dryRunResults.successful.length}
              </span>
            </p>
          </div>

          {/* Save Button for Confirmation */}
          <Button
            onClick={processActualSave}
            disabled={isSaving}
            variant='default' // Assuming you have a green 'success' variant
          >
            {isSaving
              ? 'Saving...'
              : `Confirm Save (${dryRunResults.successful.length} valid)`}
          </Button>
        </div>
      )}
      {failedRows.length > 0 && (
        <div className='mt-6 rounded-md border border-red-500 bg-red-50 p-4 dark:bg-red-900/10'>
          <h3 className='mb-3 text-lg font-semibold text-red-700 dark:text-red-300'>
            ⚠️ Failed Imports ({failedRows.length})
          </h3>
          <p className='mb-4 text-sm text-red-600 dark:text-red-400'>
            The following rows failed validation, can not save data.
          </p>
          <div className='max-h-96 overflow-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Aadhar Number</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>School Name</TableHead>
                  <TableHead>Device Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedRows.map((item, index) => (
                  <TableRow
                    key={index}
                    className='bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/40'
                  >
                    <TableCell className='text-xs font-medium text-red-800 dark:text-red-200'>
                      {item.reason}
                    </TableCell>
                    <TableCell>{item.row['Aadhar Number'] || 'N/A'}</TableCell>
                    <TableCell>
                      {`${item.row['First Name'] || ''}`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{item.row['School Name'] || 'N/A'}</TableCell>
                    <TableCell>{item.row['Device Type'] || 'N/A'}</TableCell>
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
