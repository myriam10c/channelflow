import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateVEvent } from '@/lib/ical-parser';

/**
 * GET /api/ical/[propertyId]
 * Generates an iCal feed for a property with all its reservations and blocked dates
 * Can be imported into other calendar applications
 */
export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const propertyId = params.propertyId;

    // Fetch property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        reservations: {
          where: { status: { not: 'cancelled' } },
        },
        calendarEvents: {
          where: {
            OR: [
              { type: 'reservation' },
              { type: 'blocked' },
            ],
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Generate iCal feed
    const icalContent = generateICalFeed(property);

    // Return as iCal file
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${property.name.replace(/\s+/g, '-')}-calendar.ics"`,
      },
    });
  } catch (error) {
    console.error('iCal generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate iCal feed' },
      { status: 500 }
    );
  }
}

function generateICalFeed(property: any): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChannelFlow//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalString(property.name)}`,
    `X-WR-TIMEZONE:UTC`,
    'X-WR-CALDESC:Property availability calendar',
  ];

  // Add all calendar events
  if (property.calendarEvents && property.calendarEvents.length > 0) {
    for (const event of property.calendarEvents) {
      const vevent = generateVEvent({
        uid: event.externalId || event.id,
        title: event.title,
        description: `Type: ${event.type}, Source: ${event.source}`,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      });
      lines.push(vevent);
    }
  }

  // Add reservations as events
  if (property.reservations && property.reservations.length > 0) {
    for (const res of property.reservations) {
      const vevent = generateVEvent({
        uid: res.airbnbReservationId || res.id,
        title: `Reservation: ${res.guestName}`,
        description: `Guest: ${res.guestName}\nEmail: ${res.guestEmail}\nGuests: ${res.numberOfGuests}`,
        startDate: new Date(res.checkIn),
        endDate: new Date(res.checkOut),
      });
      lines.push(vevent);
    }
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

function escapeICalString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
