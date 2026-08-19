import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeClassName } from '@/lib/class-normalizer';

type ImportData = {
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
    const allImportData = (await req.json()) as ImportData[];

    if (!Array.isArray(allImportData) || allImportData.length === 0) {
      return NextResponse.json(
        { error: 'No data records provided.' },
        { status: 400 }
      );
    }

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors: { index: number; reason: string }[] = [];

    for (let index = 0; index < allImportData.length; index++) {
      const body = allImportData[index];
      const studentData = body.student;
      const deviceData = body.device;
      const beneficiaryData = body.beneficiary;

      if (
        !studentData?.aadharNumber ||
        !studentData?.firstName ||
        !studentData?.schoolName ||
        !deviceData?.type
      ) {
        failed += 1;
        errors.push({
          index,
          reason:
            'Missing critical identifiers: Aadhar Number, First Name, School Name, or Device Type.',
        });
        continue;
      }

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
          errors.push({ index, reason: saveResult.reason });
          continue;
        }

        failed += 1;
        errors.push({ index, reason: saveResult.reason });
      } catch (error) {
        failed += 1;
        errors.push({
          index,
          reason:
            error instanceof Error ? error.message : 'Unknown save error.',
        });
      }
    }

    return NextResponse.json(
      {
        created,
        skipped,
        failed,
        errors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during beneficiary bulk import:', error);
    return NextResponse.json(
      {
        error: `Internal server error during import process: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
