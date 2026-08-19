import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const student = await prisma.student.findUnique({
      where: { id: id },
      include: { school: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error(' Error updating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(' Updating student with ID:', id);

  try {
    const body = await request.json();
    const { schoolId, skipDuplicateCheck, ...updatedData } = body;

    if (
      !skipDuplicateCheck &&
      updatedData.firstName &&
      updatedData.gender &&
      updatedData.aadharNumber
    ) {
      const existingStudent = await prisma.student.findFirst({
        where: {
          firstName: { equals: updatedData.firstName, mode: 'insensitive' },
          gender: updatedData.gender,
          aadharNumber: updatedData.aadharNumber,
          id: { not: id },
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

    if (schoolId) {
      const schoolExists = await prisma.school.findUnique({
        where: { id: schoolId },
      });
      if (!schoolExists) {
        console.error(' School not found:', schoolId);
        return NextResponse.json(
          { error: 'Invalid school ID' },
          { status: 400 }
        );
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...updatedData,
        school: schoolId ? { connect: { id: schoolId } } : undefined,
      },
      include: { school: true },
    });

    console.log(' Student updated:', updatedStudent);
    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error(' Error updating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(' Deleting student with ID:', id);

  try {
    await prisma.student.delete({
      where: { id },
    });

    console.log(' Student deleted:', id);
    return NextResponse.json(
      { message: 'Student deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Error deleting student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
