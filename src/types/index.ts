// Reservation Status Type
export type ReservationStatus = "confirmed" | "pending" | "cancelled" | "completed";

// Channel Type
export type Channel = "airbnb" | "booking" | "direct" | "vrbo";

// Property Status Type
export type PropertyStatus = "active" | "inactive" | "maintenance";

/**
 * Property interface representing a rental property
 */
export interface Property {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  currency: string; // ISO 4217 code (USD, EUR, etc.)
  status: PropertyStatus;
  channels: Channel[];
  amenities?: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reservation interface representing a booking
 */
export interface Reservation {
  id: string;
  propertyId: string;
  property?: Property;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: ReservationStatus;
  channel: Channel;
  channelReservationId: string; // ID from the channel (Airbnb ID, Booking.com ID, etc.)
  notes?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message interface for guest communication
 */
export interface Message {
  id: string;
  reservationId: string;
  reservation?: Reservation;
  sender: "guest" | "host";
  content: string;
  channel: Channel;
  channelMessageId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calendar Event interface for property availability
 */
export interface CalendarEvent {
  id: string;
  propertyId: string;
  property?: Property;
  reservationId?: string;
  reservation?: Reservation;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  eventType: "booking" | "blocked" | "maintenance" | "custom";
  channel?: Channel;
  channelEventId?: string;
  isAllDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync Log interface for tracking synchronization events
 */
export interface SyncLog {
  id: string;
  propertyId?: string;
  property?: Property;
  channel: Channel;
  syncType: "reservations" | "calendar" | "messages" | "prices" | "availability";
  status: "success" | "failed" | "in_progress";
  message?: string;
  itemsProcessed: number;
  itemsSkipped?: number;
  itemsErrored?: number;
  syncedAt: Date;
  nextSyncAt?: Date;
  createdAt: Date;
}

/**
 * Dashboard Statistics interface
 */
export interface DashboardStats {
  totalProperties: number;
  totalReservations: number;
  occupancyRate: number; // percentage (0-100)
  totalRevenue: number;
  currencyCode: string;
  pendingMessages: number;
  upcomingCheckIns: number;
  revenueByChannel?: {
    [key in Channel]?: number;
  };
  reservationsByStatus?: {
    [key in ReservationStatus]?: number;
  };
}
