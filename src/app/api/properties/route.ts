import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const properties = await prisma.property.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { address: { contains: search } },
              { city: { contains: search } },
            ],
          }
        : {},
      include: {
        _count: {
          select: { reservations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error('Properties GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      address,
      city,
      country,
      description,
      bedrooms,
      bathrooms,
      maxGuests,
      pricePerNight,
      currency,
      status,
      airbnbListingId,
      airbnbIcalUrl,
      images,
      amenities,
    } = body;

    // Validate required fields
    if (!name || !address || !city || !country || bedrooms == null || bathrooms == null || maxGuests == null || pricePerNight == null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        country,
        description,
        bedrooms,
        bathrooms,
        maxGuests,
        pricePerNight,
        currency: currency || 'USD',
        status: status || 'active',
        airbnbListingId,
        airbnbIcalUrl,
        images: images ? JSON.stringify(images) : null,
        amenities: amenities ? JSON.stringify(amenities) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: property,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Properties POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
