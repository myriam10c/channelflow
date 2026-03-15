'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isWithinInterval,
  isSameDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { Reservation, Property, CalendarEvent } from '@/types';

type ViewMode = 'month' | 'week';

interface ReservationBar {
  reservation: Reservation;
  startCol: number;
  spanCols: number;
}

interface CalendarData {
  reservations: Reservation[];
  properties: Property[];
  blockedDates: CalendarEvent[];
}

const CHANNEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  airbnb: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  booking: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  direct: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
  vrbo: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [data, setData] = useState<CalendarData>({
    reservations: [],
    properties: [],
    blockedDates: [],
  });
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRes, propsRes] = await Promise.all([
          fetch('/api/reservations'),
          fetch('/api/properties'),
        ]);

        const reservations = (await resRes.json()) as Reservation[];
        const properties = (await propsRes.json()) as Property[];

        // Convert date strings to Date objects
        const processedReservations = reservations.map((r) => ({
          ...r,
          checkInDate: new Date(r.checkInDate),
          checkOutDate: new Date(r.checkOutDate),
        }));

        setData({
          reservations: processedReservations,
          properties,
          blockedDates: [],
        });
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filter properties
  const displayProperties =
    selectedProperty === 'all'
      ? data.properties
      : data.properties.filter((p) => p.id === selectedProperty);

  // Get reservations for a property on specific date
  const getReservationsForPropertyDay = (propertyId: string, day: Date): Reservation[] => {
    return data.reservations.filter(
      (r) =>
        r.propertyId === propertyId &&
        isWithinInterval(day, {
          start: new Date(r.checkInDate),
          end: new Date(r.checkOutDate),
        })
    );
  };

  // Check if date is blocked
  const isDateBlocked = (propertyId: string, day: Date): boolean => {
    return data.blockedDates.some(
      (event) =>
        event.propertyId === propertyId &&
        isWithinInterval(day, {
          start: new Date(event.startDate),
          end: new Date(event.endDate),
        })
    );
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowReservationModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">Chargement du calendrier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Calendrier</h1>
        <p className="text-slate-400">Gérez la disponibilité de vos propriétés</p>
      </div>

      {/* Controls */}
      <Card variant="outlined" padding="md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Month Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevMonth}
              icon={<ChevronLeft size={16} />}
            >
              Précédent
            </Button>
            <div className="min-w-48 text-center">
              <h2 className="text-lg font-semibold text-slate-50">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextMonth}
              icon={<ChevronRight size={16} />}
              iconPosition="right"
            >
              Suivant
            </Button>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semaine
              </button>
            </div>

            {/* Property Filter */}
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les propriétés</option>
              {data.properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card variant="default" padding="lg">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-0 mb-4 border-b border-slate-700">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-sm font-semibold text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Properties and dates grid */}
            <div className="space-y-4">
              {displayProperties.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Aucune propriété disponible
                </div>
              ) : (
                displayProperties.map((property) => (
                  <div key={property.id} className="border-b border-slate-700 pb-4 last:border-b-0">
                    <div className="mb-2">
                      <h3 className="font-semibold text-slate-200">{property.name}</h3>
                      <p className="text-xs text-slate-400">{property.address}</p>
                    </div>

                    {/* Calendar grid for property */}
                    <div className="grid grid-cols-7 gap-0 bg-slate-800/30 rounded-lg overflow-hidden">
                      {daysInMonth.map((day, dayIndex) => {
                        const isCurrentMonth = isSameDay(day, currentDate);
                        const reservationsForDay = getReservationsForPropertyDay(
                          property.id,
                          day
                        );
                        const blocked = isDateBlocked(property.id, day);

                        return (
                          <div
                            key={dayIndex}
                            className={`aspect-square p-1 border border-slate-700/50 flex flex-col items-center justify-center text-xs relative group cursor-pointer hover:bg-slate-700/30 transition-colors ${
                              day.getMonth() !== currentDate.getMonth()
                                ? 'bg-slate-900/50 opacity-50'
                                : 'bg-slate-800/20'
                            } ${isCurrentMonth ? 'bg-blue-500/10' : ''} ${
                              blocked ? 'bg-gray-600/30' : ''
                            }`}
                            onClick={() => {
                              if (reservationsForDay.length > 0) {
                                handleReservationClick(reservationsForDay[0]);
                              }
                            }}
                          >
                            <span className="font-bold text-slate-300">
                              {format(day, 'd')}
                            </span>

                            {/* Reservation indicator */}
                            {reservationsForDay.length > 0 && (
                              <div className="absolute inset-0 rounded flex items-center justify-center">
                                <div
                                  className={`w-full h-full flex items-center justify-center rounded ${
                                    CHANNEL_COLORS[reservationsForDay[0].channel]?.bg
                                  } border ${CHANNEL_COLORS[reservationsForDay[0].channel]?.border}`}
                                  title={reservationsForDay[0].guestName}
                                >
                                  <span className="text-xs font-medium">●</span>
                                </div>
                              </div>
                            )}

                            {/* Blocked indicator */}
                            {blocked && !reservationsForDay.length && (
                              <div className="absolute inset-0 rounded bg-gray-600/20 border border-gray-600/30" />
                            )}

                            {/* Tooltip on hover */}
                            {reservationsForDay.length > 0 && (
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {reservationsForDay[0].guestName}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card variant="outlined" padding="md">
        <div className="flex flex-wrap gap-4">
          <div className="text-sm text-slate-400">Légende:</div>
          {Object.entries(CHANNEL_COLORS).map(([channel, colors]) => (
            <div key={channel} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`} />
              <span className="text-sm text-slate-400 capitalize">{channel}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-600/30 border border-gray-600/30" />
            <span className="text-sm text-slate-400">Bloqué</span>
          </div>
        </div>
      </Card>

      {/* Reservation Detail Modal */}
      <Modal
        isOpen={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setSelectedReservation(null);
        }}
        title="Détails de la réservation"
        size="md"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Client</p>
                <p className="font-semibold text-slate-200">{selectedReservation.guestName}</p>
                <p className="text-sm text-slate-400">{selectedReservation.guestEmail}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Propriété</p>
                <p className="font-semibold text-slate-200">
                  {data.properties.find((p) => p.id === selectedReservation.propertyId)?.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Arrivée</p>
                <p className="font-semibold text-slate-200">
                  {format(selectedReservation.checkInDate, 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Départ</p>
                <p className="font-semibold text-slate-200">
                  {format(selectedReservation.checkOutDate, 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Canal</p>
                <Badge variant="primary" size="sm" className="capitalize">
                  {selectedReservation.channel}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Statut</p>
                <Badge
                  variant={
                    selectedReservation.status === 'confirmed'
                      ? 'success'
                      : selectedReservation.status === 'pending'
                        ? 'warning'
                        : 'danger'
                  }
                  size="sm"
                >
                  {selectedReservation.status === 'confirmed'
                    ? 'Confirmée'
                    : selectedReservation.status === 'pending'
                      ? 'En attente'
                      : 'Annulée'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1">Montant total</p>
              <p className="text-lg font-bold text-slate-200">
                {selectedReservation.totalPrice.toFixed(2)}€
              </p>
            </div>

            {selectedReservation.notes && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{selectedReservation.notes}</p>
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowReservationModal(false);
              setSelectedReservation(null);
            }}
          >
            Fermer
          </Button>
          <Button variant="primary" size="sm">
            Éditer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
