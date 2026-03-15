'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Calendar,
  RefreshCw,
  Wifi,
  Wind,
  Waves,
  MapPin,
  Bed,
  Bath,
  Users,
  AlertCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface Property {
  id: string;
  name: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  status: 'active' | 'inactive' | 'maintenance';
  channels: string[];
  imageUrl?: string;
}

interface FormData {
  name: string;
  address: string;
  city: string;
  country: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  currency: string;
  status: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    city: '',
    country: '',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 0,
    currency: 'EUR',
    status: 'active',
  });

  useEffect(() => {
    fetchProperties();
  }, [searchTerm]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/properties', window.location.origin);
      if (searchTerm) url.searchParams.append('search', searchTerm);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch properties');

      const result = await response.json();
      setProperties(result.data || []);
      setError(null);
    } catch (err) {
      console.error('Properties error:', err);
      setError('Erreur lors du chargement des propriétés');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'bedrooms' || name === 'bathrooms' || name === 'maxGuests' || name === 'pricePerNight' ?
        (name === 'pricePerNight' ? parseFloat(value) : parseInt(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create property');

      setShowModal(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        country: '',
        description: '',
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        pricePerNight: 0,
        currency: 'EUR',
        status: 'active',
      });
      await fetchProperties();
    } catch (err) {
      console.error('Submit error:', err);
      setError('Erreur lors de la création de la propriété');
    } finally {
      setSubmitting(false);
    }
  };

  const getGradientBg = (index: number) => {
    const gradients = [
      'from-blue-600 to-blue-400',
      'from-purple-600 to-purple-400',
      'from-emerald-600 to-emerald-400',
      'from-amber-600 to-amber-400',
      'from-rose-600 to-rose-400',
      'from-cyan-600 to-cyan-400',
    ];
    return gradients[index % gradients.length];
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'airbnb':
        return <Wifi size={16} className="text-red-400" />;
      case 'booking':
        return <Wind size={16} className="text-yellow-400" />;
      case 'vrbo':
        return <Waves size={16} className="text-blue-400" />;
      default:
        return <MapPin size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Propriétés</h1>
          <p className="text-slate-400">Gérez vos propriétés de location</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={20} />}
          onClick={() => setShowModal(true)}
        >
          Ajouter une propriété
        </Button>
      </div>

      {/* Search Bar */}
      <Card variant="default" padding="md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom, adresse ou ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card variant="default" className="flex items-center gap-3 border-red-500/30 bg-red-500/10">
          <AlertCircle className="text-red-400" size={24} />
          <p className="text-red-300">{error}</p>
        </Card>
      )}

      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} variant="default" className="space-y-4">
              <div className={`h-40 bg-gradient-to-br ${getGradientBg(i)} rounded-lg animate-pulse`} />
              <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-800 rounded animate-pulse" />
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card variant="default" className="text-center py-12">
          <MapPin className="mx-auto mb-3 text-slate-400" size={48} />
          <p className="text-slate-400 mb-4">
            {searchTerm ? 'Aucune propriété trouvée' : 'Aucune propriété créée pour le moment'}
          </p>
          {!searchTerm && (
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
            >
              Créer votre première propriété
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property, index) => (
            <Card key={property.id} variant="default" hoverable className="flex flex-col overflow-hidden">
              {/* Image Placeholder */}
              <div
                className={`h-40 bg-gradient-to-br ${getGradientBg(index)} rounded-t-lg flex items-center justify-center`}
              >
                <MapPin className="text-white/50" size={48} />
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-white mb-1">{property.name}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <MapPin size={14} />
                    {property.city}, {property.country}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="mb-3">
                  <Badge
                    variant={
                      property.status === 'active'
                        ? 'success'
                        : property.status === 'maintenance'
                          ? 'warning'
                          : 'danger'
                    }
                    size="sm"
                    dotted
                  >
                    {property.status === 'active'
                      ? 'Actif'
                      : property.status === 'maintenance'
                        ? 'Maintenance'
                        : 'Inactif'}
                  </Badge>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-t border-b border-slate-700">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <Bed size={16} />
                    </div>
                    <p className="text-sm font-semibold text-white">{property.bedrooms}</p>
                    <p className="text-xs text-slate-400">Chambres</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <Bath size={16} />
                    </div>
                    <p className="text-sm font-semibold text-white">{property.bathrooms}</p>
                    <p className="text-xs text-slate-400">Salles</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <Users size={16} />
                    </div>
                    <p className="text-sm font-semibold text-white">{property.maxGuests}</p>
                    <p className="text-xs text-slate-400">Hôtes</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <p className="text-slate-400 text-xs mb-1">Prix par nuit</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    €{property.pricePerNight.toLocaleString('fr-FR')}
                  </p>
                </div>

                {/* Channels */}
                {property.channels && property.channels.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-xs mb-2">Canaux</p>
                    <div className="flex gap-2">
                      {property.channels.map((channel) => (
                        <div
                          key={channel}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-sm"
                        >
                          {getChannelIcon(channel)}
                          <span className="text-slate-300 capitalize">{channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-700">
                  <Link href={`/properties/${property.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" fullWidth icon={<Edit size={16} />}>
                      Éditer
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" icon={<Calendar size={16} />} title="Voir le calendrier" />
                  <Button variant="ghost" size="sm" icon={<RefreshCw size={16} />} title="RefreshCwhroniser" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ajouter une propriété"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nom de la propriété *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maison à la côte..."
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Adresse *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Rue de la Plage"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ville *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paris"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Pays *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="France"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Chambres *
              </label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Salles de bain *
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Max Guests */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nombre d'hôtes maximum *
              </label>
              <input
                type="number"
                name="maxGuests"
                value={formData.maxGuests}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Prix par nuit (€) *
              </label>
              <input
                type="number"
                name="pricePerNight"
                value={formData.pricePerNight}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Décrivez votre propriété..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Statut
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              Créer la propriété
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
