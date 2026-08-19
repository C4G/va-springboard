import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ImportData = {
  studentName: string;
  schoolName: string;
  trainingProgramName: string;
  startDate: string;
  endDate: string;
  sessions: number;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and Validate Input
    const allImportData: ImportData[] = await req.json();

    const finalResults: {
      successful: { index: number; payload: ImportData }[];
      failed: { index: number; reason: string; payload: ImportData }[];
    } = { successful: [], failed: [] };

    if (!Array.isArray(allImportData) || allImportData.length === 0) {
      return NextResponse.json(
        { error: 'No data records provided.' },
        { status: 400 }
      );
    }

    // 2. Validate each row and collect row-level outcomes
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

      // --- 3. Basic Validation Check ---
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
          // --- 4. School Lookup ---
          const school = await prisma.school.findFirst({
            where: { Name: schoolName },
            select: { id: true },
          });
          if (!school) {
            failureReason = `School not found: ${schoolName}`;
            recordFailed = true;
          }

          // --- 5. Student Lookup ---
          const students = await prisma.student.findMany({
            where: {
              firstName: studentName,
              schoolId: school?.id || '',
            },
            select: { id: true },
            take: 2,
          });

          if (!recordFailed && students.length === 0) {
            failureReason = `Student not found in "${schoolName}": ${studentName}`;
            recordFailed = true;
          }

          if (!recordFailed && students.length > 1) {
            failureReason = `Multiple students with same name, need to add this manually. "${schoolName}": ${studentName}`;
            recordFailed = true;
          }

          // --- 6. Training Program Lookup ---
          const trainingProgram = await prisma.trainingProgram.findFirst({
            where: {
              name: trainingProgramName,
              OR: [{ schoolId: school?.id || '' }, { schoolId: null }],
            },
            select: { id: true },
          });

          if (!recordFailed && !trainingProgram) {
            failureReason = `Training Program not found: ${trainingProgramName}`;
            recordFailed = true;
          }

          // --- 7. Duplicate Enrollment Check ---
          if (!recordFailed) {
            const existingEnrollment = await prisma.enrollment.findFirst({
              where: {
                studentId: students[0].id,
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
        } catch (dbError) {
          failureReason = `Database Lookup Error: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
          recordFailed = true;
        }
      }

      // --- 8. Record Result ---
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

    return NextResponse.json(finalResults, { status: 200 });
  } catch (error) {
    console.error('Error during dry run validation:', error);
    return NextResponse.json(
      {
        error: `Critical failure during dry run: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
