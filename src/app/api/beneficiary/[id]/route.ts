import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    console.log('Fetching beneficiary with ID:', id);

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: id },
    });

    if (!beneficiary) {
      console.error('Beneficiary not found:', id);
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    console.log('Beneficiary found:', beneficiary);
    return NextResponse.json(beneficiary);
  } catch (error) {
    console.error('Error fetching beneficiary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    console.log('Updating beneficiary with ID:', id, body);

    const updatedBeneficiary = await prisma.beneficiary.update({
      where: { id: id },
      data: {
        studentId: body.studentId,
        schoolId: body.schoolId,
        deviceId: body.deviceId,
        issueDate: body.issueDate,
        required: body.required,
      },
    });

    console.log('Beneficiary updated:', updatedBeneficiary);
    return NextResponse.json(updatedBeneficiary);
  } catch (error) {
    console.error('Error updating beneficiary:', error);
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
    console.log('Deleting beneficiary with ID:', id);

    await prisma.beneficiary.delete({
      where: { id: id },
    });

    console.log('Beneficiary deleted:', id);
    return NextResponse.json(
      { message: 'Beneficiary deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
