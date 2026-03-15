# Prisma Schema Reference

## Quick Overview

The database schema for the Hostaway clone includes 5 main models:

```
Property (rental listings)
  ├── Reservation (guest bookings)
  │   ├── Message (guest communications)
  │   └── CalendarEvent (availability/blocks)
  ├── Message (property-level messages)
  ├── CalendarEvent (property blocks/maintenance)
  └── SyncLog (integration history)
```

## Model Details

### Property

Represents a rental property/listing on one or more channels.

| Field | Type | Notes |
|-------|------|-------|
| id | String | Auto-generated CUID |
| name | String | Property name/title |
| address | String | Street address |
| city | String | City |
| country | String | Country |
| description | String | Full description |
| bedrooms | Int | Number of bedrooms |
| bathrooms | Int | Number of bathrooms |
| maxGuests | Int | Maximum occupancy |
| pricePerNight | Float | Base price |
| currency | String | Currency code (USD, EUR, etc.) |
| status | String | "active", "inactive", "archived" |
| airbnbListingId | String | Airbnb listing ID (unique) |
| airbnbIcalUrl | String | Airbnb iCal calendar URL |
| images | String | JSON array of image URLs |
| amenities | String | JSON array of amenity strings |
| createdAt | DateTime | Auto timestamp |
| updatedAt | DateTime | Auto update timestamp |

### Reservation

Guest booking information.

| Field | Type | Notes |
|-------|------|-------|
| id | String | Auto-generated CUID |
| propertyId | String | Foreign key to Property |
| guestName | String | Guest full name |
| guestEmail | String | Guest email address |
| guestPhone | String | Guest phone number |
| channel | String | "airbnb", "booking", "direct", etc. |
| checkIn | DateTime | Check-in date/time |
| checkOut | DateTime | Check-out date/time |
| status | String | "confirmed", "pending", "cancelled", "completed" |
| totalPrice | Float | Total booking price |
| currency | String | Currency code |
| numberOfGuests | Int | Guest count |
| specialRequests | String | Guest notes/requests |
| airbnbReservationId | String | Airbnb booking ID (unique) |
| createdAt | DateTime | Auto timestamp |
| updatedAt | DateTime | Auto update timestamp |

### Message

Guest communications and interactions.

| Field | Type | Notes |
|-------|------|-------|
| id | String | Auto-generated CUID |
| reservationId | String | Foreign key to Reservation (nullable) |
| propertyId | String | Foreign key to Property |
| guestName | String | Guest name (for display) |
| content | String | Message text |
| direction | String | "incoming" or "outgoing" |
| channel | String | "airbnb", "booking", "email", "whatsapp", etc. |
| isRead | Boolean | Read status (default false) |
| createdAt | DateTime | Auto timestamp |

### CalendarEvent

Availability blocks, reservations, or maintenance blocks.

| Field | Type | Notes |
|-------|------|-------|
| id | String | Auto-generated CUID |
| propertyId | String | Foreign key to Property |
| reservationId | String | Foreign key to Reservation (nullable) |
| title | String | Event title |
| startDate | DateTime | Start date/time |
| endDate | DateTime | End date/time |
| type | String | "blocked", "reservation", "maintenance" |
| source | String | "manual", "airbnb", "ical" |
| externalId | String | ID from external system |
| createdAt | DateTime | Auto timestamp |

### SyncLog

History of channel synchronizations.

| Field | Type | Notes |
|-------|------|-------|
| id | String | Auto-generated CUID |
| propertyId | String | Foreign key to Property |
| channel | String | "airbnb", "booking", "ical", etc. |
| status | String | "success", "error", "pending" |
| message | String | Error or success details |
| syncedAt | DateTime | Auto timestamp |

## Common Queries

### Get all properties with stats
```typescript
const properties = await prisma.property.findMany({
  include: {
    reservations: {
      where: { status: "confirmed" }
    },
    messages: true,
    calendarEvents: true
  }
});
```

### Get reservations for a property in date range
```typescript
const reservations = await prisma.reservation.findMany({
  where: {
    propertyId: "prop-123",
    checkIn: { gte: startDate, lte: endDate },
    status: "confirmed"
  },
  include: {
    messages: true,
    calendarEvents: true
  }
});
```

### Get unread messages
```typescript
const unreadMessages = await prisma.message.findMany({
  where: {
    isRead: false,
    propertyId: "prop-123"
  },
  orderBy: { createdAt: "desc" }
});
```

### Get recent sync errors
```typescript
const syncErrors = await prisma.syncLog.findMany({
  where: {
    status: "error",
    syncedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  },
  orderBy: { syncedAt: "desc" }
});
```

## Relationships

### Cascade Delete
- Deleting a Property cascades to: Reservations, Messages, CalendarEvents, SyncLogs
- Deleting a Reservation: Messages and CalendarEvents set to null (SetNull)

### Optional Relations
- Message.reservationId can be null (property-level messages)
- CalendarEvent.reservationId can be null (blocks, maintenance)

## Sample Data

The seed file creates:
- **3 Properties**: Riad Marrakech, Appartement Paris, Villa Bali
- **6 Reservations**: Mix of confirmed, pending, completed, cancelled
- **11 Messages**: Guest conversations across properties
- **8 Calendar Events**: Reservations, maintenance, blocked dates
- **5 Sync Logs**: Success and error sync records

Run `npm run db:seed` to populate sample data.
