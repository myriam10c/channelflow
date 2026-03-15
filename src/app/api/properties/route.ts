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
    const search = searchParams.get('search');

    const properties = await prisma.property.findMany({
      where: {
        userId: session.user.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields and add channels
    const formattedProperties = properties.map((prop) => ({
      ...prop,
      amenities: prop.amenities ? JSON.parse(prop.amenities) : [],
      images: prop.images ? JSON.parse(prop.images) : [],
      channels: ['direct'], // Default channel
    }));

    return NextResponse.json({
      success: true,
      data: formattedProperties,
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      channels,
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
        userId: session.user.id,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        description: description?.trim() || null,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        maxGuests: parseInt(maxGuests),
        pricePerNight: parseFloat(pricePerNight),
        currency: currency || 'USD',
        status: status || 'active',
        airbnbListingId,
        airbnbIcalUrl,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        amenities: amenities && amenities.length > 0 ? JSON.stringify(amenities) : null,
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
