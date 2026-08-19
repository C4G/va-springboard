import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getSchoolIdFilter } from '@/utils/role';

export async function GET() {
  try {
    const session = await auth();
    const schoolIdFilter = getSchoolIdFilter(session);

    const programs = await prisma.trainingProgram.findMany({
      where: schoolIdFilter
        ? {
            OR: [
              { schoolId: schoolIdFilter }, // Programs for their school
              { schoolId: null }, // Global programs (available to all schools)
            ],
          }
        : {},
      include: {
        school: {
          select: {
            Name: true,
          },
        },
      },
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, schoolId, outcome } = await req.json();

    const program = await prisma.trainingProgram.create({
      data: {
        name,
        description,
        schoolId: schoolId ? String(schoolId) : null,
        outcome,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Error creating training program:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
