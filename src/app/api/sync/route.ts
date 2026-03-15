import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const syncLogs = await prisma.syncLog.findMany({
      where: propertyId ? { propertyId } : {},
      include: {
        property: true,
      },
      orderBy: { syncedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: syncLogs,
    });
  } catch (error) {
    console.error('Sync logs GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId is required' },
        { status: 400 }
      );
    }

    // Get the property and verify it exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if property has iCal URL
    if (!property.airbnbIcalUrl) {
      return NextResponse.json(
        { success: false, error: 'Property does not have an iCal URL configured' },
        { status: 400 }
      );
    }

    // TODO: Implement actual iCal sync logic here
    // For now, create a mock sync log entry
    // In production, this would:
    // 1. Fetch the iCal feed from property.airbnbIcalUrl
    // 2. Parse the events
    // 3. Create or update CalendarEvent records
    // 4. Return sync status with success/error details

    const syncLog = await prisma.syncLog.create({
      data: {
        propertyId,
        channel: 'ical',
        status: 'success',
        message: 'iCal sync completed successfully (mock)',
      },
      include: {
        property: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          syncStatus: 'success',
          message: 'iCal sync triggered',
          syncLog,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync POST error:', error);

    // Log the error in sync logs
    try {
      const propertyId = (await request.json()).propertyId;
      if (propertyId) {
        await prisma.syncLog.create({
          data: {
            propertyId,
            channel: 'ical',
            status: 'error',
            message: error instanceof Error ? error.message : 'Sync failed',
          },
        });
      }
    } catch {
      // Ignore error in logging
    }

    return NextResponse.json(
      { success: false, error: 'Failed to sync iCal' },
      { status: 500 }
    );
  }
}
