import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get current date info
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // 1. Count of properties
    const propertiesCount = await prisma.property.count({
      where: { status: 'active' },
    });

    // 2. Count of active reservations (confirmed, check-out > today)
    const activeReservations = await prisma.reservation.count({
      where: {
        status: 'confirmed',
        checkOut: {
          gt: today,
        },
      },
    });

    // 3. Get all confirmed reservations for occupancy and revenue calculation
    const allReservations = await prisma.reservation.findMany({
      where: { status: 'confirmed' },
      select: {
        checkIn: true,
        checkOut: true,
        totalPrice: true,
      },
    });

    // Calculate occupancy rate
    let occupancyRate = 0;
    if (propertiesCount > 0) {
      const totalDays = 30 * propertiesCount; // Assuming 30 days for current month
      let bookedDays = 0;

      allReservations.forEach((res) => {
        if (res.checkIn && res.checkOut) {
          const days = Math.ceil(
            (res.checkOut.getTime() - res.checkIn.getTime()) / (1000 * 60 * 60 * 24)
          );
          bookedDays += days;
        }
      });

      occupancyRate = totalDays > 0 ? (bookedDays / totalDays) * 100 : 0;
    }

    // 4. Revenue this month
    const revenue = await prisma.reservation.aggregate({
      where: {
        status: 'confirmed',
        checkIn: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const revenueThisMonth = revenue._sum.totalPrice || 0;

    // 5. Unread messages count
    const unreadMessages = await prisma.message.count({
      where: { isRead: false },
    });

    // 6. Today's check-ins count
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const todayCheckIns = await prisma.reservation.count({
      where: {
        status: 'confirmed',
        checkIn: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: tomorrowStart,
        },
      },
    });

    // 7. Recent 5 reservations with property info
    const recentReservations = await prisma.reservation.findMany({
      take: 5,
      orderBy: { checkIn: 'desc' },
      include: {
        property: true,
      },
    });

    // 8. Recent activity (last 10 sync logs)
    const recentActivity = await prisma.syncLog.findMany({
      take: 10,
      orderBy: { syncedAt: 'desc' },
      include: {
        property: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        propertiesCount,
        activeReservations,
        occupancyRate: parseFloat(occupancyRate.toFixed(2)),
        revenueThisMonth,
        unreadMessages,
        todayCheckIns,
        recentReservations,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
