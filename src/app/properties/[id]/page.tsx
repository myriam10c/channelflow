'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Home,
  MapPin,
  Bed,
  Bath,
  Users,
  DollarSign,
  Copy,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wifi,
  Wind,
  Waves,
} from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';

interface PropertyDetail {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  currency: string;
  status: 'active' | 'inactive' | 'maintenance';
  amenities?: string[];
  channels?: string[];
  airbnbListingId?: string;
  airbnbIcalUrl?: string;
  createdAt: string;
  reservations?: any[];
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'calendar' | 'reservations' | 'settings'>('details');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) throw new Error('Property not found');

      const result = await response.json();
      setProperty(result.data);
      setError(null);
    } catch (err) {
      console.error('Property error:', err);
      setError('Erreur lors du chargement de la propriété');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="ghost" size="md" icon={<ArrowLeft size={20} />} />
          </Link>
          <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="space-y-6">
        <Link href="/properties">
          <Button variant="ghost" size="md" icon={<ArrowLeft size={20} />}>
            Retour aux propriétés
          </Button>
        </Link>
        <Card variant="default" className="flex items-center gap-3 border-red-500/30 bg-red-500/10">
          <AlertCircle className="text-red-400" size={24} />
          <p className="text-red-300">{error || 'Propriété introuvable'}</p>
        </Card>
      </div>
    );
  }

  const amenitiesList = Array.isArray(property.amenities)
    ? property.amenities
    : property.amenities
      ? JSON.parse(property.amenities)
      : [];

  const channels = Array.isArray(property.channels)
    ? property.channels
    : property.channels
      ? JSON.parse(property.channels)
      : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/properties">
            <Button variant="ghost" size="md" icon={<ArrowLeft size={20} />} />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{property.name}</h1>
              <Badge
                variant={
                  property.status === 'active'
                    ? 'success'
                    : property.status === 'maintenance'
                      ? 'warning'
                      : 'danger'
                }
                dotted
              >
                {property.status === 'active'
                  ? 'Actif'
                  : property.status === 'maintenance'
                    ? 'Maintenance'
                    : 'Inactif'}
              </Badge>
            </div>
            <p className="text-slate-400 flex items-center gap-1">
              <MapPin size={16} />
              {property.address}, {property.city}, {property.country}
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" icon={<Edit size={20} />}>
          Modifier
        </Button>
      </div>

      {/* Property Image Placeholder */}
      <Card variant="default" padding="lg" className="h-80 bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
        <Home className="text-white/50" size={80} />
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800">
        {['details', 'calendar', 'reservations', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {tab === 'details'
              ? 'Détails'
              : tab === 'calendar'
                ? 'Calendrier'
                : tab === 'reservations'
                  ? 'Réservations'
                  : 'Paramètres'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {property.description && (
              <Card variant="default">
                <h2 className="text-lg font-bold text-white mb-3">À propos</h2>
                <p className="text-slate-300 leading-relaxed">{property.description}</p>
              </Card>
            )}

            {/* Features Grid */}
            <Card variant="default">
              <h2 className="text-lg font-bold text-white mb-4">Caractéristiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                    <Bed size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{property.bedrooms}</p>
                  <p className="text-xs text-slate-400 mt-1">Chambres</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                    <Bath size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{property.bathrooms}</p>
                  <p className="text-xs text-slate-400 mt-1">Salles de bain</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                    <Users size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{property.maxGuests}</p>
                  <p className="text-xs text-slate-400 mt-1">Hôtes max</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                    <DollarSign size={20} />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    €{property.pricePerNight.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Par nuit</p>
                </div>
              </div>
            </Card>

            {/* Amenities */}
            {amenitiesList.length > 0 && (
              <Card variant="default">
                <h2 className="text-lg font-bold text-white mb-4">Équipements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-800/30">
                      <CheckCircle2 className="text-emerald-400" size={16} />
                      <span className="text-slate-300 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Channels */}
            <Card variant="default">
              <h3 className="text-lg font-bold text-white mb-3">Canaux de distribution</h3>
              <div className="space-y-2">
                {channels.map((channel: string) => (
                  <div
                    key={channel}
                    className="flex items-center gap-2 p-2 rounded bg-slate-800/30"
                  >
                    {channel === 'airbnb' && <Wifi className="text-red-400" size={18} />}
                    {channel === 'booking' && <Wind className="text-yellow-400" size={18} />}
                    {channel === 'vrbo' && <Waves className="text-blue-400" size={18} />}
                    <span className="text-white font-medium capitalize">{channel}</span>
                    <Badge variant="success" size="sm" className="ml-auto">
                      Connecté
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Info */}
            <Card variant="default">
              <h3 className="text-lg font-bold text-white mb-3">Informations</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Créée le</p>
                  <p className="text-white">
                    {format(new Date(property.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Devise</p>
                  <p className="text-white">{property.currency}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <Card variant="default" className="text-center py-12">
          <Calendar className="mx-auto mb-3 text-slate-400" size={48} />
          <p className="text-slate-400 mb-4">Vue calendrier disponible bientôt</p>
          <p className="text-slate-500 text-sm">
            Consultez le calendrier pour visualiser les disponibilités et les réservations
          </p>
        </Card>
      )}

      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {property.reservations && property.reservations.length > 0 ? (
            <Card variant="default" padding="lg">
              <h2 className="text-lg font-bold text-white mb-4">Réservations récentes</h2>
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Invité</TableHeader>
                    <TableHeader>Dates</TableHeader>
                    <TableHeader>Statut</TableHeader>
                    <TableHeader align="right">Montant</TableHeader>
                  </tr>
                </thead>
                <TableBody>
                  {property.reservations.map((res) => (
                    <TableRow key={res.id} clickable>
                      <TableCell>
                        <span className="font-medium text-white">{res.guestName}</span>
                        <p className="text-xs text-slate-400">{res.guestEmail}</p>
                      </TableCell>
                      <TableCell>
                        {format(new Date(res.checkIn), 'd MMM', { locale: fr })} –{' '}
                        {format(new Date(res.checkOut), 'd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={res.status === 'confirmed' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {res.status === 'confirmed' ? 'Confirmée' : 'En attente'}
                        </Badge>
                      </TableCell>
                      <TableCell align="right" className="font-semibold text-emerald-400">
                        €{res.totalPrice.toLocaleString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card variant="default" className="text-center py-12">
              <Calendar className="mx-auto mb-3 text-slate-400" size={48} />
              <p className="text-slate-400">Aucune réservation pour cette propriété</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Airbnb Settings */}
          <Card variant="default">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wifi className="text-red-400" size={24} />
              Paramètres Airbnb
            </h2>

            <div className="space-y-4">
              {/* Listing ID */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  ID d'annonce Airbnb
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={property.airbnbListingId || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400"
                  />
                  {property.airbnbListingId && (
                    <Button
                      variant="secondary"
                      size="md"
                      icon={<Copy size={18} />}
                      onClick={() => copyToClipboard(property.airbnbListingId!)}
                      title={copied ? 'Copié!' : 'Copier'}
                    />
                  )}
                </div>
              </div>

              {/* iCal URL */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  URL iCal Airbnb
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={property.airbnbIcalUrl || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-xs truncate"
                  />
                  {property.airbnbIcalUrl && (
                    <Button
                      variant="secondary"
                      size="md"
                      icon={<Copy size={18} />}
                      onClick={() => copyToClipboard(property.airbnbIcalUrl!)}
                      title={copied ? 'Copié!' : 'Copier'}
                    />
                  )}
                </div>
              </div>

              {/* Sync Status */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Statut de synchronisation
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                  <CheckCircle2 className="text-emerald-400" size={20} />
                  <div>
                    <p className="text-white font-medium">Synchronisé</p>
                    <p className="text-xs text-slate-400">Dernière sync: il y a 2 heures</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={<Wifi size={16} />} className="ml-auto">
                    Resynchroniser
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Other Channels */}
          <Card variant="default">
            <h2 className="text-lg font-bold text-white mb-4">Autres canaux</h2>
            <p className="text-slate-400 text-sm mb-4">
              Configurez la synchronisation pour d'autres plateformes de location
            </p>
            <div className="space-y-3">
              {['booking', 'vrbo'].map((channel) => (
                <div key={channel} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {channel === 'booking' && <Wind className="text-yellow-400" size={20} />}
                    {channel === 'vrbo' && <Waves className="text-blue-400" size={20} />}
                    <span className="font-medium text-white capitalize">{channel}</span>
                  </div>
                  <Badge variant="secondary" size="sm">
                    Configurer
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
