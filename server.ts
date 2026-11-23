import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory backend store seeded with official QC EPWMD data
interface DelayDetails {
  cause: string;
  category: string;
  originalDate: string;
  originalTime: string;
  rescheduledDate: string;
  rescheduledTime: string;
  reportedAt: string;
  advisoryNote: string;
}

interface BarangaySchedule {
  id: string;
  name: string;
  district: number;
  subArea?: string;
  zipCode: string;
  regularDays: string[];
  pickupWindow: string;
  wasteType: string;
  nextScheduledDate: string;
  nextScheduledTime: string;
  contractor: string;
  truckCode: string;
  status: 'ON_SCHEDULE' | 'DELAYED' | 'IN_PROGRESS' | 'COMPLETED';
  currentDelay?: DelayDetails;
}

interface WasteNotification {
  id: string;
  barangayId: string;
  barangayName: string;
  district: number;
  type: 'SCHEDULED_REMINDER' | 'DELAY_ALERT' | 'STATUS_UPDATE';
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  causeOfDelay?: string;
  delayCategory?: string;
  originalTime?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  advisory?: string;
  timestamp: string;
  isRead: boolean;
  severity: 'normal' | 'warning' | 'urgent';
  updatedBy: string;
  telemetryEtaFormatted?: string;
  telemetryDistanceKm?: number;
  isSlaBreach?: boolean;
  driverId?: string;
  truckCode?: string;
}

interface DriverUser {
  id: string;
  fullName: string;
  employeeId: string;
  licenseNumber: string;
  truckCode: string;
  truckCallsign: string;
  contractor: string;
  assignedBarangayId: string;
  assignedBarangayName: string;
  assignedDistrict: number;
  mobileNumber: string;
  currentStatus: 'OFF_DUTY' | 'EN_ROUTE' | 'IN_TRANSIT' | 'ON_SITE_COLLECTING' | 'DELAYED';
  targetEtaTimestamp?: number;
  targetEtaFormatted?: string;
  slaBreachDetected?: boolean;
}

let drivers: DriverUser[] = [
  {
    id: 'driver-nestor',
    fullName: 'Nestor "Kuya Nestor" Alcantara',
    employeeId: 'QC-DRV-2041',
    licenseNumber: 'N02-98-142857',
    truckCode: 'QC-TRK-204',
    truckCallsign: 'HABAGAT-SWEEPER-204',
    contractor: 'QC EPWMD Fleet Sector 2',
    assignedBarangayId: 'brgy-batasan-hills',
    assignedBarangayName: 'Batasan Hills',
    assignedDistrict: 2,
    mobileNumber: '0917-889-2041',
    currentStatus: 'IN_TRANSIT',
    targetEtaTimestamp: Date.now() + 180_000, // 3 min initial ETA
    targetEtaFormatted: '11:00 AM',
    slaBreachDetected: false,
  },
  {
    id: 'driver-rogelio',
    fullName: 'Rogelio "Mang Roger" Cruz',
    employeeId: 'QC-DRV-2182',
    licenseNumber: 'N03-01-384729',
    truckCode: 'QC-TRK-218',
    truckCallsign: 'SIERRA-DELTA-218',
    contractor: 'Metro Solid Waste Consortium - Sector 2',
    assignedBarangayId: 'brgy-commonwealth',
    assignedBarangayName: 'Commonwealth',
    assignedDistrict: 2,
    mobileNumber: '0918-772-2182',
    currentStatus: 'IN_TRANSIT',
    targetEtaTimestamp: Date.now() + 240_000,
    targetEtaFormatted: '07:00 AM',
    slaBreachDetected: false,
  },
  {
    id: 'driver-rommel',
    fullName: 'Rommel Valdez',
    employeeId: 'QC-DRV-3023',
    licenseNumber: 'N01-04-928374',
    truckCode: 'QC-TRK-302',
    truckCallsign: 'CUBAO-BACKUP-315',
    contractor: 'Araneta Center - QC Joint Hauling Team',
    assignedBarangayId: 'brgy-socorro-cubao',
    assignedBarangayName: 'Socorro (Cubao)',
    assignedDistrict: 3,
    mobileNumber: '0920-441-3023',
    currentStatus: 'IN_TRANSIT',
    targetEtaTimestamp: Date.now() + 300_000,
    targetEtaFormatted: '10:15 PM',
    slaBreachDetected: false,
  },
];

// Server-Sent Events (SSE) connections registry
interface SseClient {
  id: string;
  res: express.Response;
}
let sseClients: SseClient[] = [];

function broadcastSse(eventType: string, data: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch {
      // client dropped connection
    }
  });
}

