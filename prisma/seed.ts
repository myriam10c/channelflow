import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Get or create admin user
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@channelflow.com' },
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
  }

  if (!adminUser) {
    throw new Error('No admin user found. Please ensure the admin user exists before seeding.');
  }

  // Clear existing data
  await prisma.syncLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.property.deleteMany();

  // Create sample properties
  const riadMarrakech = await prisma.property.create({
    data: {
      userId: adminUser.id,
      name: "Riad Marrakech",
      address: "Derb Sidi Ahmed Ou Moussa",
      city: "Marrakech",
      country: "Morocco",
      description: "Beautiful traditional riad in the medina with courtyard",
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 8,
      pricePerNight: 150,
      currency: "USD",
      status: "active",
      airbnbListingId: "airbnb-123456",
      airbnbIcalUrl:
        "https://www.airbnb.com/calendar/ical/123456.ics?s=abc123",
      images: JSON.stringify([
        "https://example.com/riad1.jpg",
        "https://example.com/riad2.jpg",
        "https://example.com/riad3.jpg",
      ]),
      amenities: JSON.stringify([
        "WiFi",
        "Air Conditioning",
        "Courtyard",
        "Kitchen",
        "Terrace",
      ]),
    },
  });

  const appartementParis = await prisma.property.create({
    data: {
      userId: adminUser.id,
      name: "Appartement Paris",
      address: "75 Rue de Rivoli",
      city: "Paris",
      country: "France",
      description: "Chic apartment near the Louvre",
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      pricePerNight: 200,
      currency: "EUR",
      status: "active",
      airbnbListingId: "airbnb-789012",
      images: JSON.stringify([
        "https://example.com/paris1.jpg",
        "https://example.com/paris2.jpg",
      ]),
      amenities: JSON.stringify(["WiFi", "TV", "Kitchen", "Washer"]),
    },
  });

  const villaBali = await prisma.property.create({
    data: {
      userId: adminUser.id,
      name: "Villa Bali",
      address: "Jalan Cendrawasih",
      city: "Ubud",
      country: "Indonesia",
      description: "Luxury villa with pool and garden",
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      pricePerNight: 120,
      currency: "USD",
      status: "active",
      images: JSON.stringify([
        "https://example.com/bali1.jpg",
        "https://example.com/bali2.jpg",
        "https://example.com/bali3.jpg",
        "https://example.com/bali4.jpg",
      ]),
      amenities: JSON.stringify([
        "Pool",
        "WiFi",
        "Garden",
        "Kitchen",
        "AC",
        "Patio",
      ]),
    },
  });

  console.log("✅ Created 3 properties");

  // Create reservations
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const res1 = await prisma.reservation.create({
    data: {
      propertyId: riadMarrakech.id,
      guestName: "John Smith",
      guestEmail: "john@example.com",
      guestPhone: "+1234567890",
      channel: "airbnb",
      checkIn: nextWeek,
      checkOut: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: "confirmed",
      totalPrice: 750,
      numberOfGuests: 4,
      specialRequests: "Late checkout if possible",
      airbnbReservationId: "airbnb-res-001",
    },
  });

  const res2 = await prisma.reservation.create({
    data: {
      propertyId: appartementParis.id,
      guestName: "Emma Wilson",
      guestEmail: "emma@example.com",
      guestPhone: "+33123456789",
      channel: "booking",
      checkIn: twoWeeksAgo,
      checkOut: new Date(twoWeeksAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: "completed",
      totalPrice: 1400,
      numberOfGuests: 2,
      specialRequests: "Room with view",
    },
  });

  const res3 = await prisma.reservation.create({
    data: {
      propertyId: villaBali.id,
      guestName: "Alex Johnson",
      guestEmail: "alex@example.com",
      guestPhone: "+62812345678",
      channel: "airbnb",
      checkIn: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      checkOut: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      status: "confirmed",
      totalPrice: 840,
      numberOfGuests: 6,
      specialRequests: "Birthday celebration",
      airbnbReservationId: "airbnb-res-003",
    },
  });

  const res4 = await prisma.reservation.create({
    data: {
      propertyId: riadMarrakech.id,
      guestName: "Marie Dubois",
      guestEmail: "marie@example.com",
      guestPhone: "+33612345678",
      channel: "direct",
      checkIn: nextMonth,
      checkOut: new Date(nextMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: "pending",
      totalPrice: 450,
      numberOfGuests: 2,
    },
  });

  const res5 = await prisma.reservation.create({
    data: {
      propertyId: appartementParis.id,
      guestName: "Michael Brown",
      guestEmail: "michael@example.com",
      guestPhone: "+441234567890",
      channel: "airbnb",
      checkIn: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      checkOut: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
      status: "confirmed",
      totalPrice: 1400,
      numberOfGuests: 2,
      airbnbReservationId: "airbnb-res-005",
    },
  });

  const res6 = await prisma.reservation.create({
    data: {
      propertyId: villaBali.id,
      guestName: "Lisa Chen",
      guestEmail: "lisa@example.com",
      guestPhone: "+886912345678",
      channel: "booking",
      checkIn: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      checkOut: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      status: "cancelled",
      totalPrice: 840,
      numberOfGuests: 4,
      specialRequests: "Cancelled due to work",
    },
  });

  console.log("✅ Created 6 reservations");

  // Create messages for different reservations
  const messages = [
    {
      reservationId: res1.id,
      propertyId: riadMarrakech.id,
      guestName: "John Smith",
      content: "Hi, I'm looking forward to my stay!",
      direction: "incoming",
      channel: "airbnb",
    },
    {
      reservationId: res1.id,
      propertyId: riadMarrakech.id,
      guestName: "John Smith",
      content:
        "Welcome! Check-in is at 3 PM. Please let us know your arrival time.",
      direction: "outgoing",
      channel: "airbnb",
    },
    {
      reservationId: res1.id,
      propertyId: riadMarrakech.id,
      guestName: "John Smith",
      content: "Will arrive around 4 PM. Is that okay?",
      direction: "incoming",
      channel: "airbnb",
    },
    {
      reservationId: res2.id,
      propertyId: appartementParis.id,
      guestName: "Emma Wilson",
      content: "Great stay! Thank you for the hospitality.",
      direction: "incoming",
      channel: "booking",
    },
    {
      reservationId: res3.id,
      propertyId: villaBali.id,
      guestName: "Alex Johnson",
      content: "Can we have a birthday cake delivered to the villa?",
      direction: "incoming",
      channel: "airbnb",
    },
    {
      reservationId: res3.id,
      propertyId: villaBali.id,
      guestName: "Alex Johnson",
      content: "Of course! We can arrange that. Any preferences?",
      direction: "outgoing",
      channel: "airbnb",
    },
    {
      reservationId: res3.id,
      propertyId: villaBali.id,
      guestName: "Alex Johnson",
      content: "Chocolate cake would be perfect!",
      direction: "incoming",
      channel: "airbnb",
    },
    {
      reservationId: res4.id,
      propertyId: riadMarrakech.id,
      guestName: "Marie Dubois",
      content: "I would like to confirm my booking",
      direction: "incoming",
      channel: "direct",
    },
    {
      reservationId: res5.id,
      propertyId: appartementParis.id,
      guestName: "Michael Brown",
      content: "Any good restaurants near the apartment?",
      direction: "incoming",
      channel: "airbnb",
    },
    {
      reservationId: res5.id,
      propertyId: appartementParis.id,
      guestName: "Michael Brown",
      content:
        "Yes! Try 'L'Epicerie' just around the corner - excellent French cuisine.",
      direction: "outgoing",
      channel: "airbnb",
    },
    {
      reservationId: res6.id,
      propertyId: villaBali.id,
      guestName: "Lisa Chen",
      content: "I need to cancel my booking due to work issues",
      direction: "incoming",
      channel: "booking",
    },
  ];

  for (const message of messages) {
    await prisma.message.create({
      data: message,
    });
  }

  console.log("✅ Created 11 messages");

  // Create calendar events
  const calendarEvents = [
    {
      propertyId: riadMarrakech.id,
      reservationId: res1.id,
      title: "Reservation - John Smith",
      startDate: res1.checkIn,
      endDate: res1.checkOut,
      type: "reservation",
      source: "airbnb",
      externalId: "airbnb-res-001",
    },
    {
      propertyId: riadMarrakech.id,
      title: "Maintenance - Plumbing",
      startDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 41 * 24 * 60 * 60 * 1000),
      type: "maintenance",
      source: "manual",
    },
    {
      propertyId: riadMarrakech.id,
      reservationId: res4.id,
      title: "Reservation - Marie Dubois",
      startDate: res4.checkIn,
      endDate: res4.checkOut,
      type: "reservation",
      source: "manual",
    },
    {
      propertyId: appartementParis.id,
      reservationId: res2.id,
      title: "Reservation - Emma Wilson",
      startDate: res2.checkIn,
      endDate: res2.checkOut,
      type: "reservation",
      source: "booking",
    },
    {
      propertyId: appartementParis.id,
      reservationId: res5.id,
      title: "Reservation - Michael Brown",
      startDate: res5.checkIn,
      endDate: res5.checkOut,
      type: "reservation",
      source: "airbnb",
      externalId: "airbnb-res-005",
    },
    {
      propertyId: appartementParis.id,
      title: "Blocked - Cleaning",
      startDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 46 * 24 * 60 * 60 * 1000),
      type: "blocked",
      source: "manual",
    },
    {
      propertyId: villaBali.id,
      reservationId: res3.id,
      title: "Reservation - Alex Johnson",
      startDate: res3.checkIn,
      endDate: res3.checkOut,
      type: "reservation",
      source: "airbnb",
      externalId: "airbnb-res-003",
    },
    {
      propertyId: villaBali.id,
      title: "Blocked - Peak Season Hold",
      startDate: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 57 * 24 * 60 * 60 * 1000),
      type: "blocked",
      source: "manual",
    },
  ];

  for (const event of calendarEvents) {
    await prisma.calendarEvent.create({
      data: event,
    });
  }

  console.log("✅ Created 8 calendar events");

  // Create sync logs
  const syncLogs = [
    {
      propertyId: riadMarrakech.id,
      channel: "airbnb",
      status: "success",
      message: "Sync completed successfully",
      syncedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      propertyId: riadMarrakech.id,
      channel: "ical",
      status: "success",
      message: "Calendar synchronized",
      syncedAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
    {
      propertyId: appartementParis.id,
      channel: "booking",
      status: "success",
      message: "Reservations updated",
      syncedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      propertyId: villaBali.id,
      channel: "airbnb",
      status: "success",
      message: "Sync completed successfully",
      syncedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      propertyId: villaBali.id,
      channel: "airbnb",
      status: "error",
      message: "Connection timeout",
      syncedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  ];

  for (const log of syncLogs) {
    await prisma.syncLog.create({
      data: log,
    });
  }

  console.log("✅ Created 5 sync logs");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
