import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(' Fetching program with ID:', id);

  try {
    const program = await prisma.trainingProgram.findUnique({
      where: { id },
    });

    if (!program) {
      console.error(' program not found:', id);
      return NextResponse.json({ error: 'program not found' }, { status: 404 });
    }

    console.log(' program found:', program);
    return NextResponse.json(program);
  } catch (error) {
    console.error(' Error fetching program:', error);
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
  console.log(' Updating program with ID:', id);

  try {
    const { name, description, schoolId, outcome } = await request.json();
    const updatedprogram = await prisma.trainingProgram.update({
      where: { id },
      data: {
        name,
        description,
        schoolId: schoolId ? String(schoolId) : null,
        outcome,
      },
    });

    console.log(' program updated:', updatedprogram);
    return NextResponse.json(updatedprogram);
  } catch (error) {
    console.error(' Error updating program:', error);
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
  console.log(' Deleting program with ID:', id);

  try {
    await prisma.trainingProgram.delete({
      where: { id },
    });

    console.log(' program deleted:', id);
    return NextResponse.json(
      { message: 'program deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Error deleting program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