let barangays: BarangaySchedule[] = [
  {
    id: 'brgy-batasan-hills',
    name: 'Batasan Hills',
    district: 2,
    subArea: 'IBP Road & San Mateo Border Area',
    zipCode: '1126',
    regularDays: ['Monday', 'Wednesday', 'Friday'],
    pickupWindow: '06:00 AM - 08:30 AM',
    wasteType: 'Biodegradable (Food & Kitchen Waste)',
    nextScheduledDate: 'Tomorrow (Monday)',
    nextScheduledTime: '06:30 AM',
    contractor: 'QC EPWMD Fleet Sector 2',
    truckCode: 'QC-TRK-204',
    status: 'DELAYED',
    currentDelay: {
      cause: 'Tropical Storm / Monsoon Rains: Flash flooding along Batasan-San Mateo Road. Garbage truck temporarily rerouted.',
      category: 'Typhoon / Severe Weather',
      originalDate: 'Monday, Sep 14, 2026',
      originalTime: '06:30 AM',
      rescheduledDate: 'Monday, Sep 14, 2026',
      rescheduledTime: '11:00 AM',
      reportedAt: '15 mins ago',
      advisoryNote: 'Please keep sealed garbage bins inside your gates until the rescheduled 11:00 AM pickup to prevent waterborne contamination.',
    },
  },
  {
    id: 'brgy-commonwealth',
    name: 'Commonwealth',
    district: 2,
    subArea: 'Litex, Market Area & Don Fabian',
    zipCode: '1121',
    regularDays: ['Tuesday', 'Thursday', 'Saturday'],
    pickupWindow: '07:00 AM - 09:30 AM',
    wasteType: 'Non-Biodegradable (Residual & Plastics)',
    nextScheduledDate: 'Tuesday, Sep 15, 2026',
    nextScheduledTime: '07:00 AM',
    contractor: 'Metro Solid Waste Consortium - Sector 2',
    truckCode: 'QC-TRK-218',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-holy-spirit',
    name: 'Holy Spirit',
    district: 2,
    subArea: 'Doña Juana & Faustino Subdivisions',
    zipCode: '1127',
    regularDays: ['Monday', 'Wednesday', 'Friday'],
    pickupWindow: '06:30 AM - 09:00 AM',
    wasteType: 'Biodegradable (Food & Kitchen Waste)',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '07:15 AM',
    contractor: 'QC EPWMD Fleet Sector 2',
    truckCode: 'QC-TRK-209',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-bagong-silangan',
    name: 'Bagong Silangan',
    district: 2,
    subArea: 'Clemencia & Tumana Riverside Area',
    zipCode: '1119',
    regularDays: ['Monday', 'Wednesday', 'Friday'],
    pickupWindow: '08:00 AM - 10:30 AM',
    wasteType: 'General Waste',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '08:30 AM',
    contractor: 'QC EPWMD Fleet Sector 2',
    truckCode: 'QC-TRK-212',
    status: 'DELAYED',
    currentDelay: {
      cause: 'River water level alert & road mud clearance along Tumana Bridge. Collection truck delayed pending safety clearance.',
      category: 'Typhoon / Severe Weather',
      originalDate: 'Monday, Sep 14, 2026',
      originalTime: '08:30 AM',
      rescheduledDate: 'Monday, Sep 14, 2026',
      rescheduledTime: '01:30 PM',
      reportedAt: '35 mins ago',
      advisoryNote: 'Barangay personnel request residents to secure waste bags above ground level.',
    },
  },
  {
    id: 'brgy-payatas',
    name: 'Payatas',
    district: 2,
    subArea: 'Payatas B & Lupang Pangako',
    zipCode: '1119',
    regularDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    pickupWindow: '05:30 AM - 08:00 AM',
    wasteType: 'Recyclables (Paper, Cartons & Metal)',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '06:00 AM',
    contractor: 'Payatas Eco-Waste Operations',
    truckCode: 'QC-TRK-230',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-socorro-cubao',
    name: 'Socorro (Cubao)',
    district: 3,
    subArea: '15th Avenue & Tuazon Commercial Zone',
    zipCode: '1109',
    regularDays: ['Daily Night Collection'],
    pickupWindow: '08:00 PM - 11:00 PM',
    wasteType: 'Non-Biodegradable (Residual & Plastics)',
    nextScheduledDate: 'Tonight, Sep 13, 2026',
    nextScheduledTime: '08:30 PM',
    contractor: 'Araneta Center - QC Joint Hauling Team',
    truckCode: 'QC-TRK-302',
    status: 'DELAYED',
    currentDelay: {
      cause: 'Mechanical breakdown (hydraulic lift issue) on the garbage truck along Aurora Blvd. Replacement truck dispatched.',
      category: 'Truck Mechanical Issue',
      originalDate: 'Tonight, Sep 13, 2026',
      originalTime: '08:30 PM',
      rescheduledDate: 'Tonight, Sep 13, 2026',
      rescheduledTime: '10:15 PM',
      reportedAt: '10 mins ago',
      advisoryNote: 'Replacement truck QC-TRK-315 is en route from Cubao Depot. Please prepare waste along curb.',
    },
  },
  {
    id: 'brgy-loyola-heights',
    name: 'Loyola Heights',
    district: 3,
    subArea: 'Katipunan Ave & Esteban Abada',
    zipCode: '1108',
    regularDays: ['Monday', 'Thursday'],
    pickupWindow: '06:00 AM - 08:30 AM',
    wasteType: 'Recyclables (Paper, Cartons & Metal)',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '06:30 AM',
    contractor: 'QC EPWMD Fleet Sector 3',
    truckCode: 'QC-TRK-311',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-up-diliman',
    name: 'UP Campus (Diliman)',
    district: 4,
    subArea: 'Academic Oval & Village Communities',
    zipCode: '1101',
    regularDays: ['Monday', 'Wednesday', 'Friday'],
    pickupWindow: '07:00 AM - 09:30 AM',
    wasteType: 'Biodegradable (Food & Kitchen Waste)',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '07:30 AM',
    contractor: 'UP-QC Joint Environmental Team',
    truckCode: 'QC-TRK-405',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-krus-na-ligas',
    name: 'Krus na Ligas',
    district: 4,
    subArea: 'Plaza & C.P. Garcia Entryway',
    zipCode: '1101',
    regularDays: ['Tuesday', 'Friday'],
    pickupWindow: '06:00 AM - 08:00 AM',
    wasteType: 'Non-Biodegradable (Residual & Plastics)',
    nextScheduledDate: 'Tuesday, Sep 15, 2026',
    nextScheduledTime: '06:00 AM',
    contractor: 'QC EPWMD Fleet Sector 4',
    truckCode: 'QC-TRK-410',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-kamuning',
    name: 'Kamuning',
    district: 4,
    subArea: 'Tomas Morato to K-1st Streets',
    zipCode: '1103',
    regularDays: ['Monday', 'Wednesday', 'Saturday'],
    pickupWindow: '07:00 AM - 09:00 AM',
    wasteType: 'Biodegradable (Food & Kitchen Waste)',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '07:00 AM',
    contractor: 'QC EPWMD Fleet Sector 4',
    truckCode: 'QC-TRK-418',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-tandang-sora',
    name: 'Tandang Sora',
    district: 6,
    subArea: 'Mindanao Ave & Banlat Area',
    zipCode: '1116',
    regularDays: ['Tuesday', 'Thursday', 'Sunday'],
    pickupWindow: '06:30 AM - 09:00 AM',
    wasteType: 'Non-Biodegradable (Residual & Plastics)',
    nextScheduledDate: 'Tuesday, Sep 15, 2026',
    nextScheduledTime: '07:00 AM',
    contractor: 'QC EPWMD Fleet Sector 6',
    truckCode: 'QC-TRK-604',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-culiat',
    name: 'Culiat',
    district: 6,
    subArea: 'Union Bankers & Muslim Compound',
    zipCode: '1128',
    regularDays: ['Monday', 'Thursday'],
    pickupWindow: '08:00 AM - 10:30 AM',
    wasteType: 'General Waste',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '08:00 AM',
    contractor: 'QC EPWMD Fleet Sector 6',
    truckCode: 'QC-TRK-615',
    status: 'DELAYED',
    currentDelay: {
      cause: 'Emergency water pipe repairs closed the Luzon Avenue intersection. Garbage truck is rerouting via Tandang Sora.',
      category: 'Road Closure / Heavy Traffic',
      originalDate: 'Monday, Sep 14, 2026',
      originalTime: '08:00 AM',
      rescheduledDate: 'Monday, Sep 14, 2026',
      rescheduledTime: '10:30 AM',
      reportedAt: '50 mins ago',
      advisoryNote: 'Truck is currently making its way past the traffic bottleneck. ETA approximately 10:30 AM.',
    },
  },
  {
    id: 'brgy-fairview',
    name: 'Fairview',
    district: 5,
    subArea: 'Fairview Park & West Fairview',
    zipCode: '1118',
    regularDays: ['Monday', 'Wednesday', 'Friday'],
    pickupWindow: '06:00 AM - 08:30 AM',
    wasteType: 'Biodegradable (Food & Kitchen Waste)',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '06:45 AM',
    contractor: 'QC North Waste Solutions - Sector 5',
    truckCode: 'QC-TRK-508',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-novaliches-proper',
    name: 'Novaliches Proper',
    district: 5,
    subArea: 'Bayan & Quirino Highway Corridor',
    zipCode: '1123',
    regularDays: ['Daily Night Collection'],
    pickupWindow: '09:00 PM - 11:30 PM',
    wasteType: 'General Waste',
    nextScheduledDate: 'Tonight, Sep 13, 2026',
    nextScheduledTime: '09:30 PM',
    contractor: 'QC North Waste Solutions - Sector 5',
    truckCode: 'QC-TRK-512',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-san-antonio',
    name: 'San Antonio',
    district: 1,
    subArea: 'Roosevelt / FPJ Ave Area',
    zipCode: '1105',
    regularDays: ['Tuesday', 'Friday'],
    pickupWindow: '06:00 AM - 08:30 AM',
    wasteType: 'Recyclables (Paper, Cartons & Metal)',
    nextScheduledDate: 'Tuesday, Sep 15, 2026',
    nextScheduledTime: '06:30 AM',
    contractor: 'QC EPWMD Fleet Sector 1',
    truckCode: 'QC-TRK-103',
    status: 'ON_SCHEDULE',
  },
  {
    id: 'brgy-project-6',
    name: 'Project 6',
    district: 1,
    subArea: 'Road 1 to Road 8 & Visayas Ave',
    zipCode: '1100',
    regularDays: ['Monday', 'Wednesday', 'Friday'],
    pickupWindow: '07:00 AM - 09:30 AM',
    wasteType: 'Biodegradable (Food & Kitchen Waste)',
    nextScheduledDate: 'Monday, Sep 14, 2026',
    nextScheduledTime: '07:00 AM',
    contractor: 'QC EPWMD Fleet Sector 1',
    truckCode: 'QC-TRK-109',
    status: 'ON_SCHEDULE',
  },
];

