import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const propertyId = searchParams.get('propertyId');

    // First, get all properties for this user
    const userProperties = await prisma.property.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const userPropertyIds = userProperties.map(p => p.id);

    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: userPropertyIds },
        ...(status && { status }),
        ...(propertyId && { propertyId }),
        ...(search && {
          OR: [
            { guestName: { contains: search, mode: 'insensitive' } },
            { guestEmail: { contains: search, mode: 'insensitive' } },
            { guestPhone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        property: true,
      },
      orderBy: { checkIn: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error('Reservations GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      propertyId,
      guestName,
      guestEmail,
      guestPhone,
      channel,
      checkIn,
      checkOut,
      status,
      totalPrice,
      currency,
      numberOfGuests,
      specialRequests,
      airbnbReservationId,
    } = body;

    // Validate required fields
    if (!propertyId || !guestName || !guestEmail || !checkIn || !checkOut || !numberOfGuests) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { userId: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    if (property.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone ? guestPhone.trim() : null,
        channel: channel || 'direct',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: status || 'confirmed',
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        currency: currency || 'USD',
        numberOfGuests: parseInt(numberOfGuests),
        specialRequests: specialRequests ? specialRequests.trim() : null,
        airbnbReservationId,
      },
      include: {
        property: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: reservation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Reservations POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}
