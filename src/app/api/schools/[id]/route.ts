import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(' Fetching school with ID:', id);

  try {
    const school = await prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      console.error(' School not found:', id);
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    console.log(' School found:', school);
    return NextResponse.json(school);
  } catch (error) {
    console.error(' Error fetching school:', error);
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
  console.log(' Updating school with ID:', id);

  try {
    const body = await request.json();
    const updatedSchool = await prisma.school.update({
      where: { id },
      data: body,
    });

    console.log(' School updated:', updatedSchool);
    return NextResponse.json(updatedSchool);
  } catch (error) {
    console.error(' Error updating school:', error);
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
  console.log(' Deleting school with ID:', id);

  try {
    await prisma.school.delete({
      where: { id },
    });

    console.log(' School deleted:', id);
    return NextResponse.json(
      { message: 'School deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Error deleting school:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