let notifications: WasteNotification[] = [
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
    updatedBy: 'EPWMD Officer Bautista (ID #QC-8821)',
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
    updatedBy: 'EPWMD Dispatcher Reyes (ID #QC-4019)',
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
    updatedBy: 'System Auto-Scheduler',
  },
];

// In-memory audit log of admin updates
let adminAuditLogs: {
  id: string;
  adminName: string;
  action: string;
  barangayName: string;
  details: string;
  timestamp: string;
}[] = [
  {
    id: 'log-1',
    adminName: 'Engr. Bautista (EPWMD Dispatch Head)',
    action: 'DELAY_REPORTED',
    barangayName: 'Batasan Hills',
    details: 'Input delay cause: Tropical Storm / Monsoon Rains flooding Batasan-San Mateo Road. Rescheduled to 11:00 AM.',
    timestamp: '15 mins ago',
  },
  {
    id: 'log-2',
    adminName: 'Supervisor Reyes (Fleet Operations)',
    action: 'DELAY_REPORTED',
    barangayName: 'Socorro (Cubao)',
    details: 'Hydraulic lift issue on QC-TRK-302. Dispatched relief truck QC-TRK-315.',
    timestamp: '10 mins ago',
  },
];

// --- API ENDPOINTS ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'QC Waste Watch Government Backend' });
});

