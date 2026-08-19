/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getSchoolIdFilter } from '@/utils/role';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const schoolIdFilter = getSchoolIdFilter(session);

    const enrollments = await prisma.enrollment.findMany({
      where: schoolIdFilter ? { schoolId: schoolIdFilter } : {},
      include: {
        student: true,
        school: true,
        trainingProgram: true,
      },
    });
    return NextResponse.json(enrollments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Enrollment Data:', body);
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const sessions = Number(body.sessions);

    console.log('json:', {
      studentId: body.studentId,
      studentIds: body.studentIds,
      schoolId: body.schoolId,
      trainingprogramId: body.trainingprogramId,
      startDate,
      endDate,
      sessions,
      notes: body.notes || '',
    });

    if (Array.isArray(body.studentIds) && body.studentIds.length > 0) {
      const studentIds = [...new Set(body.studentIds.filter(Boolean))];

      const existingEnrollments = await prisma.enrollment.findMany({
        where: {
          studentId: { in: studentIds as string[] },
          trainingprogramId: body.trainingprogramId,
          startDate,
          endDate,
        },
        select: { studentId: true },
      });

      const existingStudentIds = new Set(
        existingEnrollments.map((enrollment) => enrollment.studentId)
      );
      const enrollableStudentIds = studentIds.filter(
        (studentId: string) => !existingStudentIds.has(studentId)
      );

      if (enrollableStudentIds.length === 0) {
        return NextResponse.json(
          { created: 0, skipped: studentIds.length },
          { status: 200 }
        );
      }

      const createManyResult = await prisma.enrollment.createMany({
        data: enrollableStudentIds.map((studentId: string) => ({
          studentId,
          schoolId: body.schoolId,
          trainingprogramId: body.trainingprogramId,
          startDate,
          endDate,
          sessions,
          notes: body.notes || '',
        })),
      });

      return NextResponse.json(
        {
          created: createManyResult.count,
          skipped: studentIds.length - createManyResult.count,
        },
        { status: 201 }
      );
    }

    const newEnrollment = await prisma.enrollment.create({
      data: {
        studentId: body.studentId,
        schoolId: body.schoolId,
        trainingprogramId: body.trainingprogramId,
        startDate,
        endDate,
        sessions,
        notes: body.notes || '',
      },
    });

    console.log('Enrollment Created:', newEnrollment);
    return NextResponse.json(newEnrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
