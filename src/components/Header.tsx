import React from 'react';
import { AuthSession, WasteNotification } from '../types';
import { 
  Bell, 
  Truck, 
  MapPin, 
  LogOut, 
  ShieldCheck, 
  Building2, 
  Activity, 
  Radio, 
  BadgeCheck,
  User
} from 'lucide-react';

interface HeaderProps {
  session: AuthSession;
  onLogout: () => void;
  activeOfficialTab?: 'dispatcher' | 'notifications';
  setActiveOfficialTab?: (tab: 'dispatcher' | 'notifications') => void;
  notifications: WasteNotification[];
  onOpenNotifications: () => void;
  isSseConnected?: boolean;
}

export function Header({
  session,
  onLogout,
  activeOfficialTab = 'dispatcher',
  setActiveOfficialTab,
  notifications,
  onOpenNotifications,
  isSseConnected = true,
}: HeaderProps) {
  if (!session) return null;

  const role = session.role;

  // Filter unread notifications based on pub/sub
  const relevantNotifications = notifications.filter((n) => {
    if (role === 'RESIDENT') {
      return (
        session.user.subscribedBarangayIds.includes(n.barangayId) ||
        session.user.homeBarangayId === n.barangayId ||
        n.isSlaBreach
      );
    }
    return true;
  });

  const unreadCount = relevantNotifications.filter((n) => !n.isRead).length;
  const delayedCount = relevantNotifications.filter((n) => n.type === 'DELAY_ALERT' && !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Role Badge Branding */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ring-4 ${
              role === 'RESIDENT'
                ? 'bg-emerald-600 text-white shadow-emerald-700/20 ring-emerald-50'
                : role === 'OFFICIAL'
                ? 'bg-slate-900 text-amber-400 shadow-slate-900/20 ring-amber-50'
                : 'bg-teal-700 text-cyan-200 shadow-teal-700/20 ring-teal-50'
            }`}>
              {role === 'RESIDENT' ? (
                <Truck className="w-6 h-6" />
              ) : role === 'OFFICIAL' ? (
                <Building2 className="w-6 h-6" />
              ) : (
                <Truck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  QC Waste Watch
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  role === 'RESIDENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : role === 'OFFICIAL'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  {role === 'RESIDENT'
                    ? 'Resident'
                    : role === 'OFFICIAL'
                    ? 'City Official'
                    : 'Truck Driver'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Quezon City Environmental Protection and Waste Management Department (EPWMD)
              </p>
            </div>
          </div>

          {/* Navigation Controls: strictly decoupled by role */}
          <div className="flex items-center gap-3">
            {/* Government Official Navigation */}
            {role === 'OFFICIAL' && setActiveOfficialTab && (
              <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  id="tab-btn-official-dispatcher"
                  onClick={() => setActiveOfficialTab('dispatcher')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeOfficialTab === 'dispatcher'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manage Schedules & Delays
                </button>

                <button
                  type="button"
                  id="tab-btn-official-notifications"
                  onClick={() => setActiveOfficialTab('notifications')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeOfficialTab === 'notifications'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Alerts & Announcements</span>
                </button>
              </nav>
            )}

            {/* Inbound Alerts Bell (Accessible to Resident and Official) */}
            {role !== 'DRIVER' && (
              <button
                type="button"
                id="header-alerts-btn"
                onClick={onOpenNotifications}
                className="relative p-2.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-slate-200/80"
                title="View notification feed"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white ${
                      delayedCount > 0 ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                  <span>{session.user.fullName}</span>
                  {role === 'OFFICIAL' && <BadgeCheck className="w-3.5 h-3.5 text-amber-500" />}
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  {role === 'RESIDENT' && (
                    <span>QC Resident • {session.user.subscribedBarangayIds.length} {session.user.subscribedBarangayIds.length === 1 ? 'Barangay' : 'Barangays'}</span>
                  )}
                  {role === 'OFFICIAL' && (
                    <span>{session.user.badgeNumber} • Operations Chief</span>
                  )}
                  {role === 'DRIVER' && (
                    <span className="text-emerald-700 font-bold">{session.user.truckCode} ({session.user.assignedBarangayName})</span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                id="user-logout-btn"
                onClick={onLogout}
                title={`Log out ${role.toLowerCase()}`}
                className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
