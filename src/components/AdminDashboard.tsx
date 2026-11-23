import React, { useState } from 'react';
import { BarangaySchedule, AdminOfficial, WasteType, AdminAuditLog, WasteNotification } from '../types';
import { QC_AUTHORIZED_OFFICIALS } from '../data/qcOfficials';
import {
  ShieldAlert,
  Clock,
  Truck,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Send,
  Building2,
  ChevronRight,
  BadgeCheck,
  Zap,
  Info,
  Layers,
  Sparkles,
  Megaphone,
} from 'lucide-react';

interface AdminDashboardProps {
  barangays: BarangaySchedule[];
  notifications: WasteNotification[];
  onUpdateSchedule: (
    barangayId: string,
    payload: {
      regularDays: string[];
      pickupWindow: string;
      wasteType: WasteType;
      nextScheduledDate: string;
      nextScheduledTime: string;
      contractor: string;
      truckCode: string;
      adminOfficialName: string;
    }
  ) => Promise<void>;
  onInputDelay: (
    barangayId: string,
    payload: {
      causeOfDelay: string;
      delayCategory: string;
      originalDate: string;
      originalTime: string;
      rescheduledDate: string;
      rescheduledTime: string;
      advisoryNote: string;
      adminOfficialName: string;
    }
  ) => Promise<void>;
  onResolveDelay: (
    barangayId: string,
    payload: {
      adminOfficialName: string;
      nextDate: string;
      nextTime: string;
      resolutionNote: string;
    }
  ) => Promise<void>;
  onSwitchToResidentView: () => void;
}

