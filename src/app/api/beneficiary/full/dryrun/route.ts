// /api/beneficiary/dryrun/route.ts (or similar)

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for the incoming request body (matching the frontend structure)
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

/**
 * POST handler for a DRY-RUN/Validation check of a bulk import file.
 * It simulates all necessary database operations (lookups, creations, checks)
 * within a single transaction, records successes and failures, and then
 * forces a rollback to ensure no data is saved.
 */
export async function POST(req: NextRequest) {
  const allImportData: ImportData[] = await req.json();

  const finalResults: {
    successful: { index: number; payload: ImportData }[];
    failed: { index: number; reason: string; payload: ImportData }[];
  } = { successful: [], failed: [] };

  if (allImportData.length === 0) {
    return NextResponse.json(
      { error: 'No data records provided.' },
      { status: 400 }
    );
  }

  try {
    // START SINGLE, LARGE TRANSACTION
    await prisma.$transaction(
      async (tx) => {
        // Loop through all records in the batch
        for (let index = 0; index < allImportData.length; index++) {
          const body = allImportData[index];
          const { student: studentData, device: deviceData } = body;

          let recordFailed = false;
          let failureReason = '';

          // --- 1. Basic Validation Check ---
          if (
            !studentData.firstName ||
            !studentData.schoolName ||
            !deviceData.type
          ) {
            failureReason =
              'Missing critical identifiers (Name, School Name, or Device Type).';
            recordFailed = true;
          }

          // Only proceed with database lookups if basic validation passes
          if (!recordFailed) {
            try {
              // --- 2. School Lookup ---
              const school = await tx.school.findFirst({
                where: { Name: studentData.schoolName },
                select: { id: true },
              });
              if (!school) {
                failureReason = `School named "${studentData.schoolName}" not found.`;
                recordFailed = true;
              }
              const schoolId = school?.id;

              // --- 3. Device Lookup ---
              const device = await tx.device.findFirst({
                where: { type: deviceData.type },
                select: { id: true },
              });
              if (!device) {
                failureReason = `Device type "${deviceData.type}" not found.`;
                recordFailed = true;
              }
              const deviceId = device?.id;

              // Only proceed to the beneficiary check if School and Device IDs were successfully found
              if (schoolId && deviceId) {
                // --- 4. FIND POTENTIAL EXISTING STUDENT IDs (DUPLICATE CHECK PREP) ---
                // Find all student IDs that match the imported name and gender.
                const potentialStudents = await tx.student.findMany({
                  where: {
                    firstName: studentData.firstName,
                    gender: studentData.gender,
                  },
                  select: { id: true },
                });

                const potentialStudentIds = potentialStudents.map((s) => s.id);

                // --- 5. DUPLICATE BENEFICIARY CHECK (NEW LOGIC) ---
                // Check if any of these matching students are already a beneficiary
                // at this specific school with this specific device.
                if (potentialStudentIds.length > 0) {
                  const existingBeneficiary = await tx.beneficiary.findFirst({
                    where: {
                      // Check if studentId is ANY of the potential duplicates
                      studentId: { in: potentialStudentIds },
                      schoolId: schoolId,
                      deviceId: deviceId,
                    },
                  });

                  if (existingBeneficiary) {
                    failureReason =
                      'Duplicate Beneficiary record already exists for a student with this Name/Gender combination at this School with this Device.';
                    recordFailed = true;
                  }
                }
              }
            } catch (dbError) {
              // Catch any unexpected Prisma or database errors
              failureReason = `Database Lookup Error: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
              recordFailed = true;
            }
          }

          // --- 6. Record Result ---
          if (recordFailed) {
            finalResults.failed.push({
              index,
              reason: failureReason,
              payload: body,
            });
          } else {
            finalResults.successful.push({ index, payload: body });
          }
        } // End of loop

        // --- 7. CRITICAL STEP: FORCE ROLLBACK ---
        // Throw an error after collecting all results to ensure NOTHING inside the loop
        // (even if you accidentally added a .create() call) is saved.
        throw new Error('DRY_RUN_ROLLBACK_SUCCESSFUL');
      },
      { maxWait: 5000, timeout: 10000 }
    );
    // Catch the intentional rollback error (it's expected)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'DRY_RUN_ROLLBACK_SUCCESSFUL'
    ) {
      // The intentional rollback occurred. We can now return the validation results.
      console.log('Dry Run completed. No data was saved.');
      return NextResponse.json(finalResults, { status: 200 });
    }

    // This catches genuine database or connection failures outside the intentional rollback
    console.error('Error during Dry Run transaction:', error);
    return NextResponse.json(
      {
        error: `Critical failure during dry run transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
