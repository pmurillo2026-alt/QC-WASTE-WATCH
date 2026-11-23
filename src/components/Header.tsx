import { AuthSession, WasteNotification } from '../types';
import { Bell, LogOut, BadgeCheck } from 'lucide-react';
import { LogoMark } from './LogoMark';

interface HeaderProps {
  session: AuthSession;
  onLogout: () => void;
  activeOfficialTab?: 'dispatcher' | 'notifications';
  setActiveOfficialTab?: (tab: 'dispatcher' | 'notifications') => void;
  notifications: WasteNotification[];
  onOpenNotifications: () => void;
}

export function Header({
  session,
  onLogout,
  activeOfficialTab = 'dispatcher',
  setActiveOfficialTab,
  notifications,
  onOpenNotifications,
}: HeaderProps) {
  if (!session) return null;

  const role = session.role;

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

  const roleLabel =
    role === 'RESIDENT'
      ? 'Resident'
      : role === 'OFFICIAL'
      ? 'City Official'
      : 'Truck Driver';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-18">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3 min-w-0">
            <LogoMark size="sm" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 whitespace-nowrap shrink-0">
                  QC Waste Watch
                </span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-emerald-700 hidden sm:inline whitespace-nowrap shrink-0">
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden md:block truncate">
                Quezon City Environmental Protection and Waste Management Department
              </p>
            </div>
          </div>

          {/* Navigation Controls: strictly decoupled by role */}
          <div className="flex items-center gap-3 shrink-0">
            {role === 'OFFICIAL' && setActiveOfficialTab && (
              <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  id="tab-btn-official-dispatcher"
                  onClick={() => setActiveOfficialTab('dispatcher')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeOfficialTab === 'dispatcher'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manage Schedules & Delays
                </button>

                <button
                  type="button"
                  id="tab-btn-official-notifications"
                  onClick={() => setActiveOfficialTab('notifications')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeOfficialTab === 'notifications'
                      ? 'bg-slate-900 text-white'
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
                title="View alerts and announcements"
                aria-label="View alerts and announcements"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white bg-emerald-600 tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1 whitespace-nowrap">
                  <span>{session.user.fullName}</span>
                  {role === 'OFFICIAL' && <BadgeCheck className="w-3.5 h-3.5 text-amber-500" />}
                </div>

                <div className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap">
                  {role === 'RESIDENT' && (
                    <span>
                      {session.user.subscribedBarangayIds.length}{' '}
                      {session.user.subscribedBarangayIds.length === 1 ? 'Barangay' : 'Barangays'} Followed
                    </span>
                  )}
                  {role === 'OFFICIAL' && (
                    <span>{session.user.badgeNumber} · City Official</span>
                  )}
                  {role === 'DRIVER' && (
                    <span className="text-emerald-700 font-bold">
                      {session.user.truckCode} · Brgy. {session.user.assignedBarangayName}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                id="user-logout-btn"
                onClick={onLogout}
                title={`Sign out (${roleLabel})`}
                aria-label="Sign out"
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-slate-200 hover:border-red-200 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