// Telemetry engine status endpoint
app.get('/api/telemetry', (req, res) => {
  res.json({
    success: true,
    engine: 'Enterprise Edge-Node Logistics Telemetry Engine',
    timestamp: new Date().toISOString(),
    frequencyHz: 1.0,
    edgeNodesActive: 16,
    activeRegion: 'Quezon City Metropolitan Area',
  });
});

// Real-Time Server-Sent Events (SSE) Pub/Sub Gateway
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(': connected to QC Waste Watch real-time event bus\n\n');

  const clientId = `client-${Date.now()}-${Math.random()}`;
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial keepalive and initial sync
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Periodic keep-alive ping for SSE connections
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(': keep-alive ping\n\n');
    } catch {
      // ignore
    }
  });
}, 20000);

// --- DRIVER TELEMETRY & GATEWAY ACTION ENDPOINTS ---

// 1. Get all fleet drivers
app.get('/api/drivers', (req, res) => {
  res.json({ success: true, count: drivers.length, data: drivers });
});

// 2. Driver "ARRIVE" Gateway Action (Registers corridor check-in)
app.post('/api/driver/arrive', (req, res) => {
  const { driverId, barangayId } = req.body;
  const driverIndex = drivers.findIndex((d) => d.id === driverId || d.assignedBarangayId === barangayId);

  if (driverIndex === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  const driver = drivers[driverIndex];
  driver.currentStatus = 'ON_SITE_COLLECTING';
  driver.slaBreachDetected = false;
  driver.targetEtaTimestamp = undefined;

  // Update barangay state
  const brgyIndex = barangays.findIndex((b) => b.id === driver.assignedBarangayId);
  if (brgyIndex !== -1) {
    barangays[brgyIndex].status = 'IN_PROGRESS';
    barangays[brgyIndex].currentDelay = undefined;
  }

  const arrivalNotif: WasteNotification = {
    id: `notif-arrive-${Date.now()}`,
    barangayId: driver.assignedBarangayId,
    barangayName: driver.assignedBarangayName,
    district: driver.assignedDistrict,
    type: 'STATUS_UPDATE',
    title: `🚚 Garbage Truck Arrived: Brgy. ${driver.assignedBarangayName}`,
    scheduledDate: 'Today',
    scheduledTime: 'Now Collecting',
    advisory: `Garbage truck ${driver.truckCode} (${driver.fullName}) has arrived. Collection is now taking place on your street.`,
    timestamp: 'Just now',
    isRead: false,
    severity: 'normal',
    updatedBy: `Driver ${driver.fullName} (${driver.truckCode})`,
  };

  notifications = [arrivalNotif, ...notifications];

  adminAuditLogs = [
    {
      id: `log-${Date.now()}`,
      adminName: driver.fullName,
      action: 'SCHEDULE_UPDATED',
      barangayName: driver.assignedBarangayName,
      details: `Driver checked in ON-SITE with truck ${driver.truckCode}. Waste collection now active.`,
      timestamp: 'Just now',
    },
    ...adminAuditLogs,
  ];

  // Broadcast to all SSE clients for real-time pub/sub
  broadcastSse('DRIVER_ARRIVED', { driver, barangayId: driver.assignedBarangayId });
  broadcastSse('NOTIFICATION', arrivalNotif);
  broadcastSse('DATA_SYNC', { barangays, notifications, drivers });

  res.json({
    success: true,
    message: `Driver ${driver.fullName} registered arrival at ${driver.assignedBarangayName}.`,
    driver,
    barangay: brgyIndex !== -1 ? barangays[brgyIndex] : undefined,
    notification: arrivalNotif,
  });
});

// 3. Driver Manual / Auto ETA Input
app.post('/api/driver/eta', (req, res) => {
  const { driverId, etaMinutes, etaFormatted } = req.body;
  const driverIndex = drivers.findIndex((d) => d.id === driverId);

  if (driverIndex === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  const driver = drivers[driverIndex];
  const mins = Math.max(1, Number(etaMinutes) || 10);
  const targetTimestamp = Date.now() + mins * 60 * 1000;

  driver.currentStatus = 'IN_TRANSIT';
  driver.targetEtaTimestamp = targetTimestamp;
  driver.targetEtaFormatted = etaFormatted || `${mins} mins`;
  driver.slaBreachDetected = false;

  // Update target barangay schedule time
  const brgyIndex = barangays.findIndex((b) => b.id === driver.assignedBarangayId);
  if (brgyIndex !== -1) {
    barangays[brgyIndex].nextScheduledTime = driver.targetEtaFormatted;
  }

  const etaUpdateNotif: WasteNotification = {
    id: `notif-eta-${Date.now()}`,
    barangayId: driver.assignedBarangayId,
    barangayName: driver.assignedBarangayName,
    district: driver.assignedDistrict,
    type: 'SCHEDULED_REMINDER',
    title: `⏱️ Estimated Arrival Time: Brgy. ${driver.assignedBarangayName}`,
    scheduledDate: 'Today',
    scheduledTime: driver.targetEtaFormatted,
    advisory: `Garbage truck ${driver.truckCode} is estimated to arrive at approx ${driver.targetEtaFormatted} (in about ${mins} minutes).`,
    timestamp: 'Just now',
    isRead: false,
    severity: 'normal',
    updatedBy: `Driver ${driver.fullName} (${driver.truckCode})`,
    telemetryEtaFormatted: driver.targetEtaFormatted,
  };

  notifications = [etaUpdateNotif, ...notifications];

  broadcastSse('DRIVER_ETA_UPDATED', { driver, etaMinutes: mins });
  broadcastSse('NOTIFICATION', etaUpdateNotif);
  broadcastSse('DATA_SYNC', { barangays, notifications, drivers });

  res.json({
    success: true,
    message: `Estimated arrival time for ${driver.assignedBarangayName} updated: ${driver.targetEtaFormatted}.`,
    driver,
    notification: etaUpdateNotif,
  });
});

// 4. Driver Incident / Delay Trigger
app.post('/api/driver/incident', (req, res) => {
  const { driverId, cause, category, rescheduledTime, advisory } = req.body;
  const driverIndex = drivers.findIndex((d) => d.id === driverId);

  if (driverIndex === -1) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  const driver = drivers[driverIndex];
  driver.currentStatus = 'DELAYED';

  const brgyIndex = barangays.findIndex((b) => b.id === driver.assignedBarangayId);
  if (brgyIndex !== -1) {
    barangays[brgyIndex].status = 'DELAYED';
    barangays[brgyIndex].currentDelay = {
      cause: cause || 'Road blockage or traffic encountered along the route',
      category: category || 'Road Closure / Heavy Traffic',
      originalDate: 'Today',
      originalTime: driver.targetEtaFormatted || barangays[brgyIndex].nextScheduledTime,
      rescheduledDate: 'Today',
      rescheduledTime: rescheduledTime || 'Delayed',
      reportedAt: 'Just now',
      advisoryNote: advisory || 'Please keep sealed trash bins inside gates until collection resumes.',
    };
  }

  const delayNotif: WasteNotification = {
    id: `notif-drv-delay-${Date.now()}`,
    barangayId: driver.assignedBarangayId,
    barangayName: driver.assignedBarangayName,
    district: driver.assignedDistrict,
    type: 'DELAY_ALERT',
    title: `⚠️ Collection Delayed: Brgy. ${driver.assignedBarangayName}`,
    scheduledDate: 'Today',
    scheduledTime: rescheduledTime || 'Delayed',
    causeOfDelay: cause,
    delayCategory: category || 'Road Closure / Heavy Traffic',
    originalTime: driver.targetEtaFormatted,
    rescheduledDate: 'Today',
    rescheduledTime: rescheduledTime || 'Delayed',
    advisory: advisory,
    timestamp: 'Just now',
    isRead: false,
    severity: 'warning',
    updatedBy: `Truck Driver: ${driver.fullName} (${driver.truckCode})`,
  };

  notifications = [delayNotif, ...notifications];

  broadcastSse('DRIVER_INCIDENT', { driver, delayNotif });
  broadcastSse('NOTIFICATION', delayNotif);
  broadcastSse('DATA_SYNC', { barangays, notifications, drivers });

  res.json({
    success: true,
    message: `Delay logged and broadcasted to residents of ${driver.assignedBarangayName}.`,
    driver,
    barangay: brgyIndex !== -1 ? barangays[brgyIndex] : undefined,
    notification: delayNotif,
  });
});

// --- AUTOMATED 1-MINUTE SLA VIOLATION / DELAY WATCHDOG ENGINE ---
// Background interval evaluating active driver ETAs against current timestamp vectors
setInterval(() => {
  const now = Date.now();

  drivers.forEach((driver) => {
    // Condition: status remains IN_TRANSIT, has targetEtaTimestamp, and current_timestamp > target_ETA + 60 seconds
    if (
      driver.currentStatus === 'IN_TRANSIT' &&
      driver.targetEtaTimestamp &&
      now > driver.targetEtaTimestamp + 60_000 &&
      !driver.slaBreachDetected
    ) {
      driver.slaBreachDetected = true;
      driver.currentStatus = 'DELAYED';

      const brgyIndex = barangays.findIndex((b) => b.id === driver.assignedBarangayId);
      const brgyName = driver.assignedBarangayName;
      const initialEta = driver.targetEtaFormatted || 'Scheduled Window';

      if (brgyIndex !== -1) {
        barangays[brgyIndex].status = 'DELAYED';
        barangays[brgyIndex].currentDelay = {
          cause: `Automatic Delay Notice: Garbage truck ${driver.truckCode} did not arrive at the estimated time (${initialEta}). The truck is running late, likely due to road traffic or temporary delay.`,
          category: 'Road Closure / Heavy Traffic',
          originalDate: barangays[brgyIndex].nextScheduledDate,
          originalTime: initialEta,
          rescheduledDate: barangays[brgyIndex].nextScheduledDate,
          rescheduledTime: 'Delayed (Estimated +15 to 30 mins)',
          reportedAt: 'Automatic Delay System',
          advisoryNote: 'The garbage truck is running later than estimated. Please keep your garbage bins secure until the truck arrives.',
        };
      }

      const slaNotif: WasteNotification = {
        id: `notif-sla-${Date.now()}-${driver.id}`,
        barangayId: driver.assignedBarangayId,
        barangayName: brgyName,
        district: driver.assignedDistrict,
        type: 'DELAY_ALERT',
        title: `⚠️ Collection Delayed: Brgy. ${brgyName}`,
        scheduledDate: 'Today',
        scheduledTime: 'Running Late (Past Estimated Time)',
        causeOfDelay: `Garbage truck ${driver.truckCode} is running late past its estimated arrival time (${initialEta}). The driver will provide an updated arrival time shortly.`,
        delayCategory: 'Road Closure / Heavy Traffic',
        originalTime: initialEta,
        rescheduledDate: 'Today',
        rescheduledTime: 'Delayed (Estimated +15 to 30 mins)',
        advisory: 'Notice for subscribed residents: The garbage truck is taking longer than expected. Please wait for the truck to arrive.',
        timestamp: 'Just now',
        isRead: false,
        severity: 'warning',
        updatedBy: 'QC Waste Watch Automatic System',
        isSlaBreach: true,
        driverId: driver.id,
        truckCode: driver.truckCode,
      };

      notifications = [slaNotif, ...notifications];

      adminAuditLogs = [
        {
          id: `log-sla-${Date.now()}`,
          adminName: 'QC Waste Watch Automatic System',
          action: 'DELAY_REPORTED',
          barangayName: brgyName,
          details: `Garbage truck ${driver.truckCode} was delayed past estimated arrival (${initialEta}). Delay notice sent to subscribed residents.`,
          timestamp: 'Just now',
        },
        ...adminAuditLogs,
      ];

      // Dispatch exclusively to pub/sub listeners
      broadcastSse('SLA_VIOLATION', {
        notification: slaNotif,
        driver,
        barangayId: driver.assignedBarangayId,
      });
      broadcastSse('NOTIFICATION', slaNotif);
      broadcastSse('DATA_SYNC', { barangays, notifications, drivers });
    }
  });
}, 5000);

// 2. Get all barangays
app.get('/api/barangays', (req, res) => {
  res.json({ success: true, count: barangays.length, data: barangays });
});

// 3. Get all notifications
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, count: notifications.length, data: notifications });
});

