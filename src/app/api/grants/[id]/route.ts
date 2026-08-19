import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const grant = await prisma.grant.findUnique({ where: { id: id } });
  return grant
    ? NextResponse.json(grant)
    : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.grant.delete({ where: { id: id } });
  return NextResponse.json({ message: 'Grant deleted' });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(' Updating grant with ID:', id);

  try {
    const {
      mouDate,
      schoolId,
      grantTotal,
      grantInf,
      grantTrain,
      grantInfSp,
      grantTrainSp,
    } = await request.json();
    const updatedGrant = await prisma.grant.update({
      where: { id },
      data: {
        mouDate,
        schoolId: schoolId ? String(schoolId) : '',
        grantTotal,
        grantInf,
        grantTrain,
        grantInfSp,
        grantTrainSp,
      },
    });

    console.log(' Grant updated:', updatedGrant);
    return NextResponse.json(updatedGrant);
  } catch (error) {
    console.error(' Error updating grant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
