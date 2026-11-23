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
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Wifi, 
  Radio, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface ResidentDashboardProps {
  currentUser: ResidentUser;
  barangays: BarangaySchedule[];
  notifications: WasteNotification[];
  onToggleSubscription: (barangayId: string) => void;
  onSelectNotification: (notif: WasteNotification) => void;
  isSseConnected: boolean;
}

export function ResidentDashboard({
  currentUser,
  barangays,
  notifications,
  onToggleSubscription,
  onSelectNotification,
  isSseConnected,
}: ResidentDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'schedules' | 'delays'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<number | 'ALL'>('ALL');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'ALL' | 'SUBSCRIBED'>('ALL');

  // Filtered barangays for the read-only directory and schedule matrix
  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.subArea?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.zipCode.includes(searchQuery) ||
        b.wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.truckCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDistrict = selectedDistrict === 'ALL' || b.district === selectedDistrict;
      const isSubscribed = currentUser.subscribedBarangayIds.includes(b.id);
      const matchesSub = subscriptionFilter === 'ALL' || isSubscribed;

      return matchesSearch && matchesDistrict && matchesSub;
    });
  }, [barangays, searchQuery, selectedDistrict, subscriptionFilter, currentUser.subscribedBarangayIds]);

  // Delayed advisory feed filtered for residents
  const delayedBarangays = useMemo(() => {
    return barangays.filter((b) => b.status === 'DELAYED' && b.currentDelay);
  }, [barangays]);

  // Filtered notifications matching resident's subscriptions (pub/sub filtering)
  const residentNotifications = useMemo(() => {
    return notifications.filter(
      (n) =>
        currentUser.subscribedBarangayIds.includes(n.barangayId) ||
        currentUser.homeBarangayId === n.barangayId ||
        n.isSlaBreach // SLA threshold breaches are broadcast to affected sector
    );
  }, [notifications, currentUser.subscribedBarangayIds, currentUser.homeBarangayId]);

  const subscribedCount = currentUser.subscribedBarangayIds.length;
  const homeBarangay = barangays.find((b) => b.id === currentUser.homeBarangayId);

  return (
    <div className="space-y-6">
      {/* 1. RESIDENT IDENTITY & REAL-TIME STATUS BAR */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-semibold backdrop-blur-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                Resident: {currentUser.fullName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 text-slate-200 text-xs font-mono">
                Home: Brgy. {homeBarangay?.name || 'Quezon City'}
              </span>
              {/* Real-Time SSE Listener Status */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                isSseConnected ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40' : 'bg-amber-400/20 text-amber-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isSseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isSseConnected ? 'Live Alerts: Connected' : 'Offline Mode'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Quezon City Garbage Collection Schedule
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Check pickup days, see when garbage trucks arrive, and receive alerts if collection is delayed due to weather or traffic.
            </p>
          </div>

          {/* Quick subscription count indicator */}
          <div className="flex items-center gap-3 bg-emerald-950/50 p-3 rounded-xl border border-emerald-600/40 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-200 font-medium">My Saved Barangays</div>
              <div className="text-lg font-black text-white">{subscribedCount} Barangays</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'directory'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Barangay List</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'schedules'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Pickup Schedules</span>
          </button>

          <button
            onClick={() => setActiveSubTab('delays')}
            className={`relative px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'delays'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Delays & Advisories</span>
            {delayedBarangays.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {delayedBarangays.length}
              </span>
            )}
          </button>
        </div>

        {/* Live Filter by Subscriptions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubscriptionFilter(subscriptionFilter === 'ALL' ? 'SUBSCRIBED' : 'ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              subscriptionFilter === 'SUBSCRIBED'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{subscriptionFilter === 'SUBSCRIBED' ? 'Showing My Barangays' : 'Filter: My Barangays'}</span>
          </button>
        </div>
      </div>

      {/* 3. VIEW TAB 1: READ-ONLY BARANGAY DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & District Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search barangay name, street, or truck..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                District:
              </span>
              {(['ALL', 1, 2, 3, 4, 5, 6] as const).map((dist) => (
                <button
                  key={dist}
                  onClick={() => setSelectedDistrict(dist)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedDistrict === dist
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dist === 'ALL' ? 'All' : `D${dist}`}
                </button>
              ))}
            </div>
          </div>

          {/* Barangay Corridor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBarangays.map((b) => {
              const isSubscribed = currentUser.subscribedBarangayIds.includes(b.id);
              const isDelayed = b.status === 'DELAYED' && b.currentDelay;
              const isHome = b.id === currentUser.homeBarangayId;

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    isDelayed
                      ? 'border-amber-300 ring-2 ring-amber-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  } ${isSubscribed ? 'bg-gradient-to-b from-emerald-50/20 to-white' : ''}`}
                >
                  <div className="space-y-3">
                    {/* Header: Name, District, and Subscription Action */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            Brgy. {b.name}
                          </h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            District {b.district} • ZIP {b.zipCode}
                          </span>
                          {isHome && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Home Barangay
                            </span>
                          )}
                        </div>
                        {b.subArea && (
                          <p className="text-xs text-slate-500 mt-0.5">{b.subArea}</p>
                        )}
                      </div>

                      {/* One-click Pub/Sub Subscription Toggle Button */}
                      <button
                        type="button"
                        onClick={() => onToggleSubscription(b.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSubscribed
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                        title={isSubscribed ? 'Click to unsubscribe' : 'Click to subscribe for real-time alerts'}
                      >
                        {isSubscribed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Subscribed</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Subscribe</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isDelayed ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>PICKUP DELAYED — See Announcement</span>
                        </div>
                      ) : b.status === 'IN_PROGRESS' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-300 text-cyan-900 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
                          <span>TRUCK IS HERE — Collecting Now</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span>On Schedule</span>
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
                          Pickup Window:
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
                          Truck / Contractor:
                        </span>
                        <span className="text-slate-700 font-mono text-[11px]">
                          {b.contractor} ({b.truckCode})
                        </span>
                      </div>
                    </div>

                    {/* Cause of Delay Note (if delayed) */}
                    {isDelayed && b.currentDelay && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-amber-900">
                          <span className="flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                            Reason for Delay:
                          </span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                            {b.currentDelay.category}
                          </span>
                        </div>
                        <p className="text-amber-950 font-medium leading-relaxed">
                          &ldquo;{b.currentDelay.cause}&rdquo;
                        </p>
                        <div className="text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 font-semibold flex items-center justify-between">
                          <span>New Pickup Time:</span>
                          <span className="bg-amber-100 px-2 py-0.5 rounded font-bold">
                            {b.currentDelay.rescheduledTime}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Subscription State Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {isSubscribed ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Alerts turned on for this barangay
                        </span>
                      ) : (
                        'Tap "Subscribe" to get delay alerts'
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Sector {b.district}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. VIEW TAB 2: TRUCK SCHEDULE TIMETABLE MATRIX */}
      {activeSubTab === 'schedules' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Weekly Garbage Collection Timetable
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official regular pickup schedule for Quezon City barangays.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Barangay & District</th>
                  <th className="py-3 px-4">Pickup Days</th>
                  <th className="py-3 px-4">Pickup Window</th>
                  <th className="py-3 px-4">Waste Type</th>
                  <th className="py-3 px-4">Garbage Truck</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBarangays.map((b) => {
                  const isSubscribed = currentUser.subscribedBarangayIds.includes(b.id);
                  const isDelayed = b.status === 'DELAYED';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">District {b.district}</div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        {b.regularDays.join(', ')}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {b.pickupWindow}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {b.wasteType}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        <div>{b.truckCode}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{b.contractor}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            isDelayed
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : b.status === 'IN_PROGRESS'
                              ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {isDelayed ? 'DELAYED' : b.status === 'IN_PROGRESS' ? 'COLLECTING' : 'ON SCHEDULE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onToggleSubscription(b.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            isSubscribed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200'
                          }`}
                        >
                          {isSubscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. VIEW TAB 3: DELAYED ADVISORIES */}
      {activeSubTab === 'delays' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                Quezon City Collection Delay Announcements
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                When typhoons, floods, heavy traffic, or truck breakdowns cause delays, announcements are posted here so you know when pickup will resume.
              </p>
            </div>
          </div>

          {delayedBarangays.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">All Barangays Operating On Schedule</h4>
              <p className="text-xs text-slate-500">There are currently no active weather, traffic, or mechanical delays reported in Quezon City.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {delayedBarangays.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <h4 className="text-base font-black text-slate-900">
                        Brgy. {b.name} (District {b.district})
                      </h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                        {b.currentDelay?.category}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      Reported: <strong className="text-slate-800">{b.currentDelay?.reportedAt}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                    &ldquo;{b.currentDelay?.cause}&rdquo;
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Original Scheduled Time:</span>
                      <span className="font-semibold text-slate-800">{b.pickupWindow} ({b.nextScheduledDate})</span>
                    </div>
                    <div>
                      <span className="text-amber-800 font-bold block text-[11px]">New Rescheduled Time:</span>
                      <strong className="text-amber-950 font-black text-sm">
                        {b.currentDelay?.rescheduledTime}
                      </strong>
                    </div>
                  </div>

                  {b.currentDelay?.advisoryNote && (
                    <div className="text-xs text-slate-600 flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong>Resident Advice:</strong> {b.currentDelay.advisoryNote}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">Truck: {b.truckCode}</span>
                    <button
                      type="button"
                      onClick={() => onToggleSubscription(b.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                        currentUser.subscribedBarangayIds.includes(b.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {currentUser.subscribedBarangayIds.includes(b.id)
                        ? 'Alerts Turned On'
                        : 'Turn On Alerts'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. SUBSCRIBED INBOUND ALERT FEED */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">
              My Alerts & Notifications ({residentNotifications.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            For {subscribedCount} saved barangays
          </span>
        </div>

        {residentNotifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No active alerts for your saved barangays. You will be notified here when garbage trucks arrive or if pickup is delayed.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {residentNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onSelectNotification(n)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  n.type === 'DELAY_ALERT'
                    ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
                    : 'bg-slate-50 border-slate-200 hover:bg-emerald-50/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                        n.type === 'DELAY_ALERT' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {n.type === 'DELAY_ALERT' ? 'DELAY' : 'REMINDER'}
                    </span>
                    <strong className="text-slate-900">{n.title}</strong>
                    <span className="text-slate-400 text-[10px]">• {n.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed truncate max-w-lg">
                    {n.causeOfDelay || n.advisory}
                  </p>
                </div>

                {n.telemetryEtaFormatted && (
                  <span className="font-mono font-bold text-xs bg-slate-900 text-emerald-400 px-2 py-1 rounded-md shrink-0">
                    {n.telemetryEtaFormatted}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
