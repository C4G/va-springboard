import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOrCreateStudent } from '@/lib/student-import-utils';
import { normalizeClassName } from '@/lib/class-normalizer';

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

    const trainingResult = await importTrainingRecords(trainingRecords);
    const beneficiaryResult =
      await importBeneficiaryRecords(beneficiaryRecords);

    return NextResponse.json(
      {
        training: trainingResult,
        beneficiary: beneficiaryResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Quarterly import error:', error);
    return NextResponse.json(
      {
        error: `Internal server error during import process: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

async function importTrainingRecords(
  allImportData: TrainingImportData[]
): Promise<{
  created: number;
  skipped: number;
  failed: number;
  errors: { index: number; reason: string }[];
}> {
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { index: number; reason: string }[] = [];

  if (!Array.isArray(allImportData) || allImportData.length === 0) {
    return { created, skipped, failed, errors };
  }

  for (let index = 0; index < allImportData.length; index++) {
    const body = allImportData[index];

    try {
      const studentName = (body.studentName || '').trim();
      const schoolName = (body.schoolName || '').trim();
      const trainingProgramName = (body.trainingProgramName || '').trim();
      const sessions = Number(body.sessions);
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      const school = await prisma.school.findFirst({
        where: { Name: schoolName },
        select: { id: true },
      });

      if (!school) {
        failed += 1;
        errors.push({ index, reason: `School not found: ${schoolName}` });
        continue;
      }

      const trainingProgram = await prisma.trainingProgram.findFirst({
        where: {
          name: trainingProgramName,
          OR: [{ schoolId: school.id }, { schoolId: null }],
        },
        select: { id: true },
      });

      if (!trainingProgram) {
        failed += 1;
        errors.push({
          index,
          reason: `Training Program not found: ${trainingProgramName}`,
        });
        continue;
      }

      // Use shared utility for student lookup/creation
      const studentResult = await findOrCreateStudent(school.id, {
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

      if (!studentResult.success) {
        failed += 1;
        errors.push({
          index,
          reason: studentResult.error,
        });
        continue;
      }

      const finalStudentId = studentResult.studentId;

      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: finalStudentId,
          trainingprogramId: trainingProgram.id,
          startDate,
          endDate,
        },
        select: { id: true },
      });

      if (existingEnrollment) {
        skipped += 1;
        continue;
      }

      await prisma.enrollment.create({
        data: {
          studentId: finalStudentId,
          schoolId: school.id,
          trainingprogramId: trainingProgram.id,
          startDate,
          endDate,
          sessions,
          notes: body.notes || '',
        },
      });
      created += 1;
    } catch (error) {
      failed += 1;
      errors.push({
        index,
        reason: error instanceof Error ? error.message : 'Unknown save error.',
      });
    }
  }

  return { created, skipped, failed, errors };
}

async function importBeneficiaryRecords(
  allImportData: BeneficiaryImportData[]
): Promise<{
  created: number;
  skipped: number;
  failed: number;
  errors: { index: number; reason: string }[];
}> {
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { index: number; reason: string }[] = [];

  if (!Array.isArray(allImportData) || allImportData.length === 0) {
    return { created, skipped, failed, errors };
  }

  for (let index = 0; index < allImportData.length; index++) {
    const body = allImportData[index];
    const studentData = body.student;
    const deviceData = body.device;
    const beneficiaryData = body.beneficiary;

    try {
      const saveResult = await prisma.$transaction(async (tx) => {
        const school = await tx.school.findFirst({
          where: { Name: studentData.schoolName.trim() },
          select: { id: true },
        });

        if (!school) {
          return {
            status: 'failed' as const,
            reason: `School not found: ${studentData.schoolName}`,
          };
        }

        const device = await tx.device.findFirst({
          where: { type: deviceData.type.trim() },
          select: { id: true },
        });

        if (!device) {
          return {
            status: 'failed' as const,
            reason: `Device not found: ${deviceData.type}`,
          };
        }

        const normalizedAadhar = studentData.aadharNumber.trim();

        const matchedStudents = await tx.student.findMany({
          where: {
            aadharNumber: normalizedAadhar,
            schoolId: school.id,
          },
          select: { id: true },
          take: 2,
        });

        if (matchedStudents.length > 1) {
          return {
            status: 'failed' as const,
            reason: `Multiple students found for Aadhar Number ${normalizedAadhar} in school ${studentData.schoolName}.`,
          };
        }

        let finalStudentId = matchedStudents[0]?.id;

        if (!finalStudentId) {
          const parsedDob = new Date(studentData.dateOfBirth);
          const dateOfBirth = Number.isNaN(parsedDob.getTime())
            ? new Date()
            : parsedDob;

          // Normalize the class name once for both fields
          const normalizedClass = normalizeClassName(studentData.className);

          const createdStudent = await tx.student.create({
            data: {
              aadharNumber: studentData.aadharNumber.trim(),
              firstName: studentData.firstName.trim(),
              lastName: studentData.lastName ?? '',
              dateOfBirth,
              gender: (studentData.gender || 'U').trim(),
              visualAcuity: studentData.visualAcuity || 'N/A',
              className: normalizedClass,
              studentClass: normalizedClass,
              city: studentData.city || 'N/A',
              phoneNumber: studentData.phoneNumber || '',
              email: studentData.email || '',
              govDisabilityCert: studentData.govDisabilityCert || '',
              caseStory: studentData.caseStory || '',
              schoolId: school.id,
            },
            select: { id: true },
          });
          finalStudentId = createdStudent.id;
        }

        const existingBeneficiary = await tx.beneficiary.findFirst({
          where: {
            studentId: finalStudentId,
            schoolId: school.id,
            deviceId: device.id,
          },
          select: { id: true },
        });

        if (existingBeneficiary) {
          return {
            status: 'skipped' as const,
            reason:
              'Duplicate Beneficiary record already exists for this student/school/device.',
          };
        }

        const parsedIssueDate = new Date(beneficiaryData.issueDate);
        const issueDate = Number.isNaN(parsedIssueDate.getTime())
          ? new Date()
          : parsedIssueDate;

        await tx.beneficiary.create({
          data: {
            studentId: finalStudentId,
            schoolId: school.id,
            deviceId: device.id,
            issueDate,
            required: beneficiaryData.required || 'No',
          },
        });

        return { status: 'created' as const };
      });

      if (saveResult.status === 'created') {
        created += 1;
        continue;
      }

      if (saveResult.status === 'skipped') {
        skipped += 1;
        continue;
      }

      if (saveResult.status === 'failed') {
        failed += 1;
        errors.push({ index, reason: saveResult.reason });
        continue;
      }
    } catch (error) {
      failed += 1;
      errors.push({
        index,
        reason: error instanceof Error ? error.message : 'Unknown save error.',
      });
    }
  }

  return { created, skipped, failed, errors };
}
