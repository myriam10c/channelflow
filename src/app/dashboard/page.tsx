'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Home,
  Calendar,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Users,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';

interface DashboardData {
  propertiesCount: number;
  activeReservations: number;
  occupancyRate: number;
  revenueThisMonth: number;
  unreadMessages: number;
  todayCheckIns: number;
  recentReservations: any[];
  recentActivity: any[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
}

function StatCard({ icon, label, value, change, unit }: StatCardProps) {
  const isPositive = change && change >= 0;

  return (
    <Card variant="default" hoverable className="flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-slate-800/50">{icon}</div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
      <p className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
      </p>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card variant="default">
      <div className="space-y-4">
        <div className="h-10 w-10 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord</h1>
          <p className="text-slate-400">Bienvenue dans votre espace de gestion de propriétés</p>
        </div>

        {/* Loading stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord</h1>
          <p className="text-slate-400">Bienvenue dans votre espace de gestion de propriétés</p>
        </div>
        <Card variant="default" className="flex items-center gap-3 border-red-500/30 bg-red-500/10">
          <AlertCircle className="text-red-400" size={24} />
          <div>
            <p className="text-red-300 font-medium">{error || 'Une erreur est survenue'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord</h1>
        <p className="text-slate-400">Bienvenue dans votre espace de gestion de propriétés</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Home className="text-blue-400" size={24} />}
          label="Total Propriétés"
          value={data.propertiesCount}
          change={12}
        />
        <StatCard
          icon={<Calendar className="text-purple-400" size={24} />}
          label="Réservations Actives"
          value={data.activeReservations}
          change={8}
        />
        <StatCard
          icon={<TrendingUp className="text-emerald-400" size={24} />}
          label="Taux d'Occupation"
          value={data.occupancyRate}
          unit="%"
          change={5}
        />
        <StatCard
          icon={<DollarSign className="text-amber-400" size={24} />}
          label="Revenus du Mois"
          value={`€${data.revenueThisMonth.toLocaleString('fr-FR')}`}
          change={15}
        />
        <StatCard
          icon={<MessageSquare className="text-cyan-400" size={24} />}
          label="Messages Non Lus"
          value={data.unreadMessages}
          change={-3}
        />
        <StatCard
          icon={<Users className="text-rose-400" size={24} />}
          label="Check-ins Aujourd'hui"
          value={data.todayCheckIns}
          change={2}
        />
      </div>

      {/* Recent Reservations */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Réservations Récentes</h2>
        {data.recentReservations && data.recentReservations.length > 0 ? (
          <Card variant="default" padding="lg">
            <Table>
              <thead>
                <tr>
                  <TableHeader>Invité</TableHeader>
                  <TableHeader>Propriété</TableHeader>
                  <TableHeader>Dates</TableHeader>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader align="right">Montant</TableHeader>
                </tr>
              </thead>
              <TableBody>
                {data.recentReservations.map((reservation) => (
                  <TableRow key={reservation.id} clickable>
                    <TableCell>
                      <span className="font-medium text-white">{reservation.guestName}</span>
                      <p className="text-xs text-slate-400">{reservation.guestEmail}</p>
                    </TableCell>
                    <TableCell>{reservation.property?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(reservation.checkIn), 'd MMM', { locale: fr })}
                        {' – '}
                        {format(new Date(reservation.checkOut), 'd MMM yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reservation.status === 'confirmed'
                            ? 'success'
                            : reservation.status === 'pending'
                              ? 'warning'
                              : reservation.status === 'cancelled'
                                ? 'danger'
                                : 'secondary'
                        }
                        size="sm"
                      >
                        {reservation.status === 'confirmed'
                          ? '✓ Confirmée'
                          : reservation.status === 'pending'
                            ? 'En attente'
                            : reservation.status === 'cancelled'
                              ? 'Annulée'
                              : 'Complétée'}
                      </Badge>
                    </TableCell>
                    <TableCell align="right" className="font-semibold text-emerald-400">
                      €{reservation.totalPrice.toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card variant="default" className="text-center py-8">
            <p className="text-slate-400">Aucune réservation récente</p>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Activité Récente</h2>
        {data.recentActivity && data.recentActivity.length > 0 ? (
          <Card variant="default" padding="lg">
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => {
                const isSuccess = activity.status === 'success';
                return (
                  <div
                    key={activity.id || index}
                    className="flex items-start gap-4 pb-4 border-b border-slate-800 last:border-b-0 last:pb-0"
                  >
                    <div className="mt-1">
                      {isSuccess ? (
                        <CheckCircle2 className="text-emerald-400" size={20} />
                      ) : activity.status === 'in_progress' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                      ) : (
                        <AlertCircle className="text-red-400" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Synchronisation {activity.syncType === 'reservations' ? 'réservations' : activity.syncType === 'calendar' ? 'calendrier' : activity.syncType === 'messages' ? 'messages' : 'autre'}
                        {activity.property && ` - ${activity.property.name}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {activity.channel && `Canal: ${activity.channel}`} • Éléments: {activity.itemsProcessed}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(activity.syncedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <Badge
                      variant={isSuccess ? 'success' : activity.status === 'in_progress' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {isSuccess ? 'Succès' : activity.status === 'in_progress' ? 'En cours' : 'Erreur'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card variant="default" className="text-center py-8">
            <p className="text-slate-400">Aucune activité récente</p>
          </Card>
        )}
      </div>
    </div>
  );
}
