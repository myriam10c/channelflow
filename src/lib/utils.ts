import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance, formatRelative, parseISO } from "date-fns";
import { Channel, ReservationStatus, PropertyStatus } from "@/types";

/**
 * Combine classnames with tailwind merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amount with locale and currency code
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format date using date-fns with various format options
 * @param date - Date string or Date object
 * @param formatStr - date-fns format string (defaults to 'MMM dd, yyyy')
 */
export function formatDate(date: Date | string, formatStr: string = "MMM dd, yyyy"): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return "Invalid date";
  }
}

/**
 * Get relative date format (e.g., "2 days ago", "in 3 hours")
 */
export function formatDateRelative(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    return "Invalid date";
  }
}

/**
 * Get Tailwind color classes for reservation status
 */
export function getStatusColor(status: ReservationStatus | PropertyStatus): string {
  const colors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800 border-green-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300",
    active: "bg-green-100 text-green-800 border-green-300",
    inactive: "bg-gray-100 text-gray-800 border-gray-300",
    maintenance: "bg-orange-100 text-orange-800 border-orange-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * Get color (hex or tailwind class) for each channel
 */
export function getChannelColor(channel: Channel): string {
  const colors: Record<Channel, string> = {
    airbnb: "bg-red-100 text-red-800",
    booking: "bg-blue-100 text-blue-800",
    direct: "bg-purple-100 text-purple-800",
    vrbo: "bg-indigo-100 text-indigo-800",
  };
  return colors[channel];
}

/**
 * Get icon/emoji for each channel
 */
export function getChannelIcon(channel: Channel): string {
  const icons: Record<Channel, string> = {
    airbnb: "🏠",
    booking: "📅",
    direct: "📧",
    vrbo: "🏖️",
  };
  return icons[channel];
}

/**
 * Get channel display name
 */
export function getChannelName(channel: Channel): string {
  const names: Record<Channel, string> = {
    airbnb: "Airbnb",
    booking: "Booking.com",
    direct: "Direct Booking",
    vrbo: "VRBO",
  };
  return names[channel];
}

/**
 * Calculate occupancy rate based on reservations
 * @param reservations - Array of reservation objects with checkInDate and checkOutDate
 * @param totalDays - Total number of days in the period (e.g., 365 for annual)
 * @returns Occupancy rate as percentage (0-100)
 */
export function calculateOccupancyRate(
  reservations: Array<{ checkInDate: Date | string; checkOutDate: Date | string }>,
  totalDays: number = 365
): number {
  if (totalDays <= 0) return 0;

  let occupiedDays = 0;

  reservations.forEach((reservation) => {
    const checkIn = typeof reservation.checkInDate === "string"
      ? parseISO(reservation.checkInDate)
      : reservation.checkInDate;
    const checkOut = typeof reservation.checkOutDate === "string"
      ? parseISO(reservation.checkOutDate)
      : reservation.checkOutDate;

    const daysDiff = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    occupiedDays += Math.max(0, daysDiff);
  });

  const rate = (occupiedDays / totalDays) * 100;
  return Math.min(100, Math.max(0, Math.round(rate * 100) / 100)); // Cap at 100%, round to 2 decimals
}

/**
 * Parse date range and return human-readable string
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  try {
    const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

    const startFormatted = format(start, "MMM dd");
    const endFormatted = format(end, "MMM dd, yyyy");

    // If same month and year, use shorter format
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${format(start, "MMM dd")} - ${format(end, "dd, yyyy")}`;
    }

    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    return "Invalid date range";
  }
}

/**
 * Get number of nights between two dates
 */
export function getNumberOfNights(startDate: Date | string, endDate: Date | string): number {
  try {
    const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return dateObj < new Date();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is upcoming (within next 7 days)
 */
export function isUpcoming(date: Date | string): boolean {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dateObj > today && dateObj <= nextWeek;
  } catch (error) {
    return false;
  }
}