// 4. Get audit logs
app.get('/api/admin/audit-logs', (req, res) => {
  res.json({ success: true, count: adminAuditLogs.length, data: adminAuditLogs });
});

// 5. Update barangay schedule (Admin endpoint)
app.put('/api/admin/barangays/:id/schedule', (req, res) => {
  const { id } = req.params;
  const {
    regularDays,
    pickupWindow,
    wasteType,
    nextScheduledDate,
    nextScheduledTime,
    contractor,
    truckCode,
    adminOfficialName,
  } = req.body;

  const brgyIndex = barangays.findIndex((b) => b.id === id);
  if (brgyIndex === -1) {
    return res.status(404).json({ success: false, message: 'Barangay not found' });
  }

  const existing = barangays[brgyIndex];
  barangays[brgyIndex] = {
    ...existing,
    regularDays: regularDays || existing.regularDays,
    pickupWindow: pickupWindow || existing.pickupWindow,
    wasteType: wasteType || existing.wasteType,
    nextScheduledDate: nextScheduledDate || existing.nextScheduledDate,
    nextScheduledTime: nextScheduledTime || existing.nextScheduledTime,
    contractor: contractor || existing.contractor,
    truckCode: truckCode || existing.truckCode,
  };

  const officialName = adminOfficialName || 'QC EPWMD Operations Officer';

  // Automatically propagate update into residents' notification feed
  const scheduleUpdateNotif: WasteNotification = {
    id: `notif-sched-${Date.now()}`,
    barangayId: existing.id,
    barangayName: existing.name,
    district: existing.district,
    type: 'SCHEDULED_REMINDER',
    title: `📅 Schedule Updated: Brgy. ${existing.name}`,
    scheduledDate: nextScheduledDate || existing.nextScheduledDate,
    scheduledTime: nextScheduledTime || existing.nextScheduledTime,
    advisory: `Updated by ${officialName}: Collection window: ${pickupWindow || existing.pickupWindow}. Waste Type: ${wasteType || existing.wasteType}. Truck: ${truckCode || existing.truckCode}.`,
    timestamp: 'Just now',
    isRead: false,
    severity: 'normal',
    updatedBy: officialName,
  };

  notifications = [scheduleUpdateNotif, ...notifications];

  // Log audit
  adminAuditLogs = [
    {
      id: `log-${Date.now()}`,
      adminName: officialName,
      action: 'SCHEDULE_UPDATED',
      barangayName: existing.name,
      details: `Updated collection timing: ${nextScheduledDate} at ${nextScheduledTime} (${pickupWindow}). Truck: ${truckCode}.`,
      timestamp: 'Just now',
    },
    ...adminAuditLogs,
  ];

  res.json({
    success: true,
    message: `Schedule for Brgy. ${existing.name} successfully updated and broadcast to residents.`,
    barangay: barangays[brgyIndex],
    notification: scheduleUpdateNotif,
  });
});

