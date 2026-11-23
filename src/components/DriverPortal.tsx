import React, { useState, useEffect } from 'react';
import { DriverUser, BarangaySchedule, WasteNotification } from '../types';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Send, 
  Zap, 
  Gauge, 
  Compass, 
  ChevronRight, 
  Activity, 
  PhoneCall, 
  RotateCcw,
  Sliders,
  Check
} from 'lucide-react';

interface DriverPortalProps {
  currentDriver: DriverUser;
  barangays: BarangaySchedule[];
  onArrive: (driverId: string, barangayId: string) => Promise<void>;
  onUpdateEta: (driverId: string, etaMinutes: number, etaFormatted: string) => Promise<void>;
  onReportIncident: (driverId: string, payload: { cause: string; category: string; rescheduledTime: string; advisory: string }) => Promise<void>;
  onLogout: () => void;
}

export function DriverPortal({
  currentDriver,
  barangays,
  onArrive,
  onUpdateEta,
  onReportIncident,
  onLogout,
}: DriverPortalProps) {
  const [driver, setDriver] = useState<DriverUser>(currentDriver);
  const [customEtaMins, setCustomEtaMins] = useState<number>(10);
  const [incidentCause, setIncidentCause] = useState('');
  const [incidentCategory, setIncidentCategory] = useState<string>('Road Closure / Heavy Traffic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Time & SLA Watchdog countdown ticker
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    setDriver(currentDriver);
  }, [currentDriver]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const assignedBarangay = barangays.find((b) => b.id === driver.assignedBarangayId);

  // SLA Watchdog Calculations
  // Threshold: targetEtaTimestamp + 60,000ms (1-minute grace period)
  const targetEta = driver.targetEtaTimestamp || currentTime + 300_000;
  const slaThreshold = targetEta + 60_000;
  const msRemainingToEta = targetEta - currentTime;
  const msRemainingToSlaThreshold = slaThreshold - currentTime;
  const isSlaBreached = driver.currentStatus === 'IN_TRANSIT' && msRemainingToSlaThreshold <= 0;

  // Format seconds countdown
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00 (Overdue)';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleArriveClick = async () => {
    setIsSubmitting(true);
    try {
      await onArrive(driver.id, driver.assignedBarangayId);
      setDriver((prev) => ({
        ...prev,
        currentStatus: 'ON_SITE_COLLECTING',
        slaBreachDetected: false,
      }));
      setActionSuccessMessage('Check-in Registered: Marked ON-SITE at ' + driver.assignedBarangayName);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetEta = async (mins: number) => {
    setIsSubmitting(true);
    const targetTimestamp = Date.now() + mins * 60 * 1000;
    const formattedDate = new Date(targetTimestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    try {
      await onUpdateEta(driver.id, mins, formattedDate);
      setDriver((prev) => ({
        ...prev,
        currentStatus: 'IN_TRANSIT',
        targetEtaTimestamp: targetTimestamp,
        targetEtaFormatted: formattedDate,
        slaBreachDetected: false,
      }));
      setActionSuccessMessage(`Route ETA Broadcasted: ${formattedDate} (${mins} mins)`);
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerIncident = async (cause: string, cat: string) => {
    setIsSubmitting(true);
    const newEta = new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    try {
      await onReportIncident(driver.id, {
        cause,
        category: cat,
        rescheduledTime: `${newEta} (+45m Delay)`,
        advisory: 'Garbage truck is delayed on route. Please keep garbage bins safely inside gates.',
      });
      setDriver((prev) => ({
        ...prev,
        currentStatus: 'DELAYED',
        targetEtaFormatted: newEta,
      }));
      setActionSuccessMessage(`Delay Notice Sent: ${cat}`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12 font-sans select-none">
      {/* 1. MOBILE-FIRST DRIVER HEADER */}
      <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                TRUCK DRIVER DISPATCH
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              ID: {driver.employeeId}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {driver.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <span className="text-white font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                  {driver.truckCode}
                </span>
                <span>{driver.truckCallsign}</span>
                <span>•</span>
                <span>District {driver.assignedDistrict}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Barangay</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">
                Brgy. {driver.assignedBarangayName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-mono flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* 2. PRIMARY "ARRIVE" ACTION (HIGH TOUCH-TARGET DIMENSIONS) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Step 1 • Check In Upon Arrival
          </span>
          <h2 className="text-lg font-black text-slate-900">
            Destination: Brgy. {driver.assignedBarangayName}
          </h2>
          <p className="text-xs text-slate-500">
            Tap the button below when your garbage truck arrives in this barangay so residents know collection has started.
          </p>
        </div>

        {/* Big High-Touch Target Button (Height >= 64px) */}
        <button
          type="button"
          id="btn-driver-arrive-action"
          disabled={isSubmitting || driver.currentStatus === 'ON_SITE_COLLECTING'}
          onClick={handleArriveClick}
          className={`w-full min-h-[64px] sm:min-h-[72px] px-6 py-4 rounded-2xl font-black text-base sm:text-lg tracking-wide uppercase transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg active:scale-98 ${
            driver.currentStatus === 'ON_SITE_COLLECTING'
              ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400'
              : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-700/30'
          }`}
        >
          {driver.currentStatus === 'ON_SITE_COLLECTING' ? (
            <>
              <Check className="w-6 h-6 text-emerald-700 stroke-[3]" />
              <span>COLLECTING GARBAGE NOW (ON SITE)</span>
            </>
          ) : (
            <>
              <MapPin className="w-6 h-6 animate-bounce" />
              <span>I HAVE ARRIVED AT {driver.assignedBarangayName.toUpperCase()}</span>
            </>
          )}
        </button>

        {driver.currentStatus === 'ON_SITE_COLLECTING' && (
          <p className="text-xs text-emerald-800 font-semibold text-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            You are checked in. Subscribed residents have been notified that your truck is currently picking up waste on the street.
          </p>
        )}
      </div>

      {/* 3. AUTOMATIC SCHEDULE & DELAY TRACKER */}
      <div className={`rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4 transition-all ${
        isSlaBreached || driver.slaBreachDetected
          ? 'bg-red-50/70 border-red-300 ring-2 ring-red-100'
          : msRemainingToSlaThreshold <= 30_000 && driver.currentStatus === 'IN_TRANSIT'
          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-100'
          : 'bg-slate-900 text-white border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${
              isSlaBreached || driver.slaBreachDetected ? 'text-red-600' : 'text-emerald-400'
            }`} />
            <h3 className={`text-xs font-bold tracking-wider uppercase ${
              isSlaBreached || driver.slaBreachDetected ? 'text-red-900' : 'text-slate-300'
            }`}>
              Schedule Tracker & Delay Alert
            </h3>
          </div>

          {/* Status Badge */}
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            driver.currentStatus === 'ON_SITE_COLLECTING'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : isSlaBreached || driver.slaBreachDetected
              ? 'bg-red-600 text-white animate-pulse'
              : msRemainingToSlaThreshold <= 30_000
              ? 'bg-amber-500 text-slate-950 font-black animate-bounce'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {driver.currentStatus === 'ON_SITE_COLLECTING'
              ? 'ARRIVED ON SITE'
              : isSlaBreached || driver.slaBreachDetected
              ? 'LATE (DELAY NOTICE SENT)'
              : msRemainingToSlaThreshold <= 30_000
              ? 'APPROACHING ESTIMATED TIME'
              : 'ON SCHEDULE'}
          </span>
        </div>

        {/* Live Countdown Visualizer */}
        <div className={`grid grid-cols-2 gap-3 p-4 rounded-2xl border font-mono ${
          isSlaBreached || driver.slaBreachDetected
            ? 'bg-red-100/70 border-red-300 text-red-950'
            : 'bg-slate-950/80 border-slate-800 text-white'
        }`}>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Arrival Time</span>
            <span className="text-xl sm:text-2xl font-black">
              {driver.targetEtaFormatted || '11:00 AM'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Status / Countdown</span>
            <span className={`text-xl sm:text-2xl font-black ${
              isSlaBreached || driver.slaBreachDetected ? 'text-red-600' : 'text-emerald-400'
            }`}>
              {driver.currentStatus === 'ON_SITE_COLLECTING'
                ? 'COMPLETED'
                : formatCountdown(msRemainingToSlaThreshold)}
            </span>
          </div>
        </div>

        <p className={`text-xs leading-relaxed ${
          isSlaBreached || driver.slaBreachDetected ? 'text-red-900 font-semibold' : 'text-slate-400'
        }`}>
          {isSlaBreached || driver.slaBreachDetected
            ? '⚠️ Automatic Delay Notice Sent: Because your truck did not arrive within 1 minute of your estimated time, residents were notified that pickup is delayed.'
            : 'Notice Rule: If your truck is more than 1 minute late past your estimated time, an automatic delay notice is sent to residents so they know you are running behind schedule.'}
        </p>

        {/* One-tap buffer extension */}
        {(isSlaBreached || msRemainingToSlaThreshold <= 60_000) && driver.currentStatus !== 'ON_SITE_COLLECTING' && (
          <button
            type="button"
            onClick={() => handleSetEta(10)}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ADD +10 MINUTES (UPDATE ESTIMATED ARRIVAL TIME)</span>
          </button>
        )}
      </div>

      {/* 4. MANUAL / AUTO ETA BROADCAST FORM */}
      {/* 4. SET ESTIMATED ARRIVAL TIME */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Step 2 • Update Arrival Time
          </span>
          <h3 className="text-base font-black text-slate-900">
            Set Estimated Arrival Time
          </h3>
          <p className="text-xs text-slate-500">
            Select or enter how many minutes until you reach this barangay. Subscribed residents will see your updated arrival time.
          </p>
        </div>

        {/* Quick ETA Presets (Touch targets min-h 48px) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          {[5, 10, 15, 30].map((mins) => (
            <button
              key={mins}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSetEta(mins)}
              className="min-h-[48px] py-3 px-3 bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 hover:border-emerald-500 rounded-xl font-bold text-xs sm:text-sm text-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>+{mins} Mins</span>
            </button>
          ))}
        </div>

        {/* Custom Minutes Input */}
        <div className="pt-2 flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={180}
            value={customEtaMins}
            onChange={(e) => setCustomEtaMins(Number(e.target.value))}
            className="w-28 px-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-emerald-600"
            placeholder="Minutes"
          />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSetEta(customEtaMins)}
            className="flex-1 min-h-[44px] py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Send Arrival Time ({customEtaMins} mins)</span>
          </button>
        </div>
      </div>

      {/* 5. QUICK ON-ROAD INCIDENT / DELAY REPORT */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Step 3 • Report a Problem on the Road
          </span>
          <h3 className="text-base font-black text-slate-900">
            Report Road Delay or Truck Breakdown
          </h3>
          <p className="text-xs text-slate-500">
            Stuck in flood, heavy traffic, or mechanical breakdown? Tap a reason below to send a delay notice to residents of {driver.assignedBarangayName}.
          </p>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() =>
              handleTriggerIncident(
                'Flash flooding on the road. Truck is taking an alternate route.',
                'Typhoon / Severe Weather'
              )
            }
            className="p-3 text-left bg-amber-50/60 hover:bg-amber-100/70 border border-amber-300 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Flooded Road (Cannot Pass)</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Street is flooded. Reroutes truck and notifies residents of delay.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTriggerIncident(
                'Garbage truck mechanical issue. Backup truck requested from depot.',
                'Truck Mechanical Issue'
              )
            }
            className="p-3 text-left bg-red-50/60 hover:bg-red-100/70 border border-red-300 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-red-900 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Truck Mechanical Breakdown</span>
            </div>
            <p className="text-[11px] text-red-800">
              Engine or hydraulic issue. Alerts dispatch and requests replacement truck.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTriggerIncident(
                'Heavy traffic jam delaying truck arrival.',
                'Road Closure / Heavy Traffic'
              )
            }
            className="p-3 text-left bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4 text-slate-600" />
              <span>Heavy Traffic Jam</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Severe road gridlock slowing down truck progress.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTriggerIncident(
                'Emergency road rehabilitation closing main village access gate.',
                'Emergency Rerouting'
              )
            }
            className="p-3 text-left bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Sliders className="w-4 h-4 text-slate-600" />
              <span>Road Construction Detour</span>
            </div>
            <p className="text-[11px] text-slate-600">
              DPWH water pipe repair or street closure.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
