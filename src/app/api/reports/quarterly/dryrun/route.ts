import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateStudent } from '@/lib/student-import-utils';

type TrainingImportData = {
  studentName: string;
  schoolName: string;
  trainingProgramName: string;
  startDate: string;
  endDate: string;
  sessions: number;
  notes?: string;
  // Additional student fields for creation
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      trainingRecords = [],
      beneficiaryRecords = [],
    }: {
      trainingRecords: TrainingImportData[];
      beneficiaryRecords: BeneficiaryImportData[];
    } = body;

    // Validate training records
    const trainingResult = await validateTrainingRecords(trainingRecords);

    // Validate beneficiary records
    const beneficiaryResult =
      await validateBeneficiaryRecords(beneficiaryRecords);

    return NextResponse.json({
      training: trainingResult,
      beneficiary: beneficiaryResult,
    });
  } catch (error) {
    console.error('Quarterly dry-run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function validateTrainingRecords(
  allImportData: TrainingImportData[]
): Promise<{
  successful: { index: number; payload: TrainingImportData }[];
  failed: { index: number; reason: string; payload: TrainingImportData }[];
}> {
  const finalResults: {
    successful: { index: number; payload: TrainingImportData }[];
    failed: { index: number; reason: string; payload: TrainingImportData }[];
  } = { successful: [], failed: [] };

  if (!Array.isArray(allImportData) || allImportData.length === 0) {
    return finalResults;
  }

  for (let index = 0; index < allImportData.length; index++) {
    const body = allImportData[index];
    const studentName = (body.studentName || '').trim();
    const schoolName = (body.schoolName || '').trim();
    const trainingProgramName = (body.trainingProgramName || '').trim();
    const sessions = Number(body.sessions);
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    let recordFailed = false;
    let failureReason = '';

    // --- Basic Validation Check ---
    if (!studentName || !schoolName || !trainingProgramName) {
      failureReason =
        'Missing required values: Student Name, School Name, or Training Program.';
      recordFailed = true;
    }

    if (!recordFailed && (!Number.isInteger(sessions) || sessions < 0)) {
      failureReason = 'Sessions must be a non-negative integer.';
      recordFailed = true;
    }

    if (
      !recordFailed &&
      (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
    ) {
      failureReason = 'Start Date or End Date is invalid.';
      recordFailed = true;
    }

    // Only proceed with database lookups if basic validation passes
    if (!recordFailed) {
      try {
        // --- School Lookup ---
        const school = await prisma.school.findFirst({
          where: { Name: schoolName },
          select: { id: true },
        });
        if (!school) {
          failureReason = `School not found: ${schoolName}`;
          recordFailed = true;
        }

        // --- Student Validation using shared utility ---
        let studentId: string | undefined;
        if (!recordFailed) {
          // Note: In dry-run we don't actually create, just validate the logic would work
          const studentValidation = await validateStudent(school!.id, {
            firstName: studentName,
            aadharNumber: body.aadharNumber,
            age: body.age,
            gender: body.gender,
            visualAcuity: body.visualAcuity,
            className: body.className,
            city: body.city,
            phoneNumber: body.phoneNumber,
            email: body.email,
            govDisabilityCert: body.govDisabilityCert,
          });

          if (!studentValidation.success) {
            failureReason = studentValidation.error;
            recordFailed = true;
          } else {
            studentId = studentValidation.studentId;
          }
        }

        // --- Training Program Lookup ---
        if (!recordFailed) {
          const trainingProgram = await prisma.trainingProgram.findFirst({
            where: {
              name: trainingProgramName,
              OR: [{ schoolId: school?.id || '' }, { schoolId: null }],
            },
            select: { id: true },
          });

          if (!trainingProgram) {
            failureReason = `Training Program not found: ${trainingProgramName}`;
            recordFailed = true;
          }

          // --- Duplicate Enrollment Check (only if student already exists) ---
          if (!recordFailed && studentId) {
            // Only check duplicates if we found an existing student
            const existingEnrollment = await prisma.enrollment.findFirst({
              where: {
                studentId,
                trainingprogramId: trainingProgram!.id,
                startDate,
                endDate,
              },
              select: { id: true },
            });

            if (existingEnrollment) {
              failureReason =
                'Duplicate enrollment already exists for this student/program/date range.';
              recordFailed = true;
            }
          }
        }
      } catch (error) {
        failureReason = `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        recordFailed = true;
      }
    }

    if (recordFailed) {
      finalResults.failed.push({
        index,
        reason: failureReason,
        payload: body,
      });
    } else {
      finalResults.successful.push({ index, payload: body });
    }
  }

  return finalResults;
}

async function validateBeneficiaryRecords(
  allImportData: BeneficiaryImportData[]
): Promise<{
  successful: { index: number; payload: BeneficiaryImportData }[];
  failed: { index: number; reason: string; payload: BeneficiaryImportData }[];
}> {
  const finalResults: {
    successful: { index: number; payload: BeneficiaryImportData }[];
    failed: { index: number; reason: string; payload: BeneficiaryImportData }[];
  } = { successful: [], failed: [] };

  if (!Array.isArray(allImportData) || allImportData.length === 0) {
    return finalResults;
  }

  for (let index = 0; index < allImportData.length; index++) {
    const body = allImportData[index];
    const studentData = body.student;
    const deviceData = body.device;

    let recordFailed = false;
    let failureReason = '';

    // Check required fields
    if (
      !studentData?.aadharNumber ||
      !studentData?.firstName ||
      !studentData?.schoolName ||
      !deviceData?.type
    ) {
      failureReason =
        'Missing critical identifiers: Aadhar Number, First Name, School Name, or Device Type.';
      recordFailed = true;
    }

    if (!recordFailed) {
      try {
        // School Lookup
        const school = await prisma.school.findFirst({
          where: { Name: studentData.schoolName.trim() },
          select: { id: true },
        });

        if (!school) {
          failureReason = `School not found: ${studentData.schoolName}`;
          recordFailed = true;
        }

        // Device Lookup
        if (!recordFailed) {
          const device = await prisma.device.findFirst({
            where: { type: deviceData.type.trim() },
            select: { id: true },
          });

          if (!device) {
            failureReason = `Device not found: ${deviceData.type}`;
            recordFailed = true;
          }

          // Student Lookup by Aadhar
          if (!recordFailed) {
            const normalizedAadhar = studentData.aadharNumber.trim();

            const matchedStudents = await prisma.student.findMany({
              where: {
                aadharNumber: normalizedAadhar,
                schoolId: school!.id,
              },
              select: { id: true },
              take: 2,
            });

            if (matchedStudents.length > 1) {
              failureReason = `Multiple students found for Aadhar Number ${normalizedAadhar} in school ${studentData.schoolName}.`;
              recordFailed = true;
            }

            // Check for duplicate beneficiary (only if student exists)
            if (!recordFailed && matchedStudents.length === 1) {
              const existingBeneficiary = await prisma.beneficiary.findFirst({
                where: {
                  studentId: matchedStudents[0].id,
                  schoolId: school!.id,
                  deviceId: device!.id,
                },
              });

              if (existingBeneficiary) {
                failureReason = `Duplicate Beneficiary record already exists for student at this school with this device.`;
                recordFailed = true;
              }
            }
          }
        }
      } catch (error) {
        failureReason = `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        recordFailed = true;
      }
    }

    if (recordFailed) {
      finalResults.failed.push({
        index,
        reason: failureReason,
        payload: body,
      });
    } else {
      finalResults.successful.push({ index, payload: body });
    }
  }

  return finalResults;
}