// 6. Input delay reasons & propagate delay alert (Admin endpoint)
app.post('/api/admin/barangays/:id/delay', (req, res) => {
  const { id } = req.params;
  const {
    causeOfDelay,
    delayCategory,
    originalDate,
    originalTime,
    rescheduledDate,
    rescheduledTime,
    advisoryNote,
    adminOfficialName,
  } = req.body;

  if (!causeOfDelay) {
    return res.status(400).json({ success: false, message: 'causeOfDelay note is required' });
  }

  const brgyIndex = barangays.findIndex((b) => b.id === id);
  if (brgyIndex === -1) {
    return res.status(404).json({ success: false, message: 'Barangay not found' });
  }

  const existing = barangays[brgyIndex];
  const officialName = adminOfficialName || 'QC EPWMD Operations Officer';

  const delayPayload: DelayDetails = {
    cause: causeOfDelay,
    category: delayCategory || 'Operational Delay',
    originalDate: originalDate || existing.nextScheduledDate,
    originalTime: originalTime || existing.nextScheduledTime,
    rescheduledDate: rescheduledDate || existing.nextScheduledDate,
    rescheduledTime: rescheduledTime || 'Delayed (Pending Clearance)',
    reportedAt: 'Just now',
    advisoryNote: advisoryNote || 'Please keep sealed trash bins inside your property until collection resumes.',
  };

  // Update barangay state
  barangays[brgyIndex] = {
    ...existing,
    status: 'DELAYED',
    currentDelay: delayPayload,
  };

  // Automatically propagate push notification into residents' feed
  const delayNotif: WasteNotification = {
    id: `notif-delay-${Date.now()}`,
    barangayId: existing.id,
    barangayName: existing.name,
    district: existing.district,
    type: 'DELAY_ALERT',
    title: `⚠️ Collection Delayed: Brgy. ${existing.name}`,
    scheduledDate: delayPayload.rescheduledDate,
    scheduledTime: delayPayload.rescheduledTime,
    causeOfDelay: delayPayload.cause,
    delayCategory: delayPayload.category,
    originalTime: delayPayload.originalTime,
    rescheduledDate: delayPayload.rescheduledDate,
    rescheduledTime: delayPayload.rescheduledTime,
    advisory: delayPayload.advisoryNote,
    timestamp: 'Just now',
    isRead: false,
    severity: 'warning',
    updatedBy: officialName,
  };

  notifications = [delayNotif, ...notifications];

  // Log audit
  adminAuditLogs = [
    {
      id: `log-${Date.now()}`,
      adminName: officialName,
      action: 'DELAY_REPORTED',
      barangayName: existing.name,
      details: `Input reason: "${causeOfDelay}" (${delayCategory}). Rescheduled to ${rescheduledTime}.`,
      timestamp: 'Just now',
    },
    ...adminAuditLogs,
  ];

  broadcastSse('DELAY_REPORTED', { barangay: barangays[brgyIndex], notification: delayNotif });
  broadcastSse('NOTIFICATION', delayNotif);
  broadcastSse('DATA_SYNC', { barangays, notifications, drivers });

  res.json({
    success: true,
    message: `Delay reason for Brgy. ${existing.name} logged and propagated to residents' alert feed.`,
    barangay: barangays[brgyIndex],
    notification: delayNotif,
  });
});

