'use client';

import { useState, useEffect } from 'react';
import { Settings, AlertCircle, CheckCircle, RefreshCw, Key, Bell, Database, Globe } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SyncLogEntry {
  id: string;
  propertyId?: string;
  propertyName?: string;
  channel: string;
  syncType: string;
  status: 'success' | 'failed' | 'in_progress';
  itemsProcessed: number;
  itemsSkipped?: number;
  itemsErrored?: number;
  message?: string;
  syncedAt: Date;
}

type TabType = 'general' | 'integrations' | 'notifications' | 'sync';

const TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
];

const CURRENCIES = [
  'EUR',
  'USD',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'CNY',
];

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);

  // General Settings State
  const [appName, setAppName] = useState('ChannelFlow');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [currency, setCurrency] = useState('EUR');
  const [language, setLanguage] = useState('fr');

  // Integrations State
  const [airbnbConnected, setAirbnbConnected] = useState(false);
  const [airbnbClientId, setAirbnbClientId] = useState('');
  const [airbnbClientSecret, setAirbnbClientSecret] = useState('');

  // Notifications State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newMessageNotifications, setNewMessageNotifications] = useState(true);
  const [checkInReminder, setCheckInReminder] = useState(true);
  const [syncAlerts, setSyncAlerts] = useState(true);

  // Sync State
  const [autoSyncInterval, setAutoSyncInterval] = useState('15');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setAppName(data.appName || 'ChannelFlow');
          setTimezone(data.timezone || 'Europe/Paris');
          setCurrency(data.currency || 'EUR');
          setLanguage(data.language || 'fr');
          setAirbnbConnected(data.airbnbConnected || false);
          setEmailNotifications(data.emailNotifications !== false);
          setNewMessageNotifications(data.newMessageNotifications !== false);
          setCheckInReminder(data.checkInReminder !== false);
          setSyncAlerts(data.syncAlerts !== false);
          setAutoSyncInterval(data.autoSyncInterval || '15');
          if (data.lastSync) setLastSync(new Date(data.lastSync));

          // Load sync logs
          const logsResponse = await fetch('/api/settings/sync-logs');
          if (logsResponse.ok) {
            const logs = await logsResponse.json();
            setSyncLogs(logs.syncLogs || []);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings
  const handleSaveSettings = async (settings: Record<string, any>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Show success message (could be a toast)
        console.log('Paramètres sauvegardés');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  // Connect Airbnb
  const handleAirbnbConnect = async () => {
    if (!airbnbClientId || !airbnbClientSecret) {
      alert('Veuillez entrer les identifiants Airbnb');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/integrations/airbnb/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: airbnbClientId,
          clientSecret: airbnbClientSecret,
        }),
      });

      if (response.ok) {
        setAirbnbConnected(true);
        setAirbnbClientSecret('');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion Airbnb:', error);
    } finally {
      setSaving(false);
    }
  };

  // Disconnect Airbnb
  const handleAirbnbDisconnect = async () => {
    if (confirm('Êtes-vous sûr de vouloir déconnecter Airbnb?')) {
      try {
        setSaving(true);
        await fetch('/api/integrations/airbnb/disconnect', { method: 'POST' });
        setAirbnbConnected(false);
        setAirbnbClientId('');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  // Manual sync
  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/sync/manual', { method: 'POST' });
      if (response.ok) {
        setLastSync(new Date());
        // Refresh logs
        const logsResponse = await fetch('/api/settings/sync-logs');
        if (logsResponse.ok) {
          const logs = await logsResponse.json();
          setSyncLogs(logs.syncLogs || []);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {[
          { id: 'general', label: 'Général', icon: Globe },
          { id: 'integrations', label: 'Intégrations', icon: Key },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'sync', label: 'Synchronisation', icon: Database },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-600 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl">
            <Card padding="lg">
              <h2 className="text-xl font-semibold mb-4">Paramètres généraux</h2>
              <div className="space-y-4">
                {/* App Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom de l'application
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fuseau horaire
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz} className="bg-slate-900">
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Devise par défaut
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr} className="bg-slate-900">
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Langue
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LANGUAGES.map(({ code, label }) => (
                      <option key={code} value={code} className="bg-slate-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save Button */}
                <Button
                  onClick={() =>
                    handleSaveSettings({
                      appName,
                      timezone,
                      currency,
                      language,
                    })
                  }
                  disabled={saving}
                  loading={saving}
                >
                  Enregistrer
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <div className="space-y-6 max-w-2xl">
            {/* Airbnb */}
            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Airbnb</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Connectez votre compte Airbnb pour synchroniser les réservations et les messages
                  </p>
                </div>
                {airbnbConnected && (
                  <Badge variant="success" dotted>
                    Connecté
                  </Badge>
                )}
              </div>

              {!airbnbConnected ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={airbnbClientId}
                      onChange={(e) => setAirbnbClientId(e.target.value)}
                      placeholder="Votre Client ID Airbnb"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={airbnbClientSecret}
                      onChange={(e) => setAirbnbClientSecret(e.target.value)}
                      placeholder="Votre Client Secret Airbnb"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    onClick={handleAirbnbConnect}
                    disabled={saving}
                    loading={saving}
                  >
                    Connecter Airbnb
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleAirbnbDisconnect}
                  disabled={saving}
                  loading={saving}
                  variant="danger"
                >
                  Déconnecter
                </Button>
              )}
            </Card>

            {/* Booking.com */}
            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    Booking.com
                    <Badge variant="warning" size="sm">
                      Bientôt
                    </Badge>
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Support pour Booking.com à venir
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm">
                Cette intégration sera disponible prochainement
              </div>
            </Card>

            {/* VRBO */}
            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    VRBO
                    <Badge variant="warning" size="sm">
                      Bientôt
                    </Badge>
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Support pour VRBO à venir
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm">
                Cette intégration sera disponible prochainement
              </div>
            </Card>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-2xl">
            <Card padding="lg">
              <h2 className="text-xl font-semibold mb-6">Préférences de notification</h2>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-100">Notifications par email</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Recevoir les notifications par email
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      emailNotifications ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        emailNotifications ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* New Message Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-100">Nouveaux messages</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Notifier pour chaque nouveau message
                    </p>
                  </div>
                  <button
                    onClick={() => setNewMessageNotifications(!newMessageNotifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      newMessageNotifications ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        newMessageNotifications ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Check-in Reminder */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-100">Rappel d'arrivée</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Rappel 24h avant l'arrivée d'un guest
                    </p>
                  </div>
                  <button
                    onClick={() => setCheckInReminder(!checkInReminder)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      checkInReminder ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        checkInReminder ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Sync Alerts */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-100">Alertes de synchronisation</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Notifier en cas d'erreur de synchronisation
                    </p>
                  </div>
                  <button
                    onClick={() => setSyncAlerts(!syncAlerts)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      syncAlerts ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        syncAlerts ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <Button
                  onClick={() =>
                    handleSaveSettings({
                      emailNotifications,
                      newMessageNotifications,
                      checkInReminder,
                      syncAlerts,
                    })
                  }
                  disabled={saving}
                  loading={saving}
                >
                  Enregistrer
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Synchronization */}
        {activeTab === 'sync' && (
          <div className="space-y-6 max-w-4xl">
            {/* Sync Settings */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold mb-4">Paramètres de synchronisation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Intervalle de synchronisation automatique (minutes)
                  </label>
                  <input
                    type="number"
                    value={autoSyncInterval}
                    onChange={(e) => setAutoSyncInterval(e.target.value)}
                    min="5"
                    max="1440"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <h3 className="font-medium text-slate-100">Dernière synchronisation</h3>
                    {lastSync ? (
                      <p className="text-sm text-slate-400 mt-1">
                        {formatDistanceToNow(lastSync, { locale: fr, addSuffix: true })}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 mt-1">Jamais</p>
                    )}
                  </div>
                  <Button
                    onClick={handleManualSync}
                    disabled={syncing}
                    loading={syncing}
                    icon={<RefreshCw className="w-4 h-4" />}
                    size="sm"
                  >
                    Synchroniser
                  </Button>
                </div>

                <Button
                  onClick={() =>
                    handleSaveSettings({
                      autoSyncInterval,
                    })
                  }
                  disabled={saving}
                  loading={saving}
                >
                  Enregistrer
                </Button>
              </div>
            </Card>

            {/* Sync Logs */}
            <Card padding="lg">
              <h2 className="text-xl font-semibold mb-4">Historique de synchronisation</h2>
              {syncLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Aucun historique de synchronisation
                </div>
              ) : (
                <Table striped>
                  <thead>
                    <tr>
                      <TableHeader>Propriété</TableHeader>
                      <TableHeader>Canal</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Statut</TableHeader>
                      <TableHeader>Éléments</TableHeader>
                      <TableHeader>Date</TableHeader>
                    </tr>
                  </thead>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.propertyName || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.channel === 'airbnb'
                                ? 'primary'
                                : log.channel === 'booking'
                                  ? 'secondary'
                                  : 'warning'
                            }
                            size="sm"
                          >
                            {log.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {log.syncType}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.status === 'success' && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400">Réussi</span>
                              </>
                            )}
                            {log.status === 'failed' && (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-red-400">Échoué</span>
                              </>
                            )}
                            {log.status === 'in_progress' && (
                              <>
                                <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                                <span className="text-sm text-yellow-400">En cours</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex gap-2">
                            <span className="text-slate-300">{log.itemsProcessed}</span>
                            {log.itemsSkipped ? (
                              <span className="text-yellow-400">+{log.itemsSkipped} ignorés</span>
                            ) : null}
                            {log.itemsErrored ? (
                              <span className="text-red-400">+{log.itemsErrored} erreurs</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(log.syncedAt), {
                            locale: fr,
                            addSuffix: true,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
