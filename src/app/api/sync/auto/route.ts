import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { parseICalFeed } from '@/lib/ical-parser';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sync/auto
 * Syncs all properties that have iCal URLs configured
 * This endpoint is designed to be called by external cron jobs or schedulers
 * Requires X-Cron-Key header for security
 */
export async function GET(request: NextRequest) {
  try {
    // Security check - require cron key
    const cronKey = request.headers.get('X-Cron-Key');
    const expectedKey = process.env.CRON_SECRET_KEY;

    if (!expectedKey || cronKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid cron key' },
        { status: 401 }
      );
    }

    // Fetch all properties with iCal URLs
    const properties = await prisma.property.findMany({
      where: {
        airbnbIcalUrl: {
          not: null,
        },
      },
      include: {
        user: true,
      },
    });

    const results = [];

    // Sync each property
    for (const property of properties) {
      try {
        if (!property.airbnbIcalUrl) continue;

        const syncResult = await performICalSync(property.id, property.airbnbIcalUrl);

        results.push({
          propertyId: property.id,
          propertyName: property.name,
          status: syncResult.errors.length > 0 ? 'partial' : 'success',
          result: syncResult,
        });

        // Log the sync
        await prisma.syncLog.create({
          data: {
            propertyId: property.id,
            channel: 'ical',
            status: syncResult.errors.length > 0 ? 'error' : 'success',
            message: `Auto-sync: ${syncResult.newReservations} new, ${syncResult.updatedReservations} updated. Errors: ${syncResult.errors.length}`,
          },
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          propertyId: property.id,
          propertyName: property.name,
          status: 'error',
          error: errorMsg,
        });

        await prisma.syncLog.create({
          data: {
            propertyId: property.id,
            channel: 'ical',
            status: 'error',
            message: `Auto-sync failed: ${errorMsg}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      propertiesSynced: properties.length,
      results,
    });
  } catch (error) {
    console.error('Auto-sync error:', error);
    return NextResponse.json(
      { error: 'Failed to perform auto-sync' },
      { status: 500 }
    );
  }
}

interface SyncResult {
  newReservations: number;
  updatedReservations: number;
  newBlockedDates: number;
  errors: string[];
  successCount: number;
  totalProcessed: number;
}

async function performICalSync(propertyId: string, icalUrl: string): Promise<SyncResult> {
  const result: SyncResult = {
    newReservations: 0,
    updatedReservations: 0,
    newBlockedDates: 0,
    errors: [],
    successCount: 0,
    totalProcessed: 0,
  };

  try {
    // Fetch and parse iCal feed
    const events = await parseICalFeed(icalUrl);

    for (const event of events) {
      try {
        result.totalProcessed++;

        // Extract event data
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const title = event.title || 'Reservation';
        const uid = event.uid || `ical-${event.startDate}-${event.endDate}`;

        // Check if this is a reservation or blocked date
        const isReservation = /^[A-Z]/i.test(title) && !title.toLowerCase().includes('blocked');

        if (isReservation) {
          const guestName = title;

          // Check if already exists
          const existing = await prisma.reservation.findFirst({
            where: {
              propertyId,
              airbnbReservationId: uid,
            },
          });

          if (existing) {
            await prisma.reservation.update({
              where: { id: existing.id },
              data: {
                checkIn: startDate,
                checkOut: endDate,
                guestName,
              },
            });
            result.updatedReservations++;
          } else {
            await prisma.reservation.create({
              data: {
                propertyId,
                guestName,
                guestEmail: 'airbnb@guest.local',
                checkIn: startDate,
                checkOut: endDate,
                numberOfGuests: 1,
                status: 'confirmed',
                channel: 'airbnb',
                airbnbReservationId: uid,
              },
            });
            result.newReservations++;
          }

          // Create associated calendar event
          const existingCalEvent = await prisma.calendarEvent.findFirst({
            where: {
              propertyId,
              externalId: uid,
            },
          });

          if (!existingCalEvent) {
            const reservation = await prisma.reservation.findFirst({
              where: {
                propertyId,
                airbnbReservationId: uid,
              },
            });

            if (reservation) {
              await prisma.calendarEvent.create({
                data: {
                  propertyId,
                  reservationId: reservation.id,
                  title: guestName,
                  startDate,
                  endDate,
                  type: 'reservation',
                  source: 'ical',
                  externalId: uid,
                },
              });
            }
          }
        } else {
          // Create as blocked date
          const existingBlocked = await prisma.calendarEvent.findFirst({
            where: {
              propertyId,
              externalId: uid,
            },
          });

          if (!existingBlocked) {
            await prisma.calendarEvent.create({
              data: {
                propertyId,
                title: title || 'Blocked',
                startDate,
                endDate,
                type: 'blocked',
                source: 'ical',
                externalId: uid,
              },
            });
            result.newBlockedDates++;
          }
        }

        result.successCount++;
      } catch (eventError) {
        const errorMsg = eventError instanceof Error ? eventError.message : 'Unknown error';
        result.errors.push(`Event "${event.title}": ${errorMsg}`);
      }
    }
  } catch (parseError) {
    const errorMsg = parseError instanceof Error ? parseError.message : 'Failed to parse iCal feed';
    result.errors.push(errorMsg);
  }

  return result;
}