// 7. Resolve delay and resume normal schedule (Admin endpoint)
app.post('/api/admin/barangays/:id/resolve-delay', (req, res) => {
  const { id } = req.params;
  const { adminOfficialName, nextDate, nextTime, resolutionNote } = req.body;

  const brgyIndex = barangays.findIndex((b) => b.id === id);
  if (brgyIndex === -1) {
    return res.status(404).json({ success: false, message: 'Barangay not found' });
  }

  const existing = barangays[brgyIndex];
  const officialName = adminOfficialName || 'QC EPWMD Operations Officer';

  barangays[brgyIndex] = {
    ...existing,
    status: 'ON_SCHEDULE',
    nextScheduledDate: nextDate || existing.nextScheduledDate,
    nextScheduledTime: nextTime || existing.nextScheduledTime,
    currentDelay: undefined,
  };

  const resolvedNotif: WasteNotification = {
    id: `notif-resolved-${Date.now()}`,
    barangayId: existing.id,
    barangayName: existing.name,
    district: existing.district,
    type: 'STATUS_UPDATE',
    title: `✅ Collection Resumed: Brgy. ${existing.name}`,
    scheduledDate: nextDate || existing.nextScheduledDate,
    scheduledTime: nextTime || existing.nextScheduledTime,
    advisory: resolutionNote || 'The delay reason has been cleared and collection is back on schedule. Thank you for your patience.',
    timestamp: 'Just now',
    isRead: false,
    severity: 'normal',
    updatedBy: officialName,
  };

  notifications = [resolvedNotif, ...notifications];

  adminAuditLogs = [
    {
      id: `log-${Date.now()}`,
      adminName: officialName,
      action: 'DELAY_RESOLVED',
      barangayName: existing.name,
      details: `Disruption cleared. Collection resumed for ${nextDate || existing.nextScheduledDate} at ${nextTime || existing.nextScheduledTime}.`,
      timestamp: 'Just now',
    },
    ...adminAuditLogs,
  ];

  broadcastSse('DELAY_RESOLVED', { barangay: barangays[brgyIndex], notification: resolvedNotif });
  broadcastSse('NOTIFICATION', resolvedNotif);
  broadcastSse('DATA_SYNC', { barangays, notifications, drivers });

  res.json({
    success: true,
    message: `Delay for Brgy. ${existing.name} resolved. Resumed schedule broadcast to residents.`,
    barangay: barangays[brgyIndex],
    notification: resolvedNotif,
  });
});

