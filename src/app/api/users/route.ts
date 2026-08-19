/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role,
        schoolId: body.role === 'STAFF' ? body.schoolId : null,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
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
    const deleted = await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse('Error deleting user', { status: 500 });
  }
}
