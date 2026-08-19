/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: id },
    });
    return NextResponse.json(enrollment);
  } catch (error) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    console.log('Updating enrollment with ID:', id, body);

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: id },
      data: {
        studentId: body.studentId,
        schoolId: body.schoolId,
        trainingprogramId: body.trainingprogramId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        sessions: Number(body.sessions),
        notes: body.notes,
      },
    });

    console.log('Enrollment updated:', updatedEnrollment);
    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    console.log('Deleting enrollment with ID:', id);

    await prisma.enrollment.delete({
      where: { id: id },
    });

    console.log('Enrollment deleted:', id);
    return NextResponse.json(
      { message: 'Enrollment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
