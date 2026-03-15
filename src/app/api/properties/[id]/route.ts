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

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        reservations: {
          orderBy: { checkIn: 'desc' },
        },
        calendarEvents: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (property.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse JSON fields
    const formattedProperty = {
      ...property,
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      images: property.images ? JSON.parse(property.images) : [],
    };

    return NextResponse.json({
      success: true,
      data: formattedProperty,
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
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    if (existingProperty.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate required fields if provided
    if (body.name !== undefined && !body.name) {
      return NextResponse.json(
        { success: false, error: 'Property name cannot be empty' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.address !== undefined) updateData.address = body.address.trim();
    if (body.city !== undefined) updateData.city = body.city.trim();
    if (body.country !== undefined) updateData.country = body.country.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.bedrooms !== undefined) updateData.bedrooms = parseInt(body.bedrooms);
    if (body.bathrooms !== undefined) updateData.bathrooms = parseInt(body.bathrooms);
    if (body.maxGuests !== undefined) updateData.maxGuests = parseInt(body.maxGuests);
    if (body.pricePerNight !== undefined) updateData.pricePerNight = parseFloat(body.pricePerNight);
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.airbnbListingId !== undefined) updateData.airbnbListingId = body.airbnbListingId;
    if (body.airbnbIcalUrl !== undefined) updateData.airbnbIcalUrl = body.airbnbIcalUrl;
    if (body.images !== undefined) updateData.images = body.images && body.images.length > 0 ? JSON.stringify(body.images) : null;
    if (body.amenities !== undefined) updateData.amenities = body.amenities && body.amenities.length > 0 ? JSON.stringify(body.amenities) : null;

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        reservations: true,
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    if (existingProperty.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

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
