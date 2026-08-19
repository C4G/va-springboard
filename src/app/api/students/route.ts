import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getSchoolIdFilter } from '@/utils/role';

export async function GET() {
  try {
    const session = await auth();
    const schoolIdFilter = getSchoolIdFilter(session);

    const students = await prisma.student.findMany({
      where: schoolIdFilter ? { schoolId: schoolIdFilter } : {},
      include: {
        school: {
          select: {
            Name: true,
          },
        },
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error(' Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { skipDuplicateCheck, ...studentData } = body;

    if (
      !skipDuplicateCheck &&
      studentData.firstName &&
      studentData.gender &&
      studentData.aadharNumber
    ) {
      const existingStudent = await prisma.student.findFirst({
        where: {
          firstName: { equals: studentData.firstName, mode: 'insensitive' },
          gender: studentData.gender,
          aadharNumber: studentData.aadharNumber,
        },
        include: { school: { select: { Name: true } } },
      });

      if (existingStudent) {
        return NextResponse.json(
          {
            error: 'Duplicate student found (name + gender + Aadhar match)',
            duplicate: {
              id: existingStudent.id,
              firstName: existingStudent.firstName,
              aadharNumber: existingStudent.aadharNumber,
              schoolName: existingStudent.school?.Name ?? 'Unknown',
            },
          },
          { status: 409 }
        );
      }
    }

    const newStudent = await prisma.student.create({ data: studentData });
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Error creating student' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const studentData = await req.json();
    const updatedStudent = await prisma.student.update({
      where: { id: studentData.id },
      data: studentData,
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Error updating student' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Error deleting student' },
      { status: 500 }
    );
  }
}
