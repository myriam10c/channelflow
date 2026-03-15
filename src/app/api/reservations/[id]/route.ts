import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        property: true,
        messages: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error('Reservation GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        guestName: body.guestName,
        guestEmail: body.guestEmail,
        guestPhone: body.guestPhone,
        channel: body.channel,
        checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
        checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
        status: body.status,
        totalPrice: body.totalPrice,
        currency: body.currency,
        numberOfGuests: body.numberOfGuests,
        specialRequests: body.specialRequests,
      },
      include: {
        property: true,
        messages: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error('Reservation PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Reservation deleted successfully',
    });
  } catch (error) {
    console.error('Reservation DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete reservation' },
      { status: 500 }
    );
  }
}
