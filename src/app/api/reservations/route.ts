import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const propertyId = searchParams.get('propertyId');

    const reservations = await prisma.reservation.findMany({
      where: {
        ...(status && { status }),
        ...(propertyId && { propertyId }),
        ...(search && {
          OR: [
            { guestName: { contains: search,  } },
            { guestEmail: { contains: search,  } },
            { guestPhone: { contains: search,  } },
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

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestName,
        guestEmail,
        guestPhone,
        channel: channel || 'direct',
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        status: status || 'confirmed',
        totalPrice,
        currency: currency || 'USD',
        numberOfGuests,
        specialRequests,
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
