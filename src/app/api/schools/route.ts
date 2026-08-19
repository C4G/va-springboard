import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getSchoolIdFilter } from '@/utils/role';

export async function GET() {
  try {
    console.log(' Fetching all schools...');
    const session = await auth();
    const schoolIdFilter = getSchoolIdFilter(session);

    const schools = await prisma.school.findMany({
      where: schoolIdFilter ? { id: schoolIdFilter } : {},
    });
    return NextResponse.json(schools, { status: 200 });
  } catch (error) {
    console.error(' Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(' Creating new school:', body);

    const newSchool = await prisma.school.create({
      data: body,
    });

    console.log(' School created:', newSchool);
    return NextResponse.json(newSchool, { status: 201 });
  } catch (error) {
    console.error(' Error creating school:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
