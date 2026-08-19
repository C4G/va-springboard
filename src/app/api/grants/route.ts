import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getSchoolIdFilter } from '@/utils/role';

export async function GET() {
  const session = await auth();
  const schoolIdFilter = getSchoolIdFilter(session);

  const grants = await prisma.grant.findMany({
    where: schoolIdFilter ? { schoolId: schoolIdFilter } : {},
    include: {
      school: {
        select: {
          Name: true,
        },
      },
    },
  });
  return NextResponse.json(grants);
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  const grant = await prisma.grant.create({ data });
  return NextResponse.json(grant, { status: 201 });
}
