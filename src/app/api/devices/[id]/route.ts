import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching device with ID:', id);

    const device = await prisma.device.findUnique({
      where: { id: id },
    });

    if (!device) {
      console.error(' Device not found:', id);
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    console.log(' Device found:', device);
    return NextResponse.json(device);
  } catch (error) {
    console.error(' Error fetching device:', error);
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
  try {
    const body = await request.json();
    console.log('Updating device with ID:', id, 'Data:', body);

    const updatedDevice = await prisma.device.update({
      where: { id: id },
      data: {
        type: body.type,
        desc: body.desc,
        techParam1: body.techParam1,
        techParam2: body.techParam2,
      },
    });

    console.log(' Device updated:', updatedDevice);
    return NextResponse.json(updatedDevice);
  } catch (error) {
    console.error(' Error updating device:', error);
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
  try {
    console.log('Deleting device with ID:', id);

    await prisma.device.delete({
      where: { id: id },
    });

    console.log(' Device deleted:', id);
    return NextResponse.json(
      { message: 'Device deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Error deleting device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
