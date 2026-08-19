import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOrCreateStudent } from '@/lib/student-import-utils';

type ImportData = {
  studentName: string;
  schoolName: string;
  trainingProgramName: string;
  startDate: string;
  endDate: string;
  sessions: number;
  notes?: string;
  // Additional optional student fields for creation
  aadharNumber?: string;
  age?: number;
  gender?: string;
  visualAcuity?: string;
  className?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  govDisabilityCert?: string;
};

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and Validate Input
    const allImportData: ImportData[] = await req.json();

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

    // 2. Process each row independently so one failure doesn't stop the batch
    for (let index = 0; index < allImportData.length; index++) {
      const body = allImportData[index];
      const studentName = (body.studentName || '').trim();
      const schoolName = (body.schoolName || '').trim();
      const trainingProgramName = (body.trainingProgramName || '').trim();
      const sessions = Number(body.sessions);
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      if (
        !studentName ||
        !schoolName ||
        !trainingProgramName ||
        !Number.isInteger(sessions) ||
        sessions < 0 ||
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        failed += 1;
        errors.push({ index, reason: 'Invalid import row payload.' });
        continue;
      }

      try {
        // --- 3. School Lookup ---
        const school = await prisma.school.findFirst({
          where: { Name: schoolName },
          select: { id: true },
        });
        if (!school) {
          failed += 1;
          errors.push({ index, reason: `School not found: ${schoolName}` });
          continue;
        }

        // --- 4. Student Lookup or Creation ---
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

        // --- 5. Training Program Lookup ---
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

        // --- 6. Duplicate Enrollment Check ---
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: studentResult.studentId,
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

        // --- 7. Create Enrollment ---
        await prisma.enrollment.create({
          data: {
            studentId: studentResult.studentId,
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
    console.error('Error during student training import:', error);
    return NextResponse.json(
      {
        error: `Internal server error during import process: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
