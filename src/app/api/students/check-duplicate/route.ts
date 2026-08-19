import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, gender, aadharNumber, excludeId } = body;

    if (!firstName || !gender || !aadharNumber) {
      return NextResponse.json({ duplicates: [] });
    }

    const matches = await prisma.student.findMany({
      where: {
        firstName: { equals: firstName, mode: 'insensitive' },
        gender,
        aadharNumber,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { school: { select: { Name: true } } },
    });

    const duplicates = matches.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      aadharNumber: s.aadharNumber,
      gender: s.gender,
      schoolId: s.schoolId,
      schoolName: s.school?.Name ?? null,
    }));

    return NextResponse.json({ duplicates });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Error checking for duplicates' },
      { status: 500 }
    );
  }
}
