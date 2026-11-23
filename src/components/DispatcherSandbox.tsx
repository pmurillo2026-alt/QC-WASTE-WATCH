import React, { useState } from 'react';
import { BarangaySchedule, WasteNotification } from '../types';
import { 
  Radio, 
  AlertTriangle, 
  Send, 
  CloudRain, 
  Wrench, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface DispatcherSandboxProps {
  barangays: BarangaySchedule[];
  onTriggerNotification: (notif: Omit<WasteNotification, 'id' | 'timestamp' | 'isRead'>) => void;
}

export function DispatcherSandbox({
  barangays,
  onTriggerNotification,
}: DispatcherSandboxProps) {
  const [selectedBarangayId, setSelectedBarangayId] = useState(barangays[0]?.id || 'brgy-batasan-hills');
  const [notificationType, setNotificationType] = useState<'DELAY' | 'SCHEDULED'>('DELAY');
  const [delayCategory, setDelayCategory] = useState<string>('Typhoon / Severe Weather');
  const [customCause, setCustomCause] = useState(
    'Typhoon Signal No. 2 (Habagat Heavy Rain): Flooding along low-lying routes. Garbage collection truck delayed.'
  );
  const [scheduledDate, setScheduledDate] = useState('Monday, Sep 14, 2026');
  const [originalTime, setOriginalTime] = useState('06:30 AM');
  const [rescheduledTime, setRescheduledTime] = useState('11:00 AM');
  const [advisory, setAdvisory] = useState(
    'Please keep bins securely closed indoors until truck sirens sound to prevent waste dispersal in rainwater.'
  );
  const [sentSuccess, setSentSuccess] = useState(false);

  const selectedBarangay = barangays.find((b) => b.id === selectedBarangayId) || barangays[0];

  const handleQuickPreset = (presetType: 'TYPHOON' | 'BREAKDOWN' | 'TRAFFIC' | 'NORMAL') => {
    if (presetType === 'TYPHOON') {
      setNotificationType('DELAY');
      setDelayCategory('Typhoon / Severe Weather');
      setCustomCause('Tropical Storm & Monsoon Flooding: Commonwealth & Litex Avenue impassable for heavy compactors.');
      setScheduledDate('Monday, Sep 14, 2026');
      setOriginalTime('06:30 AM');
      setRescheduledTime('01:30 PM (Pending Flood Clearance)');
      setAdvisory('Barangay officials advise residents to keep waste bags off the ground to avoid street drain blockage.');
    } else if (presetType === 'BREAKDOWN') {
      setNotificationType('DELAY');
      setDelayCategory('Truck Mechanical Issue');
      setCustomCause('Emergency hydraulic compactor ram malfunction on Truck QC-TRK-204 near Philcoa.');
      setScheduledDate('Today, Sep 13, 2026');
      setOriginalTime('08:00 AM');
      setRescheduledTime('10:45 AM (Backup Hauler Dispatched)');
      setAdvisory('A relief truck is en route from the North District Depot. Collection will resume shortly.');
    } else if (presetType === 'TRAFFIC') {
      setNotificationType('DELAY');
      setDelayCategory('Road Closure / Heavy Traffic');
      setCustomCause('Emergency DPWH water pipe repair along Mindanao Ave bottlenecking collection access.');
      setScheduledDate('Monday, Sep 14, 2026');
      setOriginalTime('07:00 AM');
      setRescheduledTime('09:15 AM');
      setAdvisory('Truck is rerouting through internal village access roads.');
    } else {
      setNotificationType('SCHEDULED');
      setScheduledDate('Tomorrow, Sep 14, 2026');
      setOriginalTime('06:30 AM');
      setAdvisory('Biodegradable / Kitchen waste collection. Please place secured bins on curb by 6:00 AM.');
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (notificationType === 'DELAY') {
      onTriggerNotification({
        barangayId: selectedBarangay.id,
        barangayName: selectedBarangay.name,
        district: selectedBarangay.district,
        type: 'DELAY_ALERT',
        title: `⚠️ Collection Delayed: Brgy. ${selectedBarangay.name}`,
        scheduledDate: scheduledDate,
        scheduledTime: rescheduledTime || originalTime,
        causeOfDelay: customCause,
        delayCategory: delayCategory,
        originalTime: originalTime,
        rescheduledDate: scheduledDate,
        rescheduledTime: rescheduledTime,
        advisory: advisory,
        severity: 'warning',
        telemetryDistanceKm: selectedBarangay.telemetry?.distanceRemainingKm,
        telemetryEtaFormatted: selectedBarangay.telemetry?.etaFormatted,
      });
    } else {
      onTriggerNotification({
        barangayId: selectedBarangay.id,
        barangayName: selectedBarangay.name,
        district: selectedBarangay.district,
        type: 'SCHEDULED_REMINDER',
        title: `🔔 Garbage Pickup Reminder: Brgy. ${selectedBarangay.name}`,
        scheduledDate: scheduledDate,
        scheduledTime: originalTime,
        advisory: advisory || `Regular collection for ${selectedBarangay.wasteType}. Truck ${selectedBarangay.truckCode}.`,
        severity: 'normal',
        telemetryDistanceKm: selectedBarangay.telemetry?.distanceRemainingKm,
        telemetryEtaFormatted: selectedBarangay.telemetry?.etaFormatted,
      });
    }

    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg shadow-slate-950/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Quezon City EPWMD Dispatcher & Simulation Console
            </h2>
            <p className="text-xs text-slate-400">
              Test real-time push notifications, custom causes of delay (typhoons, breakdowns, floods), and schedule updates for subscribed residents.
            </p>
          </div>
        </div>

        {/* 1-Click Quick Presets */}
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Simulation Scenarios (Click to auto-fill & send):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              id="preset-typhoon-delay"
              onClick={() => {
                handleQuickPreset('TYPHOON');
                setTimeout(() => {
                  const form = document.getElementById('dispatcher-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }, 100);
              }}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                <CloudRain className="w-4 h-4" />
                <span>Typhoon Delay Alert</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                Signal 2 • Flooded Litex Ave
              </p>
            </button>

            <button
              type="button"
              id="preset-breakdown-delay"
              onClick={() => {
                handleQuickPreset('BREAKDOWN');
                setTimeout(() => {
                  const form = document.getElementById('dispatcher-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }, 100);
              }}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                <Wrench className="w-4 h-4" />
                <span>Truck Breakdown Alert</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                Hydraulic lift issue • Relief hauler
              </p>
            </button>

            <button
              type="button"
              id="preset-traffic-delay"
              onClick={() => {
                handleQuickPreset('TRAFFIC');
                setTimeout(() => {
                  const form = document.getElementById('dispatcher-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }, 100);
              }}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                <Truck className="w-4 h-4" />
                <span>Road Obstruction Delay</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                DPWH pipe repair • Route detour
              </p>
            </button>

            <button
              type="button"
              id="preset-normal-schedule"
              onClick={() => {
                handleQuickPreset('NORMAL');
                setTimeout(() => {
                  const form = document.getElementById('dispatcher-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }, 100);
              }}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                <Clock className="w-4 h-4" />
                <span>Normal Pickup Reminder</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                Upcoming 06:30 AM schedule
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch Notification Custom Form */}
      <form
        id="dispatcher-form"
        onSubmit={handleDispatch}
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            Compose & Broadcast Push Notification
          </h3>
          {sentSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Notification Sent & Popped Up!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Barangay */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="dispatch-barangay">
              Target Barangay in Quezon City
            </label>
            <select
              id="dispatch-barangay"
              value={selectedBarangayId}
              onChange={(e) => setSelectedBarangayId(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              {barangays.map((b) => (
                <option key={b.id} value={b.id}>
                  Brgy. {b.name} (Dist. {b.district}) - Regular: {b.pickupWindow}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notification Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNotificationType('DELAY')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  notificationType === 'DELAY'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⚠️ Delay Alert (With Cause)
              </button>
              <button
                type="button"
                onClick={() => setNotificationType('SCHEDULED')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  notificationType === 'SCHEDULED'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🔔 Regular Schedule Reminder
              </button>
            </div>
          </div>
        </div>

        {/* If Delay Alert: Cause of delay note fields */}
        {notificationType === 'DELAY' && (
          <div className="p-4 bg-amber-50/70 border border-amber-300/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Cause of Delay Note Payload</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1" htmlFor="dispatch-cause">
                Cause-of-Delay Note (Displayed prominently to residents) *
              </label>
              <textarea
                id="dispatch-cause"
                required
                rows={2}
                value={customCause}
                onChange={(e) => setCustomCause(e.target.value)}
                placeholder="e.g. Typhoon Signal No. 2: Impassable flash flooding along Batasan-San Mateo Road..."
                className="w-full p-2.5 text-xs sm:text-sm bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-amber-950 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1" htmlFor="dispatch-orig-time">
                  Original Scheduled Time
                </label>
                <input
                  id="dispatch-orig-time"
                  type="text"
                  value={originalTime}
                  onChange={(e) => setOriginalTime(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1" htmlFor="dispatch-resched-time">
                  Rescheduled Pickup Time
                </label>
                <input
                  id="dispatch-resched-time"
                  type="text"
                  value={rescheduledTime}
                  onChange={(e) => setRescheduledTime(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg font-bold text-amber-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Date & Resident Advisory Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="dispatch-date">
              Scheduled Date
            </label>
            <input
              id="dispatch-date"
              type="text"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="dispatch-advisory">
              Resident Advisory Guideline
            </label>
            <input
              id="dispatch-advisory"
              type="text"
              value={advisory}
              onChange={(e) => setAdvisory(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="btn-broadcast-push"
          type="submit"
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-emerald-400" />
          <span>Broadcast Push Notification & Trigger Pop-up Modal</span>
        </button>
      </form>
    </div>
  );
}
