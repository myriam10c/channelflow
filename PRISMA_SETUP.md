# Prisma Database Setup Guide

## Overview

This project uses Prisma ORM with SQLite for the channel manager (Hostaway clone) application. The database schema includes models for properties, reservations, messages, calendar events, and sync logs.

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
DATABASE_URL="file:./prisma/dev.db"
```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma Client based on the schema defined in `prisma/schema.prisma`.

### 3. Create and Seed the Database

For **Prisma 7**, use the following approach:

```bash
# For development/testing, you can manually push the schema
npx prisma db push --skip-generate

# Or seed the database directly (which will initialize it)
npm run db:seed
```

If `db:push` encounters issues, the seed script will create the database on first run.

### 4. Alternative: Create Migration

If you need to use migrations:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

## Database Schema

### Models

1. **Property** - Rental properties/listings
   - Tracks listing info, pricing, amenities, images
   - Connected to Airbnb via `airbnbListingId` and iCal URL
   - Relations: reservations, messages, calendar events, sync logs

2. **Reservation** - Guest bookings
   - Guest contact info and booking details
   - Supports multiple channels (Airbnb, Booking, direct, etc.)
   - Status tracking: confirmed, pending, cancelled, completed
   - Relations: messages, calendar events

3. **Message** - Guest communications
   - Direction: incoming/outgoing
   - Supports multiple channels (Airbnb, Booking, email, WhatsApp, etc.)
   - Read status tracking
   - Relations: reservation, property

4. **CalendarEvent** - Availability and blocks
   - Types: reservation, blocked, maintenance
   - Sources: manual, Airbnb, iCal
   - Relations: property, reservation (optional)

5. **SyncLog** - Integration sync history
   - Tracks sync status for each channel
   - Logs success/error messages
   - Useful for debugging integration issues

## Database Operations

### View Database

```bash
npm run db:studio
```

Opens Prisma Studio for visual database management and data viewing.

### Regenerate Client

After schema changes:

```bash
npm run db:generate
```

### Seed with Sample Data

The `prisma/seed.ts` file includes sample data:
- 3 properties (Riad Marrakech, Appartement Paris, Villa Bali)
- 6 reservations with various statuses
- 11 messages for different conversations
- 8 calendar events
- 5 sync logs

Run seeding:

```bash
npm run db:seed
```

## Schema Details

### Field Types

- **String**: Enums (channel, status, direction) are stored as strings since SQLite doesn't support native enums
- **JSON**: Images and amenities are stored as JSON strings
- **DateTime**: Timestamps with automatic `createdAt` and `updatedAt`
- **Relations**: Cascade deletes configured for data integrity

### Indexes

Indexes are configured on frequently queried fields:
- Property: status, airbnbListingId
- Reservation: propertyId, status, checkIn, checkOut, airbnbReservationId
- Message: reservationId, propertyId, isRead, createdAt
- CalendarEvent: propertyId, startDate, endDate, type
- SyncLog: propertyId, channel, syncedAt

## Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Generate client**: `npm run db:generate`
3. **Create migration** (if needed): `npx prisma migrate dev --name <change_name>`
4. **Seed data** (if needed): `npm run db:seed`

## Troubleshooting

### Database Lock Error

If you get "database is locked" errors:
- Ensure only one Prisma Studio or similar tool is accessing the database
- Close any other database connections
- Delete `prisma/dev.db` and reseed if severely locked

### "url is no longer supported" Error

This is a Prisma 7 requirement. Ensure:
- `prisma/schema.prisma` has `url = env("DATABASE_URL")`
- `.env` file exists with `DATABASE_URL="file:./prisma/dev.db"`
- Run `npm run db:generate` after schema changes

### Type Errors in Code

If you see TypeScript errors related to Prisma types:
```bash
npm run db:generate
```

This regenerates types in `node_modules/@prisma/client`.

## Next Steps

- Create API routes to interact with the database using Prisma Client
- Implement real-time sync with Airbnb and Booking.com
- Add more complex queries and relations as needed
- Set up proper error handling and logging
