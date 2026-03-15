import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Verify ownership
    if (reservation.property.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (existingReservation.property.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate dates if provided
    if (body.checkIn && body.checkOut) {
      const checkInDate = new Date(body.checkIn);
      const checkOutDate = new Date(body.checkOut);

      if (checkInDate >= checkOutDate) {
        return NextResponse.json(
          { success: false, error: 'Check-out date must be after check-in date' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (body.guestName !== undefined) updateData.guestName = body.guestName.trim();
    if (body.guestEmail !== undefined) updateData.guestEmail = body.guestEmail.trim();
    if (body.guestPhone !== undefined) updateData.guestPhone = body.guestPhone ? body.guestPhone.trim() : null;
    if (body.channel !== undefined) updateData.channel = body.channel;
    if (body.checkIn !== undefined) updateData.checkIn = new Date(body.checkIn);
    if (body.checkOut !== undefined) updateData.checkOut = new Date(body.checkOut);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice ? parseFloat(body.totalPrice) : null;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.numberOfGuests !== undefined) updateData.numberOfGuests = parseInt(body.numberOfGuests);
    if (body.specialRequests !== undefined) updateData.specialRequests = body.specialRequests ? body.specialRequests.trim() : null;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (existingReservation.property.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

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
