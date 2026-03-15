import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const message = await prisma.message.update({
      where: { id },
      data: {
        isRead: body.isRead !== undefined ? body.isRead : true,
      },
      include: {
        reservation: true,
        property: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Message PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
