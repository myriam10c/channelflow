import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    const messages = await prisma.message.findMany({
      where: reservationId ? { reservationId } : {},
      include: {
        reservation: true,
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      reservationId,
      propertyId,
      guestName,
      content,
      direction,
      channel,
    } = body;

    // Validate required fields
    if (!propertyId || !guestName || !content || !channel) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        reservationId: reservationId || null,
        propertyId,
        guestName,
        content,
        direction: direction || 'outgoing',
        channel,
        isRead: direction === 'outgoing', // Outgoing messages are automatically marked as read
      },
      include: {
        reservation: true,
        property: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
