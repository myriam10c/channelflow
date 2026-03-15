'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Edit2,
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import type { Reservation, Property } from '@/types';

type FilterStatus = 'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled';

const ITEMS_PER_PAGE = 10;

const CHANNEL_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'secondary'> =
  {
    airbnb: 'danger',
    booking: 'primary',
    direct: 'success',
    vrbo: 'secondary',
  };

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmée',
  pending: 'En attente',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_BADGE_VARIANTS: Record<
  string,
  'primary' | 'success' | 'warning' | 'danger' | 'secondary'
> = {
  confirmed: 'success',
  pending: 'warning',
  completed: 'primary',
  cancelled: 'danger',
};

interface ReservationFormData {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalPrice: number;
  channel: string;
  status: string;
  specialRequests: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    propertyId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
    totalPrice: 0,
    channel: 'direct',
    status: 'confirmed',
    specialRequests: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRes, propsRes] = await Promise.all([
          fetch('/api/reservations'),
          fetch('/api/properties'),
        ]);

        const resData = (await resRes.json());
        const propsResJson = (await propsRes.json());
        const propsData = propsResJson.data as Property[];

        // Convert date strings to Date objects and map checkIn/checkOut to checkInDate/checkOutDate
        const processedReservations = resData.data.map((r: any) => ({
          ...r,
          checkInDate: new Date(r.checkIn),
          checkOutDate: new Date(r.checkOut),
        }));

        setReservations(processedReservations);
        setProperties(propsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and search reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const matchesStatus =
        filterStatus === 'all' || res.status === filterStatus;
      const matchesSearch =
        res.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.guestEmail.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [reservations, filterStatus, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reservations.length;
    const confirmed = reservations.filter((r) => r.status === 'confirmed').length;
    const pending = reservations.filter((r) => r.status === 'pending').length;
    const completed = reservations.filter((r) => r.status === 'completed').length;
    const cancelled = reservations.filter((r) => r.status === 'cancelled').length;

    const totalRevenue = reservations
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const avgStayDays =
      reservations.length > 0
        ? reservations.reduce(
            (sum, r) =>
              sum +
              differenceInDays(new Date(r.checkOutDate), new Date(r.checkInDate)),
            0
          ) / reservations.length
        : 0;

    const cancellationRate =
      reservations.length > 0 ? ((cancelled / reservations.length) * 100).toFixed(1) : '0';

    return {
      total,
      confirmed,
      pending,
      completed,
      cancelled,
      totalRevenue,
      avgStayDays: avgStayDays.toFixed(1),
      cancellationRate,
    };
  }, [reservations]);

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || 'N/A';
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      propertyId: reservation.propertyId,
      guestName: reservation.guestName,
      guestEmail: reservation.guestEmail,
      guestPhone: reservation.guestPhone || '',
      checkIn: new Date(reservation.checkInDate).toISOString().split('T')[0],
      checkOut: new Date(reservation.checkOutDate).toISOString().split('T')[0],
      numberOfGuests: reservation.numberOfGuests,
      totalPrice: reservation.totalPrice || 0,
      channel: reservation.channel,
      status: reservation.status,
      specialRequests: reservation.specialRequests || '',
    });
    setEditingId(reservation.id);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleDelete = async (reservationId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete reservation');

      setReservations(reservations.filter(r => r.id !== reservationId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Erreur lors de la suppression de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['numberOfGuests', 'totalPrice'].includes(name)
        ? name === 'numberOfGuests'
          ? parseInt(value)
          : parseFloat(value)
        : value,
    });
  };

  const handleCreateReservation = async () => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          checkIn: new Date(formData.checkIn).toISOString(),
          checkOut: new Date(formData.checkOut).toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create reservation');

      const newResData = await response.json();
      const processedRes = {
        ...newResData.data,
        checkInDate: new Date(newResData.data.checkIn),
        checkOutDate: new Date(newResData.data.checkOut),
      };
      setReservations([processedRes, ...reservations]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Erreur lors de la création de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReservation = async () => {
    if (!editingId) return;
    try {
      setSubmitting(true);
      const response = await fetch(`/api/reservations/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          checkIn: new Date(formData.checkIn).toISOString(),
          checkOut: new Date(formData.checkOut).toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update reservation');

      const updatedResData = await response.json();
      const processedRes = {
        ...updatedResData.data,
        checkInDate: new Date(updatedResData.data.checkIn),
        checkOutDate: new Date(updatedResData.data.checkOut),
      };
      setReservations(reservations.map(r => r.id === editingId ? processedRes : r));
      setShowEditModal(false);
      resetForm();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Erreur lors de la mise à jour de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
      numberOfGuests: 1,
      totalPrice: 0,
      channel: 'direct',
      status: 'confirmed',
      specialRequests: '',
    });
  };

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'Toutes', value: 'all', count: stats.total },
    { label: 'Confirmées', value: 'confirmed', count: stats.confirmed },
    { label: 'En attente', value: 'pending', count: stats.pending },
    { label: 'Terminées', value: 'completed', count: stats.completed },
    { label: 'Annulées', value: 'cancelled', count: stats.cancelled },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">Chargement des réservations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Réservations</h1>
          <p className="text-slate-400">Gérez tous vos réservations</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={20} />}
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowCreateModal(true);
          }}
        >
          Nouvelle réservation
        </Button>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card variant="default" padding="md">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total réservations</p>
            <p className="text-2xl font-bold text-slate-50">{stats.total}</p>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Revenu total</p>
            <p className="text-2xl font-bold text-slate-50">{stats.totalRevenue.toFixed(2)}€</p>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Durée moy. séjour</p>
            <p className="text-2xl font-bold text-slate-50">{stats.avgStayDays} j</p>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Taux annulation</p>
            <p className="text-2xl font-bold text-slate-50">{stats.cancellationRate}%</p>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Confirmées</p>
            <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card variant="outlined" padding="md">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilterStatus(tab.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Search Bar */}
      <Card variant="outlined" padding="md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom de client ou email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* Reservations Table */}
      <Card variant="default" padding="lg">
        {paginatedReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="text-slate-400 mb-3" size={32} />
            <p className="text-slate-400">Aucune réservation trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table striped hoverable>
                <thead>
                  <tr>
                    <TableHeader>Client</TableHeader>
                    <TableHeader>Propriété</TableHeader>
                    <TableHeader>Canal</TableHeader>
                    <TableHeader>Arrivée</TableHeader>
                    <TableHeader>Départ</TableHeader>
                    <TableHeader align="center">Nuits</TableHeader>
                    <TableHeader align="right">Montant</TableHeader>
                    <TableHeader>Statut</TableHeader>
                    <TableHeader align="center">Actions</TableHeader>
                  </tr>
                </thead>
                <TableBody>
                  {paginatedReservations.map((reservation) => (
                    <TableRow key={reservation.id} clickable>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-200">
                            {reservation.guestName}
                          </p>
                          <p className="text-xs text-slate-400">{reservation.guestEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getPropertyName(reservation.propertyId)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            CHANNEL_COLORS[reservation.channel] || 'secondary'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {reservation.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(reservation.checkInDate, 'dd MMM', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {format(reservation.checkOutDate, 'dd MMM', { locale: fr })}
                      </TableCell>
                      <TableCell align="center">
                        {differenceInDays(
                          reservation.checkOutDate,
                          reservation.checkInDate
                        )}
                      </TableCell>
                      <TableCell align="right" className="font-semibold">
                        {reservation.totalPrice.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_BADGE_VARIANTS[reservation.status]}
                          size="sm"
                        >
                          {STATUS_LABELS[reservation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell align="center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewDetails(reservation)}
                            className="p-1.5 hover:bg-blue-600/20 rounded transition-colors text-slate-400 hover:text-blue-400"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(reservation)}
                            className="p-1.5 hover:bg-green-600/20 rounded transition-colors text-slate-400 hover:text-green-400"
                            title="Éditer"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(reservation.id)}
                            className="p-1.5 hover:bg-red-600/20 rounded transition-colors text-slate-400 hover:text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                  Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length)} sur{' '}
                  {filteredReservations.length} résultats
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    icon={<ChevronLeft size={16} />}
                  >
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    icon={<ChevronRight size={16} />}
                    iconPosition="right"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedReservation(null);
        }}
        title="Détails de la réservation"
        size="md"
      >
        {selectedReservation && (
          <div className="space-y-6">
            {/* Guest Info */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Informations client</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-400">Nom</p>
                  <p className="text-sm text-slate-200">{selectedReservation.guestName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm text-slate-200">{selectedReservation.guestEmail}</p>
                </div>
                {selectedReservation.guestPhone && (
                  <div>
                    <p className="text-xs text-slate-400">Téléphone</p>
                    <p className="text-sm text-slate-200">{selectedReservation.guestPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Nombre de personnes</p>
                  <p className="text-sm text-slate-200">{selectedReservation.numberOfGuests}</p>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Informations séjour</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Propriété</p>
                  <p className="text-sm text-slate-200">
                    {getPropertyName(selectedReservation.propertyId)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Canal</p>
                  <Badge
                    variant={CHANNEL_COLORS[selectedReservation.channel] || 'secondary'}
                    size="sm"
                    className="capitalize inline-block"
                  >
                    {selectedReservation.channel}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-400">Arrivée</p>
                  <p className="text-sm text-slate-200">
                    {format(selectedReservation.checkInDate, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Départ</p>
                  <p className="text-sm text-slate-200">
                    {format(selectedReservation.checkOutDate, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-400">Nombre de nuits</p>
                <p className="text-sm font-medium text-slate-200">
                  {differenceInDays(
                    selectedReservation.checkOutDate,
                    selectedReservation.checkInDate
                  )}{' '}
                  nuit(s)
                </p>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Tarification</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Montant total</p>
                <p className="text-lg font-bold text-slate-200">
                  {selectedReservation.totalPrice.toFixed(2)}€
                </p>
              </div>
            </div>

            {/* Status and Notes */}
            <div>
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Statut</p>
                <Badge
                  variant={STATUS_BADGE_VARIANTS[selectedReservation.status]}
                  size="md"
                  className="inline-block"
                >
                  {STATUS_LABELS[selectedReservation.status]}
                </Badge>
              </div>

              {selectedReservation.notes && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Notes</p>
                  <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded">
                    {selectedReservation.notes}
                  </p>
                </div>
              )}

              {selectedReservation.specialRequests && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Demandes spéciales</p>
                  <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded">
                    {selectedReservation.specialRequests}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2 justify-end border-t border-slate-700 pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowDetailModal(false);
              setSelectedReservation(null);
            }}
          >
            Fermer
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (selectedReservation) {
                handleEdit(selectedReservation);
              }
            }}
          >
            Éditer la réservation
          </Button>
        </div>
      </Modal>

      {/* Create/Edit Reservation Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
          setEditingId(null);
        }}
        title={editingId ? 'Modifier la réservation' : 'Nouvelle réservation'}
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Propriété *
              </label>
              <select
                name="propertyId"
                value={formData.propertyId}
                onChange={handleFormChange}
                required
                disabled={!!editingId}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Sélectionner une propriété</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Guest Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nom du client *
              </label>
              <input
                type="text"
                name="guestName"
                value={formData.guestName}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jean Dupont"
              />
            </div>

            {/* Guest Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email *
              </label>
              <input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jean@example.com"
              />
            </div>

            {/* Guest Phone */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="guestPhone"
                value={formData.guestPhone}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {/* Check-in */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Arrivée *
              </label>
              <input
                type="date"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Check-out */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Départ *
              </label>
              <input
                type="date"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Number of Guests */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nombre de clients *
              </label>
              <input
                type="number"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={handleFormChange}
                required
                min="1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Total Price */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Prix total €
              </label>
              <input
                type="number"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Canal
              </label>
              <select
                name="channel"
                value={formData.channel}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="direct">Direct</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking">Booking.com</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Demandes spéciales
            </label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleFormChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Notes spéciales pour cette réservation..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
                setEditingId(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={submitting}
              onClick={editingId ? handleEditReservation : handleCreateReservation}
            >
              {editingId ? 'Mettre à jour' : 'Créer la réservation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Supprimer la réservation"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-slate-300">
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
            </p>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                loading={submitting}
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
