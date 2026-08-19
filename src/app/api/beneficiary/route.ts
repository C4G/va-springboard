import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getSchoolIdFilter } from '@/utils/role';

export async function GET() {
  try {
    const session = await auth();
    const schoolIdFilter = getSchoolIdFilter(session);

    const beneficiaries = await prisma.beneficiary.findMany({
      where: schoolIdFilter ? { schoolId: schoolIdFilter } : {},
      include: {
        student: true,
        school: true,
        device: true,
      },
    });

    return NextResponse.json(beneficiaries);
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Creating new beneficiary:', body);

    const student = await prisma.student.findUnique({
      where: { id: body.studentId },
      include: { school: true },
    });

    if (!student || !student.school) {
      return NextResponse.json(
        { error: 'Student or School not found' },
        { status: 400 }
      );
    }

    const newBeneficiary = await prisma.beneficiary.create({
      data: {
        studentId: body.studentId,
        schoolId: body.schoolId,
        deviceId: body.deviceId,
        issueDate: body.issueDate,
        required: body.required,
      },
    });
    console.log('Beneficiary created:', newBeneficiary);
    return NextResponse.json(newBeneficiary, { status: 201 });
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
