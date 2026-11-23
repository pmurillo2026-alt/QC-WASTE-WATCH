import React, { useState, useEffect } from 'react';
import { WasteNotification } from '../types';
import { 
  BellRing, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  X, 
  Check, 
  Share2, 
  ShieldAlert, 
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { playNotificationChime } from '../utils/audioAlert';

interface PushNotificationModalProps {
  notification: WasteNotification | null;
  onDismiss: () => void;
  onViewBarangay?: (barangayId: string) => void;
}

export function PushNotificationModal({
  notification,
  onDismiss,
  onViewBarangay,
}: PushNotificationModalProps) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (notification) {
      setAcknowledged(false);
      setCopied(false);
      // Play audible chime when notification arrives
      playNotificationChime(notification.type === 'DELAY_ALERT');

      // Also trigger standard browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.causeOfDelay
              ? `Cause: ${notification.causeOfDelay} | New Time: ${notification.rescheduledTime || notification.scheduledTime}`
              : `Pickup scheduled for ${notification.scheduledDate} at ${notification.scheduledTime}`,
            icon: '/assets/icon.png',
          });
        } catch (e) {
          console.debug('Browser notification error:', e);
        }
      }
    }
  }, [notification]);

  if (!notification) return null;

  const isDelay = notification.type === 'DELAY_ALERT';

  const handleShare = () => {
    const textToShare = `[QC Waste Watch Alert]
${notification.title}
Barangay: ${notification.barangayName}
Scheduled Date: ${notification.scheduledDate}
Scheduled Time: ${notification.scheduledTime}
${notification.causeOfDelay ? `⚠️ CAUSE OF DELAY: ${notification.causeOfDelay}\nRescheduled Time: ${notification.rescheduledTime || 'TBA'}\n` : ''}
${notification.advisory ? `Resident Advisory: ${notification.advisory}` : ''}
- Sent via Quezon City EPWMD Alert Network`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    setTimeout(() => {
      onDismiss();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="push-notification-popup"
        className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 transform scale-100 ${
          isDelay 
            ? 'border-amber-400 ring-4 ring-amber-100' 
            : 'border-emerald-300 ring-4 ring-emerald-50'
        }`}
      >
        {/* Device Push Notification Header Bar */}
        <div className={`px-5 py-3.5 flex items-center justify-between ${
          isDelay ? 'bg-amber-600 text-white' : 'bg-emerald-700 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              {isDelay ? <AlertTriangle className="w-4 h-4 text-white" /> : <BellRing className="w-4 h-4 text-white" />}
            </div>
            <div>
              <div className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                <span>QC Waste Watch</span>
                <span className="opacity-75 text-[10px]">• EPWMD Push Notification</span>
              </div>
              <div className="text-[11px] opacity-90">
                Live Dispatch Alert • Just now
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Main Title & Barangay Tag */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isDelay ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {isDelay ? '⚠️ DELAY NOTICE' : '✅ SCHEDULE REMINDER'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Brgy. {notification.barangayName} (Dist. {notification.district})
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {notification.title}
            </h2>
          </div>

          {/* Scheduled Date and Time Highlight Box (Required Feature 3) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Scheduled Date
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">
                {notification.scheduledDate}
              </div>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Scheduled Time
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">
                {notification.scheduledTime}
              </div>
            </div>
          </div>

          {/* REAL-TIME TRUCK LOCATION & ARRIVAL STRIP */}
          {(notification.telemetryDistanceKm !== undefined || notification.telemetryEtaFormatted) && (
            <div className="bg-slate-950 text-white p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono shadow-md">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 font-bold">Truck Location:</span>
                {notification.telemetryDistanceKm !== undefined && (
                  <span className="text-cyan-300 font-bold">{notification.telemetryDistanceKm} km away</span>
                )}
              </div>
              {notification.telemetryEtaFormatted && (
                <div className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg font-bold border border-emerald-500/30">
                  Arriving in: {notification.telemetryEtaFormatted}
                </div>
              )}
            </div>
          )}

          {/* REASON FOR DELAY */}
          {isDelay && notification.causeOfDelay && (
            <div className="bg-amber-50/90 rounded-2xl p-4 sm:p-5 border-2 border-amber-300/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Reason for Delay:</span>
                </div>
                {notification.delayCategory && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono">
                    {notification.delayCategory}
                  </span>
                )}
              </div>

              {/* The exact reason/cause for delay */}
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200/80 text-xs sm:text-sm text-amber-950 font-semibold leading-relaxed">
                &ldquo;{notification.causeOfDelay}&rdquo;
              </div>

              {/* Original vs Rescheduled Times */}
              <div className="flex items-center justify-between text-xs bg-amber-100/60 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                <div>
                  <span className="text-amber-700 block text-[10px] font-bold uppercase">Original Time</span>
                  <span className="line-through font-semibold text-slate-500">
                    {notification.originalTime || notification.scheduledTime}
                  </span>
                </div>
                <div className="text-amber-500 font-black">→</div>
                <div className="text-right">
                  <span className="text-amber-800 block text-[10px] font-bold uppercase">New Rescheduled Time</span>
                  <strong className="text-amber-950 font-black text-xs sm:text-sm">
                    {notification.rescheduledTime || 'Estimated 2-3 hours later'}
                  </strong>
                </div>
              </div>

              {/* Why notice was sent */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-amber-800 leading-normal">
                  <strong>Why this notice was sent:</strong> Quezon City sends this alert whenever garbage collection is delayed by bad weather, flooded roads, or traffic so you know when the truck will arrive.
                </p>
                {notification.updatedBy && (
                  <div className="text-[10px] text-amber-900 font-medium pt-1 border-t border-amber-200/60 flex items-center justify-between">
                    <span>Authorized Official: <strong>{notification.updatedBy}</strong></span>
                    <span className="font-mono text-[9px] bg-amber-200/80 px-1.5 py-0.5 rounded">QC-VERIFIED</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resident Advisory instructions */}
          {notification.advisory && (
            <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-slate-900">Resident Action Required: </strong>
                {notification.advisory}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share with Barangay GC</span>
              </>
            )}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {onViewBarangay && (
              <button
                type="button"
                onClick={() => {
                  onViewBarangay(notification.barangayId);
                  onDismiss();
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-all"
              >
                View Barangay
              </button>
            )}

            <button
              type="button"
              id="btn-acknowledge-notification"
              onClick={handleAcknowledge}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                acknowledged 
                  ? 'bg-emerald-800 scale-95' 
                  : isDelay
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-700/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
              }`}
            >
              {acknowledged ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Acknowledged!</span>
                </>
              ) : (
                <span>Acknowledge Alert</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
