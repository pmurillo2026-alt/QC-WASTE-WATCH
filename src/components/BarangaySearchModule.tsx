import React, { useState, useMemo } from 'react';
import { BarangaySchedule, ResidentUser, WasteNotification } from '../types';
import { 
  Search, 
  Bell, 
  BellRing, 
  Check, 
  AlertTriangle, 
  Clock, 
  Truck, 
  Filter, 
  Sparkles, 
  Calendar, 
  Info, 
  ShieldAlert, 
  MapPin, 
  X,
  Activity,
  Zap,
  Navigation
} from 'lucide-react';

interface BarangaySearchModuleProps {
  barangays: BarangaySchedule[];
  currentUser: ResidentUser;
  onToggleSubscription: (barangayId: string) => void;
  onTriggerNotification: (notification: Omit<WasteNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  onOpenTelemetry?: (barangayId: string) => void;
}

export function BarangaySearchModule({
  barangays,
  currentUser,
  onToggleSubscription,
  onTriggerNotification,
  onOpenTelemetry,
}: BarangaySearchModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELAYED' | 'SUBSCRIBED'>('ALL');

  // Filtered barangays
  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.subArea?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.zipCode.includes(searchQuery) ||
        b.wasteType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDistrict = selectedDistrict === 'ALL' || b.district === selectedDistrict;

      const isSubscribed = currentUser.subscribedBarangayIds.includes(b.id);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'DELAYED' && b.status === 'DELAYED') ||
        (statusFilter === 'SUBSCRIBED' && isSubscribed);

