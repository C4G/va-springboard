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
      const name = (body.name || '').trim();
      const description = (body.description || '').trim();
      const schoolName = (body.schoolName || '').trim();
      const outcome = (body.outcome || '').trim();

      if (!name || !description) {
        failed += 1;
        errors.push({ index, reason: 'Invalid import row payload.' });
        continue;
      }

      try {
        let schoolId: string | null = null;

        // --- 3. School Lookup (if provided and not "None" or "Global") ---
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
            failed += 1;
            errors.push({ index, reason: `School not found: ${schoolName}` });
            continue;
          }
          schoolId = school.id;
        }

        // --- 4. Duplicate Training Program Check ---
        const existingProgram = await prisma.trainingProgram.findFirst({
          where: {
            name,
            schoolId: schoolId,
          },
          select: { id: true },
        });

        if (existingProgram) {
          skipped += 1;
          continue;
        }

        // --- 5. Create Training Program ---
        await prisma.trainingProgram.create({
          data: {
            name,
            description,
            schoolId: schoolId,
            outcome: outcome || null,
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
    console.error('Error during training program import:', error);
    return NextResponse.json(
      {
        error: `Internal server error during import process: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
