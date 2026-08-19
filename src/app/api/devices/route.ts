import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const devices = await prisma.device.findMany();
  return NextResponse.json(devices);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const device = await prisma.device.create({ data: body });
  return NextResponse.json(device);
}
