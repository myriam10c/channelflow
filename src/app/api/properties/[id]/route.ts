import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        reservations: true,
        calendarEvents: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Property GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch property' },
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

    const property = await prisma.property.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        country: body.country,
        description: body.description,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        maxGuests: body.maxGuests,
        pricePerNight: body.pricePerNight,
        currency: body.currency,
        status: body.status,
        airbnbListingId: body.airbnbListingId,
        airbnbIcalUrl: body.airbnbIcalUrl,
        images: body.images ? JSON.stringify(body.images) : undefined,
        amenities: body.amenities ? JSON.stringify(body.amenities) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Property PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update property' },
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

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Property DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