export function AdminDashboard({
  barangays,
  notifications,
  onUpdateSchedule,
  onInputDelay,
  onResolveDelay,
  onSwitchToResidentView,
}: AdminDashboardProps) {
  const [selectedOfficial, setSelectedOfficial] = useState<AdminOfficial>(QC_AUTHORIZED_OFFICIALS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELAYED' | 'ON_SCHEDULE'>('ALL');

  // Modals state
  const [delayModalBarangay, setDelayModalBarangay] = useState<BarangaySchedule | null>(null);
  const [scheduleModalBarangay, setScheduleModalBarangay] = useState<BarangaySchedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  // Delay Form State
  const [delayCategory, setDelayCategory] = useState<string>('Typhoon / Severe Weather');
  const [causeOfDelay, setCauseOfDelay] = useState<string>('');
  const [rescheduledDate, setRescheduledDate] = useState<string>('Today (Rescheduled)');
  const [rescheduledTime, setRescheduledTime] = useState<string>('11:00 AM');
  const [advisoryNote, setAdvisoryNote] = useState<string>('');

  // Schedule Form State
  const [editPickupWindow, setEditPickupWindow] = useState<string>('');
  const [editNextDate, setEditNextDate] = useState<string>('');
  const [editNextTime, setEditNextTime] = useState<string>('');
  const [editWasteType, setEditWasteType] = useState<WasteType>('Biodegradable (Food & Kitchen Waste)');
  const [editContractor, setEditContractor] = useState<string>('');
  const [editTruckCode, setEditTruckCode] = useState<string>('');
  const [editDays, setEditDays] = useState<string[]>([]);

  // Open Delay Modal with prefilled smart suggestions
  const openDelayModal = (barangay: BarangaySchedule) => {
    setDelayModalBarangay(barangay);
    setDelayCategory('Typhoon / Severe Weather');
    setCauseOfDelay(
      barangay.currentDelay?.cause ||
        `Tropical storm monsoon flooding along ${barangay.subArea || barangay.name} main route. Impassable for compactor trucks.`
    );
    setRescheduledDate(barangay.currentDelay?.rescheduledDate || barangay.nextScheduledDate);
    setRescheduledTime(barangay.currentDelay?.rescheduledTime || '11:30 AM');
    setAdvisoryNote(
      barangay.currentDelay?.advisoryNote ||
        `Barangay ${barangay.name} residents are advised to keep sealed trash bins inside gates until rescheduled collection time.`
    );
  };

  // Open Schedule Modal with existing data
  const openScheduleModal = (barangay: BarangaySchedule) => {
    setScheduleModalBarangay(barangay);
    setEditPickupWindow(barangay.pickupWindow);
    setEditNextDate(barangay.nextScheduledDate);
    setEditNextTime(barangay.nextScheduledTime);
    setEditWasteType(barangay.wasteType);
    setEditContractor(barangay.contractor);
    setEditTruckCode(barangay.truckCode);
    setEditDays(barangay.regularDays);
  };

  // Handle Delay Submit
  const handleDelaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayModalBarangay || !causeOfDelay.trim()) return;

    setIsSubmitting(true);
    try {
      await onInputDelay(delayModalBarangay.id, {
        causeOfDelay: causeOfDelay.trim(),
        delayCategory,
        originalDate: delayModalBarangay.nextScheduledDate,
        originalTime: delayModalBarangay.nextScheduledTime,
        rescheduledDate,
        rescheduledTime,
        advisoryNote: advisoryNote.trim(),
        adminOfficialName: `${selectedOfficial.fullName} (${selectedOfficial.badgeNumber})`,
      });

      setBroadcastFeedback(
        `Delay reason logged for Brgy. ${delayModalBarangay.name}! Push alert and schedule update propagated to residents' feed.`
      );
      setDelayModalBarangay(null);
      setTimeout(() => setBroadcastFeedback(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Schedule Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalBarangay) return;

    setIsSubmitting(true);
    try {
      await onUpdateSchedule(scheduleModalBarangay.id, {
        regularDays: editDays.length > 0 ? editDays : scheduleModalBarangay.regularDays,
        pickupWindow: editPickupWindow,
        wasteType: editWasteType,
        nextScheduledDate: editNextDate,
        nextScheduledTime: editNextTime,
        contractor: editContractor,
        truckCode: editTruckCode,
        adminOfficialName: `${selectedOfficial.fullName} (${selectedOfficial.badgeNumber})`,
      });

      setBroadcastFeedback(
        `Schedule updated for Brgy. ${scheduleModalBarangay.name}! Changes propagated through backend to all subscribed residents.`
      );
      setScheduleModalBarangay(null);
      setTimeout(() => setBroadcastFeedback(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Resolve Delay
  const handleResolveClick = async (barangay: BarangaySchedule) => {
    setIsSubmitting(true);
    try {
      await onResolveDelay(barangay.id, {
        adminOfficialName: `${selectedOfficial.fullName} (${selectedOfficial.badgeNumber})`,
        nextDate: barangay.nextScheduledDate,
        nextTime: barangay.nextScheduledTime,
        resolutionNote: `Obstruction cleared. Regular collection route for Brgy. ${barangay.name} resumed by hauler ${barangay.truckCode}.`,
      });
      setBroadcastFeedback(
        `Delay cleared for Brgy. ${barangay.name}! Residents notified that waste collection has resumed.`
      );
      setTimeout(() => setBroadcastFeedback(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered barangays
  const filteredBarangays = barangays.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subArea?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.truckCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'ALL' || b.district === selectedDistrict;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'DELAYED' && b.status === 'DELAYED') ||
      (statusFilter === 'ON_SCHEDULE' && b.status === 'ON_SCHEDULE');
    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const delayedCount = barangays.filter((b) => b.status === 'DELAYED').length;
  const onScheduleCount = barangays.filter((b) => b.status === 'ON_SCHEDULE').length;

  return (
    <div className="space-y-6">
      {/* Official Government Header & Credentials */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                QC EPWMD Authorized Portal
              </span>
              <span className="px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-800 rounded-full border border-slate-700">
                LGU System Node: QC-DISPATCH-MAIN
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Government Waste Operations Command</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Authorized municipal interface for Quezon City Solid Waste Management officers.
              Update barangay collection schedules and input reasons for delays. All modifications
              are propagated via backend broadcast to residents’ real-time notification feeds.
            </p>
          </div>

          {/* Official Officer Switcher */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 min-w-[300px]">
            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between">
              <span>Logged-in Municipal Official</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <select
                id="admin-official-select"
                aria-label="Select authorized official"
                value={selectedOfficial.id}
                onChange={(e) => {
                  const found = QC_AUTHORIZED_OFFICIALS.find((o) => o.id === e.target.value);
                  if (found) setSelectedOfficial(found);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {QC_AUTHORIZED_OFFICIALS.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.fullName} — {off.role}
                  </option>
                ))}
              </select>

              <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position:</span>
                  <span className="font-medium text-slate-200">{selectedOfficial.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedOfficial.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Districts:</span>
                  <span className="text-slate-200">
                    {selectedOfficial.assignedDistricts.length === 6
                      ? 'All QC Districts (1 - 6)'
                      : `Districts ${selectedOfficial.assignedDistricts.join(', ')}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Broadcast Banner Notice */}
        {broadcastFeedback && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Zap className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <div className="text-xs sm:text-sm font-semibold">{broadcastFeedback}</div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Monitored Barangays</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{barangays.length}</span>
            <span className="text-xs text-slate-500">QC LGU</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Across 6 QC Districts</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="text-xs text-amber-800 font-medium">Active Delay Alerts</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">{delayedCount}</span>
            <span className="text-xs text-amber-600 font-semibold">Barangays</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800 flex items-center gap-1 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Advisories active in feed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">On Schedule</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{onScheduleCount}</span>
            <span className="text-xs text-slate-500">
              ({Math.round((onScheduleCount / barangays.length) * 100)}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Regular route clear</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Broadcast Feed Items</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700">{notifications.length}</span>
            <span className="text-xs text-slate-500">Alerts</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 flex items-center gap-1 font-semibold">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Propagated to residents</span>
          </div>
        </div>
      </div>

      {/* Action Controls & Filtering Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="admin-search-barangay"
              type="text"
              placeholder="Search barangay, sub-area, or compactor truck code (e.g., Batasan, Cubao, QC-TRK-204)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              id="btn-return-resident-view"
              type="button"
              onClick={onSwitchToResidentView}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Resident App</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* District Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              District:
            </span>
            {(['ALL', 1, 2, 3, 4, 5, 6] as const).map((dist) => (
              <button
                key={dist}
                type="button"
                onClick={() => setSelectedDistrict(dist)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedDistrict === dist
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dist === 'ALL' ? 'All Districts' : `District ${dist}`}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({barangays.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DELAYED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'DELAYED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Delayed ({delayedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ON_SCHEDULE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'ON_SCHEDULE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              On Schedule ({onScheduleCount})
            </button>
          </div>
        </div>
      </div>

      {/* Barangay Schedules & Delay Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Quezon City Barangay Collection Dispatch Roster
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredBarangays.length} of {barangays.length} barangays. Click &quot;Input Delay Reason&quot;
              or &quot;Update Schedule&quot; to propagate real-time changes to the residents&apos; notification feed.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Backend Sync: Active</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredBarangays.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No Quezon City barangays matched your filter criteria.
            </div>
          ) : (
            filteredBarangays.map((barangay) => {
              const isDelayed = barangay.status === 'DELAYED';

              return (
                <div
                  key={barangay.id}
                  id={`admin-row-${barangay.id}`}
                  className={`p-5 transition-colors ${
                    isDelayed ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Barangay Identification & Regular Timetable */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">
                          Brgy. {barangay.name}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-md">
                          District {barangay.district}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-600 rounded-md">
                          ZIP {barangay.zipCode}
                        </span>

                        {isDelayed ? (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            DELAYED ADVISORY ACTIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ON SCHEDULE
                          </span>
                        )}
                      </div>

                      {barangay.subArea && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="font-medium text-slate-700">Sub-Area:</span>
                          <span>{barangay.subArea}</span>
                        </p>
                      )}

                      {/* Timetable Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            <strong className="text-slate-800">Days:</strong>{' '}
                            {barangay.regularDays.join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            <strong className="text-slate-800">Window:</strong>{' '}
                            {barangay.pickupWindow}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            <strong className="text-slate-800">Truck:</strong>{' '}
                            <span className="font-mono">{barangay.truckCode}</span>
                          </span>
                        </div>
                      </div>

                      {/* Active Delay Box (if any) */}
                      {isDelayed && barangay.currentDelay && (
                        <div className="mt-3 bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-amber-900 font-bold">
                            <span className="flex items-center gap-1">
                              <ShieldAlert className="w-4 h-4 text-amber-700" />
                              Official Reason for Delay: {barangay.currentDelay.category}
                            </span>
                            <span className="text-[11px] text-amber-700 font-normal">
                              Reported {barangay.currentDelay.reportedAt}
                            </span>
                          </div>
                          <p className="text-amber-950 font-medium leading-relaxed">
                            {barangay.currentDelay.cause}
                          </p>
                          <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-amber-900 border-t border-amber-200">
                            <div>
                              <strong>Original Time:</strong> {barangay.currentDelay.originalTime}
                            </div>
                            <div>
                              <strong>Rescheduled:</strong>{' '}
                              <span className="font-bold text-amber-950 underline">
                                {barangay.currentDelay.rescheduledTime}
                              </span>{' '}
                              ({barangay.currentDelay.rescheduledDate})
                            </div>
                          </div>
                          {barangay.currentDelay.advisoryNote && (
                            <div className="text-[11px] text-amber-800 italic">
                              Advisory: &quot;{barangay.currentDelay.advisoryNote}&quot;
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Government Official Actions */}
                    <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
                      {isDelayed ? (
                        <>
                          <button
                            id={`btn-resolve-delay-${barangay.id}`}
                            type="button"
                            onClick={() => handleResolveClick(barangay)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resolve Delay & Resume</span>
                          </button>
                          <button
                            id={`btn-modify-delay-${barangay.id}`}
                            type="button"
                            onClick={() => openDelayModal(barangay)}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                            <span>Update Delay Details</span>
                          </button>
                        </>
                      ) : (
                        <button
                          id={`btn-input-delay-${barangay.id}`}
                          type="button"
                          onClick={() => openDelayModal(barangay)}
                          className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Input Reason for Delay</span>
                        </button>
                      )}

                      <button
                        id={`btn-edit-sched-${barangay.id}`}
                        type="button"
                        onClick={() => openScheduleModal(barangay)}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>Update Schedule</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Live System Propagation Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Backend Update Propagation & Audit Log
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Auto-synchronized with resident notification feeds
          </span>
        </div>

        <div className="space-y-3">
          {notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                      notif.type === 'DELAY_ALERT'
                        ? 'bg-amber-100 text-amber-800'
                        : notif.type === 'STATUS_UPDATE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {notif.type.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-slate-800">{notif.title}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{notif.timestamp}</span>
                </div>
                <p className="text-slate-600">
                  {notif.causeOfDelay ? (
                    <span>
                      <strong>Cause:</strong> {notif.causeOfDelay} | <strong>Rescheduled:</strong>{' '}
                      {notif.scheduledTime}
                    </span>
                  ) : (
                    <span>
                      <strong>Schedule:</strong> {notif.scheduledDate} at {notif.scheduledTime} ({notif.advisory})
                    </span>
                  )}
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-500 shrink-0">
                <span className="block font-medium text-slate-700">
                  {notif.updatedBy || 'EPWMD Municipal Dispatch'}
                </span>
                <span className="text-emerald-700 font-semibold">Propagated to Feed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL 1: INPUT REASON FOR DELAY --- */}
      {delayModalBarangay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  Official Delay Protocol
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Input Reason for Delay: Brgy. {delayModalBarangay.name}
                </h3>
                <p className="text-xs text-slate-500">
                  District {delayModalBarangay.district} • Hauler {delayModalBarangay.truckCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDelayModalBarangay(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDelaySubmit} className="space-y-4 text-xs">
              {/* Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Cause Category</label>
                <select
                  value={delayCategory}
                  onChange={(e) => setDelayCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Typhoon / Severe Weather">Typhoon / Severe Weather & Flooding</option>
                  <option value="Truck Mechanical Issue">Compactor Truck Mechanical Breakdown</option>
                  <option value="Road Closure / Heavy Traffic">Road Rehabilitation / Emergency Closure</option>
                  <option value="Disposal Facility Congestion">Disposal Facility (Landfill) Congestion</option>
                  <option value="Emergency Rerouting">Emergency Rerouting / Bridge Clearance</option>
                </select>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Quick Template Prompts:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCauseOfDelay(
                        `Tropical storm monsoon flooding along Batasan-San Mateo and Tumana corridors. Impassable for 10-wheeler compactors.`
                      )
                    }
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px]"
                  >
                    🌊 Typhoon Flooding
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCauseOfDelay(
                        `Hydraulic lift cylinder seal failure on compactor ${delayModalBarangay.truckCode}. Relief truck dispatched from central depot.`
                      )
                    }
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px]"
                  >
                    🔧 Truck Mechanical Issue
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCauseOfDelay(
                        `DPWH emergency drainage culvert excavation blocking primary access road. Compactor rerouting via secondary avenue.`
                      )
                    }
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px]"
                  >
                    🚧 Road Excavation
                  </button>
                </div>
              </div>

              {/* Detailed Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Detailed Reason for Delay <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={causeOfDelay}
                  onChange={(e) => setCauseOfDelay(e.target.value)}
                  placeholder="Explain why garbage collection is disrupted (e.g. Typhoon Enteng flooding along main avenue)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Original vs Rescheduled Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Rescheduled Date</label>
                  <input
                    type="text"
                    value={rescheduledDate}
                    onChange={(e) => setRescheduledDate(e.target.value)}
                    placeholder="e.g., Monday, Sep 14, 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Rescheduled Time</label>
                  <input
                    type="text"
                    value={rescheduledTime}
                    onChange={(e) => setRescheduledTime(e.target.value)}
                    placeholder="e.g., 11:30 AM"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Public Advisory */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Official Public Advisory Note for Subscribed Residents
                </label>
                <textarea
                  rows={2}
                  value={advisoryNote}
                  onChange={(e) => setAdvisoryNote(e.target.value)}
                  placeholder="Instructions for residents (e.g. Please keep trash bins inside residential gates until 11:30 AM)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Propagation Notice:</strong> Submitting this will update the citywide
                  database, mark Brgy. {delayModalBarangay.name} as DELAYED, and broadcast a push
                  notification directly to subscribed residents.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDelayModalBarangay(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !causeOfDelay.trim()}
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Propagating...' : 'Broadcast Delay Reason'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: UPDATE BARANGAY SCHEDULE --- */}
      {scheduleModalBarangay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-full mb-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  EPWMD Master Schedule
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Update Schedule: Brgy. {scheduleModalBarangay.name}
                </h3>
                <p className="text-xs text-slate-500">
                  District {scheduleModalBarangay.district} • ZIP {scheduleModalBarangay.zipCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalBarangay(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* Days Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Regular Collection Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isSelected = editDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setEditDays((prev) =>
                            isSelected ? prev.filter((d) => d !== day) : [...prev, day]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pickup Window */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Collection Window</label>
                  <input
                    type="text"
                    required
                    value={editPickupWindow}
                    onChange={(e) => setEditPickupWindow(e.target.value)}
                    placeholder="e.g. 06:00 AM - 08:30 AM"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Next Scheduled Time</label>
                  <input
                    type="text"
                    required
                    value={editNextTime}
                    onChange={(e) => setEditNextTime(e.target.value)}
                    placeholder="e.g. 06:30 AM"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Next Scheduled Date & Waste Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Next Scheduled Date</label>
                  <input
                    type="text"
                    required
                    value={editNextDate}
                    onChange={(e) => setEditNextDate(e.target.value)}
                    placeholder="e.g. Monday, Sep 14, 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Waste Classification</label>
                  <select
                    value={editWasteType}
                    onChange={(e) => setEditWasteType(e.target.value as WasteType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Biodegradable (Food & Kitchen Waste)">Biodegradable (Food/Kitchen)</option>
                    <option value="Non-Biodegradable (Residual & Plastics)">Non-Biodegradable (Residual)</option>
                    <option value="Recyclables (Paper, Cartons & Metal)">Recyclables (Paper/Metal)</option>
                    <option value="Hazardous & Special Household Waste">Hazardous & Special Waste</option>
                    <option value="General Waste">General Waste</option>
                  </select>
                </div>
              </div>

              {/* Contractor & Compactor Code */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Hauling Contractor</label>
                  <input
                    type="text"
                    value={editContractor}
                    onChange={(e) => setEditContractor(e.target.value)}
                    placeholder="e.g. QC EPWMD Fleet Sector 2"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Compactor Truck Code</label>
                  <input
                    type="text"
                    value={editTruckCode}
                    onChange={(e) => setEditTruckCode(e.target.value)}
                    placeholder="e.g. QC-TRK-204"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-[11px] text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Schedule Synchronization:</strong> Saving this schedule will instantly update the
                  official timetable in the resident directory and send a timetable update reminder to all
                  residents opted in to Brgy. {scheduleModalBarangay.name}.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalBarangay(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Propagate Schedule Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