      return matchesSearch && matchesDistrict && matchesStatus;
    });
  }, [barangays, searchQuery, selectedDistrict, statusFilter, currentUser.subscribedBarangayIds]);

  const subscribedCount = currentUser.subscribedBarangayIds.length;

  const handleQuickAlertTest = (barangay: BarangaySchedule) => {
    if (barangay.status === 'DELAYED' && barangay.currentDelay) {
      onTriggerNotification({
        barangayId: barangay.id,
        barangayName: barangay.name,
        district: barangay.district,
        type: 'DELAY_ALERT',
        title: `⚠️ Collection Delayed: Brgy. ${barangay.name}`,
        scheduledDate: barangay.currentDelay.rescheduledDate,
        scheduledTime: barangay.currentDelay.rescheduledTime,
        causeOfDelay: barangay.currentDelay.cause,
        delayCategory: barangay.currentDelay.category,
        originalTime: barangay.currentDelay.originalTime,
        rescheduledDate: barangay.currentDelay.rescheduledDate,
        rescheduledTime: barangay.currentDelay.rescheduledTime,
        advisory: barangay.currentDelay.advisoryNote,
        severity: 'warning',
        telemetryDistanceKm: barangay.telemetry?.distanceRemainingKm,
        telemetryEtaFormatted: barangay.telemetry?.etaFormatted,
      });
    } else {
      onTriggerNotification({
        barangayId: barangay.id,
        barangayName: barangay.name,
        district: barangay.district,
        type: 'SCHEDULED_REMINDER',
        title: `🔔 Garbage Pickup Reminder: Brgy. ${barangay.name}`,
        scheduledDate: barangay.nextScheduledDate,
        scheduledTime: barangay.nextScheduledTime,
        advisory: `Assigned hauler: ${barangay.contractor} (${barangay.truckCode}). Distance: ${barangay.telemetry?.distanceRemainingKm || 1.8} km away. Please set out ${barangay.wasteType} before pickup starts.`,
        severity: 'normal',
        telemetryDistanceKm: barangay.telemetry?.distanceRemainingKm,
        telemetryEtaFormatted: barangay.telemetry?.etaFormatted,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Resident Subscription Overview */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-5 sm:p-6 shadow-md shadow-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-semibold backdrop-blur-xs mb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Resident: {currentUser.fullName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Quezon City Barangay Collection Directory
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl mt-1">
              Locate your barangay and tap the <strong className="text-white">“Notify”</strong> button to receive automatic push notifications for pickup times and real-time delay bulletins.
            </p>
          </div>

          {/* Subscribed count pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 text-center min-w-[170px] self-start md:self-auto">
            <div className="text-2xl font-black text-white">{subscribedCount}</div>
            <div className="text-xs font-medium text-emerald-200">
              {subscribedCount === 1 ? 'Subscribed Barangay' : 'Subscribed Barangays'}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Search Bar Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="barangay-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Quezon City barangay (e.g. Batasan Hills, Commonwealth, Cubao, Loyola Heights, UP Diliman)..."
            className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden transition-all placeholder:text-slate-400 text-slate-900 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* District Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              District:
            </span>
            {(['ALL', 1, 2, 3, 4, 5, 6] as const).map((dist) => (
              <button
                key={dist}
                onClick={() => setSelectedDistrict(dist)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedDistrict === dist
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dist === 'ALL' ? 'All QC (Districts 1-6)' : `Dist. ${dist}`}
              </button>
            ))}
          </div>

          {/* Quick status filters */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Barangays ({barangays.length})
            </button>
            <button
              onClick={() => setStatusFilter('DELAYED')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'DELAYED'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>With Delays ({barangays.filter((b) => b.status === 'DELAYED').length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('SUBSCRIBED')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'SUBSCRIBED'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Bell className="w-3 h-3" />
              <span>My Subscriptions ({subscribedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Result Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{filteredBarangays.length}</strong> of {barangays.length} Quezon City barangays
        </span>
        {searchQuery && (
          <span>
            Search query: &quot;{searchQuery}&quot; • <button onClick={() => setSearchQuery('')} className="text-emerald-700 hover:underline">Reset</button>
          </span>
        )}
      </div>

      {/* Barangays Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBarangays.map((b) => {
          const isSubscribed = currentUser.subscribedBarangayIds.includes(b.id);
          const isDelayed = b.status === 'DELAYED' && b.currentDelay;

          return (
            <div
              key={b.id}
              id={`card-${b.id}`}
              className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between ${
                isDelayed
                  ? 'border-amber-300 ring-2 ring-amber-50 shadow-md shadow-amber-500/5'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              } ${isSubscribed ? 'bg-gradient-to-b from-emerald-50/20 to-white' : ''}`}
            >
              <div>
                {/* Card Header: Barangay Name, District, and Notify Button */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        Brgy. {b.name}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        District {b.district} • ZIP {b.zipCode}
                      </span>
                    </div>
                    {b.subArea && (
                      <p className="text-xs text-slate-500 mt-0.5">{b.subArea}</p>
                    )}
                  </div>

                  {/* The NOTIFY subscription button beside the barangay name */}
                  <button
                    id={`notify-btn-${b.id}`}
                    type="button"
                    onClick={() => onToggleSubscription(b.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSubscribed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                    title={isSubscribed ? 'Click to opt out' : 'Click to opt in for alerts'}
                  >
                    {isSubscribed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Subscribed</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Notify</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="mb-3">
                  {isDelayed ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>COLLECTION DELAYED — Disruptive Weather / Obstacle</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>On Regular Schedule</span>
                    </div>
                  )}
                </div>

                {/* Schedule Details Grid */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Next Pickup:
                    </span>
                    <strong className="text-slate-900 font-bold">
                      {b.nextScheduledDate} • {b.nextScheduledTime}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Window:
                    </span>
                    <span className="font-semibold text-slate-800">{b.pickupWindow}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Waste Type:</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {b.wasteType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      Fleet Crew:
                    </span>
                    <span className="text-slate-600 font-mono text-[11px]">{b.truckCode}</span>
                  </div>
                </div>

                {/* Cause of Delay Warning Box (if delayed) */}
                {isDelayed && b.currentDelay && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                        Cause of Delay Note:
                      </span>
                      <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                        {b.currentDelay.category}
                      </span>
                    </div>

                    <p className="text-amber-950 font-medium leading-relaxed">
                      &ldquo;{b.currentDelay.cause}&rdquo;
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-amber-900/90 font-semibold border-t border-amber-200/60">
                      <span>Rescheduled to:</span>
                      <span className="bg-amber-100 px-2 py-0.5 rounded font-bold text-amber-950">
                        {b.currentDelay.rescheduledTime} ({b.currentDelay.rescheduledDate})
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-800/80 italic">
                      Advisory: {b.currentDelay.advisoryNote}
                    </p>
                  </div>
                )}

                {/* REAL-TIME TELEMETRY & SYNCHRONIZED ETA WIDGET */}
                {b.telemetry && (
                  <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-inner space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>EDGE TELEMETRY ETA</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {b.telemetry.edgeNode.edgeNodeId}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black font-mono text-white tracking-tight">
                          {b.telemetry.etaFormatted}
                        </span>
                        <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                          ({b.telemetry.distanceRemainingKm} km away)
                        </span>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        b.telemetry.dispatchPhase === 'REROUTED_DELAYED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {b.telemetry.speedKmh} km/h • {b.telemetry.headingLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                      <span className="truncate max-w-[190px]">
                        Corridor: <strong className="text-slate-300">{b.telemetry.impedance.corridorName}</strong>
                      </span>
                      {onOpenTelemetry && (
                        <button
                          type="button"
                          onClick={() => onOpenTelemetry(b.id)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Track HUD</span>
                          <Navigation className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Quick Alert Simulator for testing */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {isSubscribed ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Push alerts active for your mobile
                    </span>
                  ) : (
                    'Tap "Notify" to subscribe'
                  )}
                </span>

                <button
                  type="button"
                  id={`test-alert-${b.id}`}
                  onClick={() => handleQuickAlertTest(b)}
                  className="text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preview Alert</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBarangays.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No Quezon City barangay matched your search</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try searching for another barangay name such as Batasan Hills, Commonwealth, Holy Spirit, UP Diliman, or Cubao.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDistrict('ALL');
              setStatusFilter('ALL');
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
