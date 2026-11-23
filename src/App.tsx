import { useState, useEffect, useCallback } from 'react';
import { 
  BarangaySchedule, 
  WasteNotification, 
  WasteType, 
  AuthSession, 
  ResidentUser, 
  DriverUser 
} from './types';
import { QC_BARANGAYS } from './data/qcBarangays';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { ResidentDashboard } from './components/ResidentDashboard';
import { GovernmentOfficialDashboard } from './components/GovernmentOfficialDashboard';
import { DriverPortal } from './components/DriverPortal';
import { PushNotificationModal } from './components/PushNotificationModal';
import { NotificationCenter } from './components/NotificationCenter';
import { playNotificationChime } from './utils/audioAlert';

export default function App() {
  const [barangays, setBarangays] = useState<BarangaySchedule[]>(QC_BARANGAYS);

  // Multi-tenant RBAC Session & Bearer Token State (held strictly in memory)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Official portal subtab navigation: Dispatcher CRUD table | Notification logs
  const [officialTab, setOfficialTab] = useState<'dispatcher' | 'notifications'>('dispatcher');

  // Push modal notification state
  const [activeModalNotification, setActiveModalNotification] = useState<WasteNotification | null>(null);

  // Real-time SSE Connection state
  const [isSseConnected, setIsSseConnected] = useState<boolean>(false);

  // Initial Notifications State
  const [notifications, setNotifications] = useState<WasteNotification[]>([
    {
      id: 'notif-batasan-delay',
      barangayId: 'brgy-batasan-hills',
      barangayName: 'Batasan Hills',
      district: 2,
      type: 'DELAY_ALERT',
      title: '⚠️ Collection Delayed: Brgy. Batasan Hills',
      scheduledDate: 'Monday, Sep 14, 2026',
      scheduledTime: '11:00 AM (Delayed from 06:30 AM)',
      causeOfDelay:
        'Tropical Storm / Monsoon Rains: Flash flooding along Batasan-San Mateo Road. Garbage truck temporarily rerouted.',
      delayCategory: 'Typhoon / Severe Weather',
      originalTime: '06:30 AM',
      rescheduledDate: 'Monday, Sep 14, 2026',
      rescheduledTime: '11:00 AM',
      advisory:
        'Please keep sealed garbage bins inside your gates until the rescheduled 11:00 AM pickup to prevent waterborne contamination.',
      timestamp: '15 mins ago',
      isRead: false,
      severity: 'warning',
      updatedBy: 'Engr. Maria Teresa Bautista (QC-EPWMD-8821)',
    },
    {
      id: 'notif-cubao-delay',
      barangayId: 'brgy-socorro-cubao',
      barangayName: 'Socorro (Cubao)',
      district: 3,
      type: 'DELAY_ALERT',
      title: '⚠️ Collection Delayed: Brgy. Socorro (Cubao)',
      scheduledDate: 'Tonight, Sep 13, 2026',
      scheduledTime: '10:15 PM (Delayed from 08:30 PM)',
      causeOfDelay:
        'Mechanical breakdown (hydraulic lift issue) on the garbage truck along Aurora Blvd. Replacement truck dispatched.',
      delayCategory: 'Truck Mechanical Issue',
      originalTime: '08:30 PM',
      rescheduledDate: 'Tonight, Sep 13, 2026',
      rescheduledTime: '10:15 PM',
      advisory: 'Replacement truck QC-TRK-315 is en route from Cubao Depot.',
      timestamp: '10 mins ago',
      isRead: false,
      severity: 'warning',
      updatedBy: 'Supervisor Roberto Reyes (QC-EPWMD-4019)',
    },
    {
      id: 'notif-commonwealth-sched',
      barangayId: 'brgy-commonwealth',
      barangayName: 'Commonwealth',
      district: 2,
      type: 'SCHEDULED_REMINDER',
      title: '🔔 Garbage Pickup Reminder: Brgy. Commonwealth',
      scheduledDate: 'Tuesday, Sep 15, 2026',
      scheduledTime: '07:00 AM',
      advisory: 'Residual & non-biodegradable waste pickup. Please place bins by 6:30 AM.',
      timestamp: '1 hour ago',
      isRead: true,
      severity: 'normal',
      updatedBy: 'QC EPWMD Auto-Scheduler',
    },
  ]);

  // Initial load from backend API
  useEffect(() => {
    fetch('/api/barangays')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBarangays(data.data);
        }
      })
      .catch((err) => {
        console.debug('Backend /api/barangays fallback:', err);
      });

    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      })
      .catch((err) => {
        console.debug('Backend /api/notifications fallback:', err);
      });
  }, []);

  // Sync authSession & token in memory
  const handleSessionChange = useCallback((session: AuthSession | null, token: string | null = null) => {
    setAuthSession(session);
    setAuthToken(session ? token : null);
  }, []);

  // Real-Time Server-Sent Events (SSE) Pub/Sub Listener & 1-Minute Watchdog Receiver
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');

      es.onopen = () => {
        setIsSseConnected(true);
      };

      es.onerror = () => {
        setIsSseConnected(false);
      };

      es.addEventListener('CONNECTED', () => {
        setIsSseConnected(true);
      });

      // Automated 1-Minute SLA Threshold Violation Event Listener
      es.addEventListener('SLA_VIOLATION', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const { barangayId, notification, driver } = payload;

          if (notification) {
            setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
            playNotificationChime(true);

            // Update barangay status in state
            setBarangays((prev) =>
              prev.map((b) =>
                b.id === barangayId
                  ? {
                      ...b,
                      status: 'DELAYED' as const,
                      currentDelay: {
                        cause: notification.causeOfDelay || 'Truck running late past estimated arrival time',
                        category: (notification.delayCategory as any) || 'Road Closure / Heavy Traffic',
                        originalDate: notification.scheduledDate,
                        originalTime: notification.originalTime || 'Scheduled Window',
                        rescheduledDate: notification.rescheduledDate || 'Today',
                        rescheduledTime: notification.rescheduledTime || 'Delayed',
                        reportedAt: 'Automatic Delay Alert',
                        advisoryNote: notification.advisory || '',
                      },
                    }
                  : b
              )
            );

            // Targeted delivery: Pop-up modal dispatched exclusively to residents subscribed to this barangay
            if (authSession?.role === 'RESIDENT') {
              const resident = authSession.user as ResidentUser;
              const isSubscribed =
                resident.subscribedBarangayIds.includes(barangayId) ||
                resident.homeBarangayId === barangayId;

              if (isSubscribed) {
                setActiveModalNotification(notification);
              }
            }
          }

          // If driver is currently active in session and matches this driver, sync driver state
          if (authSession?.role === 'DRIVER' && authSession.user.id === driver?.id) {
            const updatedDriver = { ...authSession.user, currentStatus: 'DELAYED' as const, slaBreachDetected: true };
            setAuthSession({ role: 'DRIVER', user: updatedDriver });
          }
        } catch (err) {
          console.error('Error handling SLA_VIOLATION event:', err);
        }
      });

      // Driver Arrived Event
      es.addEventListener('DRIVER_ARRIVED', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const { barangayId, driver } = payload;

          setBarangays((prev) =>
            prev.map((b) =>
              b.id === barangayId
                ? { ...b, status: 'IN_PROGRESS' as const, currentDelay: undefined }
                : b
            )
          );

          if (authSession?.role === 'DRIVER' && authSession.user.id === driver?.id) {
            const updatedDriver = { ...authSession.user, currentStatus: 'ON_SITE_COLLECTING' as const, slaBreachDetected: false };
            setAuthSession({ role: 'DRIVER', user: updatedDriver });
          }
        } catch (err) {
          console.error('Error handling DRIVER_ARRIVED event:', err);
        }
      });

      // Driver ETA Updated Event
      es.addEventListener('DRIVER_ETA_UPDATED', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const { driver } = payload;
          if (driver?.assignedBarangayId) {
            setBarangays((prev) =>
              prev.map((b) =>
                b.id === driver.assignedBarangayId
                  ? { ...b, nextScheduledTime: driver.targetEtaFormatted }
                  : b
              )
            );
          }

          if (authSession?.role === 'DRIVER' && authSession.user.id === driver?.id) {
            setAuthSession({ role: 'DRIVER', user: driver });
          }
        } catch (err) {
          console.error('Error handling DRIVER_ETA_UPDATED event:', err);
        }
      });

      // Driver Incident Event
      es.addEventListener('DRIVER_INCIDENT', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const { driver } = payload;
          if (authSession?.role === 'DRIVER' && authSession.user.id === driver?.id) {
            setAuthSession({ role: 'DRIVER', user: driver });
          }
        } catch (err) {
          console.error('Error handling DRIVER_INCIDENT event:', err);
        }
      });

      // Generic Notification Broadcast (Advisories, Delays, Schedule Updates)
      es.addEventListener('NOTIFICATION', (e: MessageEvent) => {
        try {
          const notif = JSON.parse(e.data) as WasteNotification;
          if (notif && notif.id) {
            setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
            const isWarning = notif.type === 'DELAY_ALERT' || notif.severity === 'warning';
            playNotificationChime(isWarning);

            // Pub/Sub filtering: Only pop-up modal if resident is subscribed
            if (authSession?.role === 'RESIDENT') {
              const resident = authSession.user as ResidentUser;
              const isSubscribed =
                resident.subscribedBarangayIds.includes(notif.barangayId) ||
                resident.homeBarangayId === notif.barangayId;

              if (isSubscribed) {
                setActiveModalNotification(notif);
              }
            }
          }
        } catch (err) {
          console.error('Error handling NOTIFICATION event:', err);
        }
      });

      // Data Synchronization Bus
      es.addEventListener('DATA_SYNC', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.barangays)) setBarangays(data.barangays);
          if (Array.isArray(data.notifications)) setNotifications(data.notifications);
        } catch (err) {
          console.error('Error handling DATA_SYNC event:', err);
        }
      });
    } catch (e) {
      console.debug('SSE event source connection error:', e);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [authSession, handleSessionChange]);

  // Resident Pub/Sub Subscription Toggle
  const handleToggleSubscription = useCallback(
    async (barangayId: string) => {
      if (!authSession || authSession.role !== 'RESIDENT') return;
      const resident = authSession.user as ResidentUser;

      const isSubscribed = resident.subscribedBarangayIds.includes(barangayId);
      const updatedIds = isSubscribed
        ? resident.subscribedBarangayIds.filter((id) => id !== barangayId)
        : [...resident.subscribedBarangayIds, barangayId];

      const updatedResident: ResidentUser = {
        ...resident,
        subscribedBarangayIds: updatedIds,
      };

      setAuthSession({ role: 'RESIDENT', user: updatedResident });

      if (authToken) {
        fetch('/api/resident/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ barangayId }),
        }).catch(() => {});
      }

      // Immediate confirmation alert if subscribing
      if (!isSubscribed) {
        const target = barangays.find((b) => b.id === barangayId);
        if (target) {
          const confirmNotif: WasteNotification = {
            id: `notif-sub-${Date.now()}`,
            barangayId: target.id,
            barangayName: target.name,
            district: target.district,
            type: target.status === 'DELAYED' ? 'DELAY_ALERT' : 'SCHEDULED_REMINDER',
            title: target.status === 'DELAYED'
              ? `⚠️ Subscribed to Delayed Pickup Alerts: Brgy. ${target.name}`
              : `🔔 Subscribed to Alerts: Brgy. ${target.name}`,
            scheduledDate: target.status === 'DELAYED' && target.currentDelay ? target.currentDelay.rescheduledDate : target.nextScheduledDate,
            scheduledTime: target.status === 'DELAYED' && target.currentDelay ? target.currentDelay.rescheduledTime : target.nextScheduledTime,
            causeOfDelay: target.currentDelay?.cause,
            delayCategory: target.currentDelay?.category,
            advisory: target.currentDelay
              ? target.currentDelay.advisoryNote
              : `You are now subscribed to real-time garbage truck arrival updates and delay announcements for ${target.name}.`,
            timestamp: 'Just now',
            isRead: false,
            severity: target.status === 'DELAYED' ? 'warning' : 'normal',
            updatedBy: 'QC Waste Watch Notification Service',
          };
          setNotifications((prev) => [confirmNotif, ...prev]);
          setActiveModalNotification(confirmNotif);
          playNotificationChime(target.status === 'DELAYED');
        }
      }
    },
    [authSession, authToken, barangays]
  );

  // --- TRUCK DRIVER ACTIONS ---

  const handleDriverArrive = async (driverId: string, barangayId: string) => {
    try {
      const res = await fetch('/api/driver/arrive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ driverId, barangayId }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          if (authSession?.role === 'DRIVER') {
            setAuthSession({ role: 'DRIVER', user: result.driver });
          }
          setBarangays((prev) =>
            prev.map((b) => (b.id === barangayId ? { ...b, status: 'IN_PROGRESS' as const, currentDelay: undefined } : b))
          );
          if (result.notification) {
            setNotifications((prev) => [result.notification, ...prev]);
          }
        }
      }
    } catch (e) {
      console.debug('Driver arrive error:', e);
    }
  };

  const handleDriverUpdateEta = async (driverId: string, etaMinutes: number, etaFormatted: string) => {
    try {
      const res = await fetch('/api/driver/eta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ driverId, etaMinutes, etaFormatted }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          if (authSession?.role === 'DRIVER') {
            setAuthSession({ role: 'DRIVER', user: result.driver });
          }
          if (result.notification) {
            setNotifications((prev) => [result.notification, ...prev]);
          }
        }
      }
    } catch (e) {
      console.debug('Driver ETA error:', e);
    }
  };

  const handleDriverReportIncident = async (
    driverId: string,
    payload: { cause: string; category: string; rescheduledTime: string; advisory: string }
  ) => {
    try {
      const res = await fetch('/api/driver/incident', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ driverId, ...payload }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          if (authSession?.role === 'DRIVER') {
            setAuthSession({ role: 'DRIVER', user: result.driver });
          }
          if (result.barangay) {
            setBarangays((prev) => prev.map((b) => (b.id === result.barangay.id ? result.barangay : b)));
          }
          if (result.notification) {
            setNotifications((prev) => [result.notification, ...prev]);
          }
        }
      }
    } catch (e) {
      console.debug('Driver incident error:', e);
    }
  };

  // --- GOVERNMENT ADMIN OPERATIONS ---

  const handleAdminUpdateSchedule = async (
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
  ) => {
    try {
      const res = await fetch(`/api/admin/barangays/${barangayId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setBarangays((prev) =>
            prev.map((b) => (b.id === barangayId ? result.barangay : b))
          );
          setNotifications((prev) => [result.notification, ...prev]);
          return;
        }
      }
    } catch (e) {
      console.debug('Admin update schedule error:', e);
    }
  };

  const handleAdminInputDelay = async (
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
  ) => {
    try {
      const res = await fetch(`/api/admin/barangays/${barangayId}/delay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setBarangays((prev) =>
            prev.map((b) => (b.id === barangayId ? result.barangay : b))
          );
          setNotifications((prev) => [result.notification, ...prev]);
          return;
        }
      }
    } catch (e) {
      console.debug('Admin input delay error:', e);
    }
  };

  const handleAdminResolveDelay = async (
    barangayId: string,
    payload: {
      adminOfficialName: string;
      nextDate: string;
      nextTime: string;
      resolutionNote: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/admin/barangays/${barangayId}/resolve-delay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setBarangays((prev) =>
            prev.map((b) => (b.id === barangayId ? result.barangay : b))
          );
          setNotifications((prev) => [result.notification, ...prev]);
          return;
        }
      }
    } catch (e) {
      console.debug('Admin resolve delay error:', e);
    }
  };

  const handleAdminOverrideEta = async (
    barangayId: string,
    payload: {
      newEtaTime: string;
      adminOfficialName: string;
      reason: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/admin/barangays/${barangayId}/override-eta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setBarangays((prev) =>
            prev.map((b) => (b.id === barangayId ? result.barangay : b))
          );
          if (result.notification) {
            setNotifications((prev) => [result.notification, ...prev]);
          }
          return;
        }
      }
    } catch (e) {
      console.debug('Admin override ETA error:', e);
    }
  };

  // Generic Notification Trigger (used in simulation)
  const handleTriggerNotification = useCallback(
    (notifData: Omit<WasteNotification, 'id' | 'timestamp' | 'isRead'>) => {
      const newNotif: WasteNotification = {
        ...notifData,
        id: `notif-${Date.now()}`,
        timestamp: 'Just now',
        isRead: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setActiveModalNotification(newNotif);
      playNotificationChime(newNotif.type === 'DELAY_ALERT');
    },
    []
  );

  const handleLogout = () => {
    handleSessionChange(null);
    setActiveModalNotification(null);
  };

  // Request browser notification permission once loaded
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const timeout = setTimeout(() => {
        try {
          Notification.requestPermission();
        } catch (e) {
          console.debug('Notification permission request ignored:', e);
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-emerald-200">
      {/* Decoupled Role Header (or null if not logged in) */}
      {authSession && (
        <Header
          session={authSession}
          onLogout={handleLogout}
          activeOfficialTab={officialTab}
          setActiveOfficialTab={setOfficialTab}
          notifications={notifications}
          onOpenNotifications={() => {
            if (authSession.role === 'OFFICIAL') {
              setOfficialTab('notifications');
            }
          }}
        />
      )}

      {/* Main Viewport Guarding */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!authSession ? (
          <AuthScreen
            onLogin={(session, token) => handleSessionChange(session, token)}
            availableBarangays={barangays}
          />
        ) : authSession.role === 'RESIDENT' ? (
          /* ISOLATED VIEW 1: RESTRICTED RESIDENT VIEWPORT (Strictly NO Admin/Driver Telemetry Controls) */
          <ResidentDashboard
            currentUser={authSession.user}
            barangays={barangays}
            notifications={notifications}
            onToggleSubscription={handleToggleSubscription}
            onSelectNotification={(notif) => setActiveModalNotification(notif)}
            isSseConnected={isSseConnected}
          />
        ) : authSession.role === 'OFFICIAL' ? (
          /* ISOLATED VIEW 2: GOVERNMENT OFFICIAL / ADMIN HANDLER PORTAL */
          <div className="space-y-6">
            {officialTab === 'dispatcher' && (
              <GovernmentOfficialDashboard
                currentOfficial={authSession.user}
                barangays={barangays}
                notifications={notifications}
                onUpdateSchedule={handleAdminUpdateSchedule}
                onInputDelay={handleAdminInputDelay}
                onResolveDelay={handleAdminResolveDelay}
                onOverrideEta={handleAdminOverrideEta}
                onLogout={handleLogout}
              />
            )}

            {officialTab === 'notifications' && (
              <NotificationCenter
                notifications={notifications}
                onSelectNotification={(notif) => setActiveModalNotification(notif)}
                onClearAll={() => setNotifications([])}
                onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
                onOpenDispatcher={() => setOfficialTab('dispatcher')}
              />
            )}
          </div>
        ) : authSession.role === 'DRIVER' ? (
          /* ISOLATED VIEW 3: COLLECTION TRUCK DRIVER MOBILE TELEMETRY PORTAL */
          <DriverPortal
            currentDriver={authSession.user as DriverUser}
            barangays={barangays}
            onArrive={handleDriverArrive}
            onUpdateEta={handleDriverUpdateEta}
            onReportIncident={handleDriverReportIncident}
            onLogout={handleLogout}
          />
        ) : null}
      </main>

      {/* Real-Time Push Notification Pop-up Modal */}
      <PushNotificationModal
        notification={activeModalNotification}
        onDismiss={() => setActiveModalNotification(null)}
        onViewBarangay={(bId) => {
          setActiveModalNotification(null);
          setTimeout(() => {
            const card = document.getElementById(`resident-card-${bId}`) || document.getElementById(`card-${bId}`);
            if (card) {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              card.classList.add('ring-4', 'ring-emerald-400');
              setTimeout(() => card.classList.remove('ring-4', 'ring-emerald-400'), 2500);
            }
          }, 200);
        }}
      />

      {/* Civic Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">QC Waste Watch</span>
            <span>•</span>
            <span>Quezon City Environmental Protection and Waste Management Department (EPWMD)</span>
          </div>
          <p className="text-slate-400">
            Official Garbage Collection System: Residents • City Officials • Garbage Truck Drivers
          </p>
        </div>
      </footer>
    </div>
  );
}
