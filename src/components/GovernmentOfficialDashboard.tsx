import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  RotateCcw,
  Sliders
} from 'lucide-react';

interface GovernmentOfficialDashboardProps {
  currentOfficial?: AdminOfficial;
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
  onOverrideEta?: (
    barangayId: string,
    payload: {
      newEtaTime: string;
      adminOfficialName: string;
      reason: string;
    }
  ) => Promise<void>;
  onLogout?: () => void;
}

export function GovernmentOfficialDashboard({
  currentOfficial,
  barangays,
  notifications,
  onUpdateSchedule,
  onInputDelay,
  onResolveDelay,
  onOverrideEta,
  onLogout,
}: GovernmentOfficialDashboardProps) {
  // Official selection / authorization state
  const [activeOfficial, setActiveOfficial] = useState<AdminOfficial>(
    currentOfficial || QC_AUTHORIZED_OFFICIALS[0]
  );

  // Active view tab inside Admin dashboard
  const [adminTab, setAdminTab] = useState<'dispatcher' | 'crud_schedule' | 'audit_log'>('dispatcher');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELAYED' | 'ON_SCHEDULE'>('ALL');

  // Selected barangay for modal or side-drawer actions
  const [selectedBarangayId, setSelectedBarangayId] = useState<string>(barangays[0]?.id || 'brgy-batasan-hills');
  const [actionType, setActionType] = useState<'NONE' | 'REPORT_DELAY' | 'EDIT_SCHEDULE' | 'OVERRIDE_ETA'>('NONE');

  // Form states for Input Delay
  const [delayCategory, setDelayCategory] = useState<string>('Typhoon / Severe Weather');
  const [delayCause, setDelayCause] = useState('');
  const [rescheduledDate, setRescheduledDate] = useState('Today');
  const [rescheduledTime, setRescheduledTime] = useState('11:00 AM');
  const [delayAdvisory, setDelayAdvisory] = useState('');

  // Form states for Schedule Update
  const [editPickupWindow, setEditPickupWindow] = useState('');
  const [editWasteType, setEditWasteType] = useState<WasteType>('Biodegradable (Food & Kitchen Waste)');
  const [editNextDate, setEditNextDate] = useState('');
  const [editNextTime, setEditNextTime] = useState('');
  const [editContractor, setEditContractor] = useState('');
  const [editTruckCode, setEditTruckCode] = useState('');

  // Form states for ETA Override
  const [overrideEtaTime, setOverrideEtaTime] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const selectedBarangay = useMemo(() => {
    return barangays.find((b) => b.id === selectedBarangayId) || barangays[0];
  }, [barangays, selectedBarangayId]);

  // Filtered barangays
  const filteredBarangays = useMemo(() => {
    return barangays.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.truckCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.contractor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDistrict = districtFilter === 'ALL' || b.district === districtFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'DELAYED' && b.status === 'DELAYED') ||
        (statusFilter === 'ON_SCHEDULE' && b.status === 'ON_SCHEDULE');

      return matchesSearch && matchesDistrict && matchesStatus;
    });
  }, [barangays, searchQuery, districtFilter, statusFilter]);

  // Overall metrics
  const totalBarangays = barangays.length;
  const delayedCount = barangays.filter((b) => b.status === 'DELAYED').length;
  const inProgressCount = barangays.filter((b) => b.status === 'IN_PROGRESS').length;
  const onScheduleCount = totalBarangays - delayedCount - inProgressCount;

  const handleOpenDelayModal = (b: BarangaySchedule) => {
    setSelectedBarangayId(b.id);
    setDelayCause(
      b.currentDelay?.cause ||
        'Tropical Storm & localized flash flooding impassable for compactor trucks. Rerouting in progress.'
    );
    setDelayCategory(b.currentDelay?.category || 'Typhoon / Severe Weather');
    setRescheduledDate(b.nextScheduledDate);
    setRescheduledTime(b.nextScheduledTime);
    setDelayAdvisory(
      b.currentDelay?.advisoryNote ||
        'Please keep sealed trash bins inside gates until collection resumes.'
    );
    setActionType('REPORT_DELAY');
  };

  const handleOpenEditModal = (b: BarangaySchedule) => {
    setSelectedBarangayId(b.id);
    setEditPickupWindow(b.pickupWindow);
    setEditWasteType(b.wasteType);
    setEditNextDate(b.nextScheduledDate);
    setEditNextTime(b.nextScheduledTime);
    setEditContractor(b.contractor);
    setEditTruckCode(b.truckCode);
    setActionType('EDIT_SCHEDULE');
  };

  const handleOpenOverrideEtaModal = (b: BarangaySchedule) => {
    setSelectedBarangayId(b.id);
    setOverrideEtaTime(b.nextScheduledTime);
    setOverrideReason('Route traffic clearance adjustment by LGU Dispatch Supervisor');
    setActionType('OVERRIDE_ETA');
  };

  const handleSubmitDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayCause.trim()) return;

    setIsSubmitting(true);
    try {
      await onInputDelay(selectedBarangay.id, {
        causeOfDelay: delayCause.trim(),
        delayCategory,
        originalDate: selectedBarangay.nextScheduledDate,
        originalTime: selectedBarangay.nextScheduledTime,
        rescheduledDate,
        rescheduledTime,
        advisoryNote: delayAdvisory.trim(),
        adminOfficialName: `${activeOfficial.fullName} (${activeOfficial.badgeNumber})`,
      });

      setFeedbackMessage(`Official delay advisory broadcasted for Brgy. ${selectedBarangay.name}.`);
      setActionType('NONE');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateSchedule(selectedBarangay.id, {
        regularDays: selectedBarangay.regularDays,
        pickupWindow: editPickupWindow,
        wasteType: editWasteType,
        nextScheduledDate: editNextDate,
        nextScheduledTime: editNextTime,
        contractor: editContractor,
        truckCode: editTruckCode,
        adminOfficialName: `${activeOfficial.fullName} (${activeOfficial.badgeNumber})`,
      });

      setFeedbackMessage(`Schedule updated for Brgy. ${selectedBarangay.name}.`);
      setActionType('NONE');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOverrideEta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onOverrideEta) return;
    setIsSubmitting(true);
    try {
      await onOverrideEta(selectedBarangay.id, {
        newEtaTime: overrideEtaTime,
        adminOfficialName: `${activeOfficial.fullName} (${activeOfficial.badgeNumber})`,
        reason: overrideReason,
      });

      setFeedbackMessage(`ETA Override published for Brgy. ${selectedBarangay.name}: ${overrideEtaTime}.`);
      setActionType('NONE');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveDelayQuick = async (b: BarangaySchedule) => {
    setIsSubmitting(true);
    try {
      await onResolveDelay(b.id, {
        adminOfficialName: `${activeOfficial.fullName} (${activeOfficial.badgeNumber})`,
        nextDate: b.nextScheduledDate,
        nextTime: b.nextScheduledTime,
        resolutionNote: 'Weather/traffic obstruction cleared. Normal collection schedule resumed.',
      });
      setFeedbackMessage(`Delay resolved for Brgy. ${b.name}. Normal route resumed.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. LGU COMMAND BAR & ACTIVE OFFICIAL BADGE */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                <Building2 className="w-3.5 h-3.5" />
                QC EPWMD City Management
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                City Official Portal
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Quezon City Garbage Collection Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Manage garbage pickup schedules across all Quezon City barangays. Post delay announcements, update pickup times, and notify residents instantly.
            </p>
          </div>

          {/* Active Authorized Official Pill */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
              <BadgeCheck className="w-4 h-4" />
              <span>{activeOfficial.badgeNumber} • {activeOfficial.role}</span>
            </div>
            <div className="text-sm font-black text-white">{activeOfficial.fullName}</div>
            <div className="text-[11px] text-slate-400">{activeOfficial.title}</div>
          </div>
        </div>

        {/* Global Dispatch Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Total Barangays:</span>
            <span className="text-white font-bold text-sm">{totalBarangays}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">On Schedule:</span>
            <span className="text-emerald-400 font-bold text-sm">{onScheduleCount}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Delayed Barangays:</span>
            <span className="text-amber-400 font-bold text-sm">{delayedCount}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Trucks Collecting Now:</span>
            <span className="text-cyan-400 font-bold text-sm">{inProgressCount}</span>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 2. ADMIN DISPATCHER TABLE & CRUD OPERATIONS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Table Filters & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by barangay, truck or contractor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="ALL">All Statuses ({totalBarangays})</option>
              <option value="DELAYED">With Active Delays ({delayedCount})</option>
              <option value="ON_SCHEDULE">On Schedule ({onScheduleCount})</option>
            </select>

            {/* District Filter */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="ALL">All Districts</option>
              <option value={1}>District 1</option>
              <option value={2}>District 2</option>
              <option value={3}>District 3</option>
              <option value={4}>District 4</option>
              <option value={5}>District 5</option>
              <option value={6}>District 6</option>
            </select>
          </div>
        </div>

        {/* Interactive Dispatcher Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Barangay & District</th>
                <th className="py-3 px-4">Garbage Truck</th>
                <th className="py-3 px-4">Pickup Window</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Delay Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBarangays.map((b) => {
                const isDelayed = b.status === 'DELAYED';
                const isInProgress = b.status === 'IN_PROGRESS';

                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Barangay */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{b.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        District {b.district} • {b.zipCode}
                      </div>
                    </td>

                    {/* Hauler & Truck */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.truckCode}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{b.contractor}</div>
                    </td>

                    {/* Timetable */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.pickupWindow}</div>
                      <div className="text-[11px] text-slate-500">{b.nextScheduledDate} • {b.nextScheduledTime}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-black ${
                          isDelayed
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isInProgress
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {isDelayed ? 'DELAYED' : isInProgress ? 'COLLECTING NOW' : 'ON SCHEDULE'}
                      </span>
                    </td>

                    {/* Delay Note Preview */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {isDelayed && b.currentDelay ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                            {b.currentDelay.category}
                          </span>
                          <p className="text-[11px] text-amber-950 font-medium truncate" title={b.currentDelay.cause}>
                            {b.currentDelay.cause}
                          </p>
                          <span className="text-[10px] text-slate-500">New Time: {b.currentDelay.rescheduledTime}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No delays reported</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isDelayed ? (
                          <button
                            type="button"
                            onClick={() => handleResolveDelayQuick(b)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Mark delay resolved and resume schedule"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Clear Delay</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenDelayModal(b)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Post delay announcement"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Post Delay</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenOverrideEtaModal(b)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Update estimated arrival time"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>Set ETA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(b)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Edit collection schedule"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODALS / ACTION DRAWERS */}

      {/* Modal A: Report Delay with Cause-of-Delay Note */}
      {actionType === 'REPORT_DELAY' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-amber-300 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Broadcast Delay Advisory: Brgy. {selectedBarangay.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionType('NONE')}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDelay} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Delay Disruption Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={delayCategory}
                  onChange={(e) => setDelayCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Typhoon / Severe Weather">Typhoon / Severe Weather / Flooding</option>
                  <option value="Road Closure / Heavy Traffic">Road Closure / Heavy Traffic Jam</option>
                  <option value="Truck Mechanical Issue">Truck Mechanical Problem or Breakdown</option>
                  <option value="Disposal Facility Congestion">Dumpsite / Landfill Queue Waiting</option>
                  <option value="Emergency Rerouting">Road Repairs / Detour</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Delay (Shown to Residents) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={delayCause}
                  onChange={(e) => setDelayCause(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl leading-relaxed"
                  placeholder="Explain why pickup is delayed so residents know what happened..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rescheduled Date</label>
                  <input
                    type="text"
                    value={rescheduledDate}
                    onChange={(e) => setRescheduledDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rescheduled Time</label>
                  <input
                    type="text"
                    value={rescheduledTime}
                    onChange={(e) => setRescheduledTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resident Advisory Note</label>
                <input
                  type="text"
                  value={delayAdvisory}
                  onChange={(e) => setDelayAdvisory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="e.g. Please secure sealed trash bins within gate perimeter..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionType('NONE')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-2 shadow-md shadow-amber-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish & Broadcast Delay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: ETA Override */}
      {actionType === 'OVERRIDE_ETA' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  Override Route ETA: Brgy. {selectedBarangay.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionType('NONE')}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOverrideEta} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Route ETA</label>
                <input
                  type="text"
                  required
                  value={overrideEtaTime}
                  onChange={(e) => setOverrideEtaTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  placeholder="e.g. 08:30 AM"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Official Override</label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="Reason for adjusting arrival timeline..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionType('NONE')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-2"
                >
                  <span>Apply ETA Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Edit Schedule Details */}
      {actionType === 'EDIT_SCHEDULE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  Update Schedule: Brgy. {selectedBarangay.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionType('NONE')}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pickup Window</label>
                <input
                  type="text"
                  required
                  value={editPickupWindow}
                  onChange={(e) => setEditPickupWindow(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="e.g. 06:00 AM - 08:30 AM"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Waste Classification</label>
                <select
                  value={editWasteType}
                  onChange={(e) => setEditWasteType(e.target.value as WasteType)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Biodegradable (Food & Kitchen Waste)">Biodegradable (Food & Kitchen Waste)</option>
                  <option value="Non-Biodegradable (Residual & Plastics)">Non-Biodegradable (Residual & Plastics)</option>
                  <option value="Recyclables (Paper, Cartons & Metal)">Recyclables (Paper, Cartons & Metal)</option>
                  <option value="Hazardous & Special Household Waste">Hazardous & Special Household Waste</option>
                  <option value="General Waste">General Waste</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Pickup Date</label>
                  <input
                    type="text"
                    required
                    value={editNextDate}
                    onChange={(e) => setEditNextDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Pickup Time</label>
                  <input
                    type="text"
                    required
                    value={editNextTime}
                    onChange={(e) => setEditNextTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Garbage Contractor</label>
                  <input
                    type="text"
                    required
                    value={editContractor}
                    onChange={(e) => setEditContractor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Truck Plate / Code</label>
                  <input
                    type="text"
                    required
                    value={editTruckCode}
                    onChange={(e) => setEditTruckCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionType('NONE')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Save & Propagate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
