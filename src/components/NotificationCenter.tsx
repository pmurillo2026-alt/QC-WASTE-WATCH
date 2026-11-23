import React, { useState } from 'react';
import { WasteNotification, ResidentUser } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: WasteNotification[];
  currentUser?: ResidentUser;
  onSelectNotification: (notif: WasteNotification) => void;
  onClearAll: () => void;
  onMarkAllRead: () => void;
  onOpenDispatcher: () => void;
}

export function NotificationCenter({
  notifications,
  currentUser,
  onSelectNotification,
  onClearAll,
  onMarkAllRead,
  onOpenDispatcher,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'ALL' | 'DELAYS' | 'SCHEDULES'>('ALL');

  const filtered = notifications.filter((n) => {
    if (filter === 'DELAYS') return n.type === 'DELAY_ALERT';
    if (filter === 'SCHEDULES') return n.type === 'SCHEDULED_REMINDER';
    return true;
  });

  const delaysCount = notifications.filter((n) => n.type === 'DELAY_ALERT').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Alerts & Announcements
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {notifications.length} Total Alerts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Live alerts and delay announcements for Quezon City barangays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                type="button"
                onClick={onMarkAllRead}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              >
                Mark All Read
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Clear notification history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenDispatcher}
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manage Delays</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Alerts ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('DELAYS')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            filter === 'DELAYS'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Delay Notices ({delaysCount})</span>
        </button>

        <button
          onClick={() => setFilter('SCHEDULES')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            filter === 'SCHEDULES'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pickup Reminders</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isDelay = item.type === 'DELAY_ALERT';

          return (
            <div
              key={item.id}
              onClick={() => onSelectNotification(item)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                isDelay
                  ? 'bg-amber-50/50 hover:bg-amber-50/80 border-amber-300 ring-1 ring-amber-100 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
              } ${!item.isRead ? 'border-l-4 border-l-emerald-600' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isDelay ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isDelay ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isDelay
                            ? 'bg-amber-200/80 text-amber-900 font-mono'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isDelay ? '⚠️ DELAY ALERT' : '✅ SCHEDULED PICKUP'}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Brgy. {item.barangayName} (Dist. {item.district})
                      </span>
                      <span className="text-[11px] text-slate-400">• {item.timestamp}</span>

                      {(item.telemetryEtaFormatted || item.telemetryDistanceKm !== undefined) && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 font-bold">ETA {item.telemetryEtaFormatted}</span>
                          {item.telemetryDistanceKm !== undefined && (
                            <span className="text-slate-400">({item.telemetryDistanceKm} km)</span>
                          )}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                      {item.title}
                    </h3>

                    {/* Scheduled Date & Time row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date: {item.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Time: {item.scheduledTime}
                      </span>
                    </div>

                    {/* Cause of Delay Note Preview */}
                    {isDelay && item.causeOfDelay && (
                      <div className="mt-2 p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium">
                        <div className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                          <span>Cause of Delay:</span>
                        </div>
                        <p className="italic leading-relaxed">&ldquo;{item.causeOfDelay}&rdquo;</p>
                        {item.rescheduledTime && (
                          <div className="mt-1.5 font-bold text-amber-900 text-[11px]">
                            Rescheduled to: <span className="bg-amber-100 px-1.5 py-0.5 rounded">{item.rescheduledTime}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:underline">
                    <span>View Pop-up</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No notifications in this category</h4>
            <p className="text-xs text-slate-500">
              You will receive push pop-ups as soon as your subscribed barangay dispatches garbage trucks or reports disruptions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
