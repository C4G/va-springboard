import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ImportData = {
  name: string;
  description: string;
  schoolName?: string;
  outcome?: string;
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
      const name = (body.name || '').trim();
      const description = (body.description || '').trim();
      const schoolName = (body.schoolName || '').trim();

      let recordFailed = false;
      let failureReason = '';

      // --- 3. Basic Validation Check ---
      if (!name || !description) {
        failureReason = 'Missing required values: Name and Description.';
        recordFailed = true;
      }

      // Only proceed with database lookups if basic validation passes
      if (!recordFailed) {
        try {
          let schoolId: string | null = null;

          // --- 4. School Lookup (if provided and not "None" or "Global") ---
          if (
            schoolName &&
            schoolName.toLowerCase() !== 'none' &&
            schoolName.toLowerCase() !== 'global'
          ) {
            const school = await prisma.school.findFirst({
              where: { Name: schoolName },
              select: { id: true },
            });
            if (!school) {
              failureReason = `School not found: ${schoolName}`;
              recordFailed = true;
            } else {
              schoolId = school.id;
            }
          }

          // --- 5. Duplicate Training Program Check ---
          if (!recordFailed) {
            const existingProgram = await prisma.trainingProgram.findFirst({
              where: {
                name,
                schoolId: schoolId,
              },
              select: { id: true },
            });

            if (existingProgram) {
              failureReason = `Duplicate training program: "${name}" already exists${schoolId ? ` for school "${schoolName}"` : ' as a global program'}.`;
              recordFailed = true;
            }
          }
        } catch (dbError) {
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