// 8. Admin ETA Override Endpoint
app.post('/api/admin/barangays/:id/override-eta', (req, res) => {
  const { id } = req.params;
  const { newEtaTime, adminOfficialName, reason } = req.body;
  const brgyIndex = barangays.findIndex((b) => b.id === id);
  if (brgyIndex === -1) {
    return res.status(404).json({ success: false, message: 'Barangay not found' });
  }

  const existing = barangays[brgyIndex];
  existing.nextScheduledTime = newEtaTime;
  const officialName = adminOfficialName || 'QC EPWMD Operations Officer';

  const overrideNotif: WasteNotification = {
    id: `notif-eta-ovr-${Date.now()}`,
    barangayId: existing.id,
    barangayName: existing.name,
    district: existing.district,
    type: 'SCHEDULED_REMINDER',
    title: `⏱️ Arrival Time Updated: Brgy. ${existing.name}`,
    scheduledDate: existing.nextScheduledDate,
    scheduledTime: newEtaTime,
    advisory: `Updated by ${officialName}: Expected truck arrival time has been set to ${newEtaTime}. ${reason || ''}`,
    timestamp: 'Just now',
    isRead: false,
    severity: 'normal',
    updatedBy: officialName,
  };

  notifications = [overrideNotif, ...notifications];

  broadcastSse('NOTIFICATION', overrideNotif);
  broadcastSse('DATA_SYNC', { barangays, notifications, drivers });

  res.json({ success: true, barangay: existing, notification: overrideNotif });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QC Waste Watch backend server running on http://localhost:${PORT}`);
  });
}

startServer();
