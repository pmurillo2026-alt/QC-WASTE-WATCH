import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side Supabase client (reads strictly from process.env; never hardcoded)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SECRET_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

// Ephemeral HMAC signing key fallback if SESSION_SECRET is unset
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function hashPassword(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasswordHash(secret: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(secret, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function verifyPlainConstantTime(provided: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

type UserRole = 'RESIDENT' | 'OFFICIAL' | 'DRIVER';

interface SessionClaims {
  userId: string;
  role: UserRole;
  exp: number;
}

function createSessionToken(userId: string, role: UserRole): string {
  const payload: SessionClaims = {
    userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24, // 24h
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionClaims;
    if (!claims.userId || !claims.role || Date.now() > claims.exp) return null;
    return claims;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends express.Request {
  auth?: SessionClaims;
}

function requireAuth(allowedRoles?: UserRole[]) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in first.' });
    }
    const claims = verifySessionToken(token);
    if (!claims) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    }
    if (allowedRoles && !allowedRoles.includes(claims.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission for this action.' });
    }
    req.auth = claims;
    next();
  };
}

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
  {
    id: 'driver-danilo',
    fullName: 'Danilo Morales',
    employeeId: 'QC-DRV-2094',
    licenseNumber: 'N02-06-448291',
    truckCode: 'QC-TRK-209',
    truckCallsign: 'SPIRIT-HAUL-209',
    contractor: 'QC EPWMD Fleet Sector 2',
    assignedBarangayId: 'brgy-holy-spirit',
    assignedBarangayName: 'Holy Spirit',
    assignedDistrict: 2,
    mobileNumber: '0919-332-2094',
    currentStatus: 'IN_TRANSIT',
    targetEtaTimestamp: Date.now() + 300_000,
    targetEtaFormatted: '07:15 AM',
    slaBreachDetected: false,
  },
  {
    id: 'driver-edgardo',
    fullName: 'Edgardo Reyes',
    employeeId: 'QC-DRV-1095',
    licenseNumber: 'N03-99-192834',
    truckCode: 'QC-TRK-109',
    truckCallsign: 'VISAYAS-COMPACTOR-109',
    contractor: 'QC EPWMD Fleet Sector 1',
    assignedBarangayId: 'brgy-project-6',
    assignedBarangayName: 'Project 6',
    assignedDistrict: 1,
    mobileNumber: '0917-550-1095',
    currentStatus: 'IN_TRANSIT',
    targetEtaTimestamp: Date.now() + 360_000,
    targetEtaFormatted: '07:00 AM',
    slaBreachDetected: false,
  },
  {
    id: 'driver-gregorio',
    fullName: 'Gregorio Garcia',
    employeeId: 'QC-DRV-5086',
    licenseNumber: 'N02-08-592831',
    truckCode: 'QC-TRK-508',
    truckCallsign: 'REGALADO-SPEED-508',
    contractor: 'QC North Waste Solutions - Sector 5',
    assignedBarangayId: 'brgy-fairview',
    assignedBarangayName: 'Fairview',
    assignedDistrict: 5,
    mobileNumber: '0922-881-5086',
    currentStatus: 'IN_TRANSIT',
    targetEtaTimestamp: Date.now() + 420_000,
    targetEtaFormatted: '06:45 AM',
    slaBreachDetected: false,
  },
];

interface AuthorizedOfficialRecord {
  id: string;
  fullName: string;
  title: string;
  department: string;
  employeeId: string;
  badgeNumber: string;
  role: 'OPERATIONS_CHIEF' | 'DISTRICT_SUPERVISOR' | 'DISPATCH_OFFICER';
  assignedDistricts: number[];
  isAuthorized: boolean;
}

const AUTHORIZED_OFFICIALS: AuthorizedOfficialRecord[] = [
  {
    id: 'official-bautista',
    fullName: 'Engr. Maria Teresa Bautista',
    title: 'Solid Waste Operations Chief',
    department: 'QC Environmental Protection & Waste Management Department (EPWMD)',
    employeeId: 'QC-EPWMD-8821',
    badgeNumber: 'BDG-8821',
    role: 'OPERATIONS_CHIEF',
    assignedDistricts: [1, 2, 3, 4, 5, 6],
    isAuthorized: true,
  },
  {
    id: 'official-reyes',
    fullName: 'Supervisor Roberto Reyes',
    title: 'District 2 & 3 Senior Dispatch Officer',
    department: 'EPWMD Fleet Monitoring & Operations',
    employeeId: 'QC-EPWMD-4019',
    badgeNumber: 'BDG-4019',
    role: 'DISTRICT_SUPERVISOR',
    assignedDistricts: [2, 3],
    isAuthorized: true,
  },
  {
    id: 'official-cruz',
    fullName: 'Officer Angelica Cruz',
    title: 'Emergency Waste Routing Specialist',
    department: 'QC Disaster Risk Reduction & Management Operations Center (QCDRRMO)',
    employeeId: 'QC-EPWMD-9104',
    badgeNumber: 'BDG-9104',
    role: 'DISPATCH_OFFICER',
    assignedDistricts: [1, 4, 5, 6],
    isAuthorized: true,
  },
];

interface ResidentRecord {
  id: string;
  fullName: string;
  address: string;
  mobileNumber: string;
  normalizedMobile: string;
  homeBarangayId: string;
  subscribedBarangayIds: string[];
  passwordHash: string;
  createdAt: string;
}

let residentAccounts: ResidentRecord[] = [];
const claimedRolePasscodes: Partial<Record<'OFFICIAL' | 'DRIVER', string>> = {};

function normalizeMobile(phone: string): string {
  return phone.replace(/\D/g, '');
}

async function syncSupabaseNotification(notif: WasteNotification) {
  if (!supabase) return;
  try {
    await supabase.from('notifications').upsert({
      id: notif.id,
      barangay_id: notif.barangayId,
      barangay_name: notif.barangayName,
      district: notif.district,
      type: notif.type,
      title: notif.title,
      scheduled_date: notif.scheduledDate,
      scheduled_time: notif.scheduledTime,
      cause_of_delay: notif.causeOfDelay ?? null,
      delay_category: notif.delayCategory ?? null,
      original_time: notif.originalTime ?? null,
      rescheduled_date: notif.rescheduledDate ?? null,
      rescheduled_time: notif.rescheduledTime ?? null,
      advisory: notif.advisory ?? null,
      timestamp_label: notif.timestamp,
      is_read: notif.isRead,
      severity: notif.severity,
      updated_by: notif.updatedBy,
      telemetry_eta_formatted: notif.telemetryEtaFormatted ?? null,
      is_sla_breach: notif.isSlaBreach ?? false,
      driver_id: notif.driverId ?? null,
      truck_code: notif.truckCode ?? null,
    });
  } catch {
    // Non-blocking fallback when tables are not yet initialized
  }
}

async function syncSupabaseBarangay(b: BarangaySchedule) {
  if (!supabase) return;
  try {
    await supabase.from('barangays').upsert({
      id: b.id,
      name: b.name,
      district: b.district,
      sub_area: b.subArea ?? null,
      zip_code: b.zipCode,
      regular_days: b.regularDays,
      pickup_window: b.pickupWindow,
      waste_type: b.wasteType,
      next_scheduled_date: b.nextScheduledDate,
      next_scheduled_time: b.nextScheduledTime,
      contractor: b.contractor,
      truck_code: b.truckCode,
      status: b.status,
      current_delay: b.currentDelay ?? null,
    });
  } catch {
    // Non-blocking fallback
  }
}

async function hydrateFromSupabase() {
  if (!supabase) return;
  try {
    const [resCreds, resResidents, resBrgys, resNotifs] = await Promise.all([
      supabase.from('role_credentials').select('*'),
      supabase.from('residents').select('*'),
      supabase.from('barangays').select('*'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (resCreds.data) {
      for (const row of resCreds.data as Array<{ role: string; passcode_hash: string }>) {
        if ((row.role === 'OFFICIAL' || row.role === 'DRIVER') && row.passcode_hash) {
          claimedRolePasscodes[row.role] = row.passcode_hash;
        }
      }
    }

    if (resResidents.data && resResidents.data.length > 0) {
      residentAccounts = resResidents.data.map((r: any) => ({
        id: r.id,
        fullName: r.full_name,
        address: r.address,
        mobileNumber: r.mobile_number,
        normalizedMobile: normalizeMobile(r.mobile_number),
        homeBarangayId: r.home_barangay_id,
        subscribedBarangayIds: Array.isArray(r.subscribed_barangay_ids) ? r.subscribed_barangay_ids : [r.home_barangay_id],
        passwordHash: r.password_hash,
        createdAt: r.created_at,
      }));
    }

    if (resBrgys.data && resBrgys.data.length > 0) {
      barangays = resBrgys.data.map((b: any) => ({
        id: b.id,
        name: b.name,
        district: b.district,
        subArea: b.sub_area ?? undefined,
        zipCode: b.zip_code,
        regularDays: Array.isArray(b.regular_days) ? b.regular_days : [],
        pickupWindow: b.pickup_window,
        wasteType: b.waste_type,
        nextScheduledDate: b.next_scheduled_date,
        nextScheduledTime: b.next_scheduled_time,
        contractor: b.contractor,
        truckCode: b.truck_code,
        status: b.status,
        currentDelay: b.current_delay ?? undefined,
      }));
    }

    if (resNotifs.data && resNotifs.data.length > 0) {
      notifications = resNotifs.data.map((n: any) => ({
        id: n.id,
        barangayId: n.barangay_id,
        barangayName: n.barangay_name,
        district: n.district,
        type: n.type,
        title: n.title,
        scheduledDate: n.scheduled_date,
        scheduledTime: n.scheduled_time,
        causeOfDelay: n.cause_of_delay ?? undefined,
        delayCategory: n.delay_category ?? undefined,
        originalTime: n.original_time ?? undefined,
        rescheduledDate: n.rescheduled_date ?? undefined,
        rescheduledTime: n.rescheduled_time ?? undefined,
        advisory: n.advisory ?? undefined,
        timestamp: n.timestamp_label,
        isRead: Boolean(n.is_read),
        severity: n.severity,
        updatedBy: n.updated_by ?? '',
        telemetryEtaFormatted: n.telemetry_eta_formatted ?? undefined,
        isSlaBreach: Boolean(n.is_sla_breach),
        driverId: n.driver_id ?? undefined,
        truckCode: n.truck_code ?? undefined,
      }));
    }
  } catch {
    // Tables may not exist yet; continue with seeded in-memory data
  }
}

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

// --- AUTHENTICATION ENDPOINTS ---

app.get('/api/auth/setup-status', (_req, res) => {
  res.json({
    success: true,
    officialConfigured: Boolean(process.env.OFFICIAL_ACCESS_PASSCODE || claimedRolePasscodes.OFFICIAL),
    driverConfigured: Boolean(process.env.DRIVER_ACCESS_PASSCODE || claimedRolePasscodes.DRIVER),
    supabaseConfigured: Boolean(supabase),
  });
});

app.post('/api/auth/resident/register', async (req, res) => {
  const { fullName, streetAddress, homeBarangayId, mobileNumber, password } = req.body || {};
  if (
    typeof fullName !== 'string' ||
    typeof streetAddress !== 'string' ||
    typeof homeBarangayId !== 'string' ||
    typeof mobileNumber !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({ success: false, message: 'All registration fields are required.' });
  }

  const normalized = normalizeMobile(mobileNumber);
  if (normalized.length < 10) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 11-digit mobile number.' });
  }
  if (password.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
  }

  const existing = residentAccounts.find((r) => r.normalizedMobile === normalized);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'This mobile number is already registered. Please switch to Returning Resident Sign In.',
    });
  }

  const targetBrgy = barangays.find((b) => b.id === homeBarangayId);
  if (!targetBrgy) {
    return res.status(400).json({ success: false, message: 'Please choose a valid Quezon City barangay.' });
  }

  const newResident: ResidentRecord = {
    id: `resident-${crypto.randomUUID()}`,
    fullName: fullName.trim(),
    address: `${streetAddress.trim()}, Brgy. ${targetBrgy.name}, Quezon City`,
    mobileNumber: mobileNumber.trim(),
    normalizedMobile: normalized,
    homeBarangayId,
    subscribedBarangayIds: [homeBarangayId],
    passwordHash: hashPassword(password.trim()),
    createdAt: new Date().toISOString(),
  };

  residentAccounts.push(newResident);

  if (supabase) {
    try {
      await supabase.from('residents').insert({
        id: newResident.id,
        full_name: newResident.fullName,
        address: newResident.address,
        mobile_number: newResident.mobileNumber,
        home_barangay_id: newResident.homeBarangayId,
        subscribed_barangay_ids: newResident.subscribedBarangayIds,
        password_hash: newResident.passwordHash,
        created_at: newResident.createdAt,
      });
    } catch {
      // Fall back safely if Supabase table not created yet
    }
  }

  const token = createSessionToken(newResident.id, 'RESIDENT');
  const { passwordHash: _ph, normalizedMobile: _nm, ...publicUser } = newResident;
  res.status(201).json({
    success: true,
    token,
    session: { role: 'RESIDENT', user: publicUser },
  });
});

app.post('/api/auth/resident/login', (req, res) => {
  const { mobileNumber, password } = req.body || {};
  if (typeof mobileNumber !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Mobile number and password are required.' });
  }

  const normalized = normalizeMobile(mobileNumber);
  const found = residentAccounts.find((r) => r.normalizedMobile === normalized);
  if (!found || !verifyPasswordHash(password.trim(), found.passwordHash)) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect mobile number or password. Register first if you do not have an account yet.',
    });
  }

  const token = createSessionToken(found.id, 'RESIDENT');
  const { passwordHash: _ph, normalizedMobile: _nm, ...publicUser } = found;
  res.json({
    success: true,
    token,
    session: { role: 'RESIDENT', user: publicUser },
  });
});

app.post('/api/resident/subscriptions', requireAuth(['RESIDENT']), async (req: AuthenticatedRequest, res) => {
  const { barangayId } = req.body || {};
  if (typeof barangayId !== 'string' || !barangays.some((b) => b.id === barangayId)) {
    return res.status(400).json({ success: false, message: 'Invalid barangay ID.' });
  }

  const resident = residentAccounts.find((r) => r.id === req.auth!.userId);
  if (!resident) {
    return res.status(404).json({ success: false, message: 'Resident account not found.' });
  }

  const alreadySubscribed = resident.subscribedBarangayIds.includes(barangayId);
  resident.subscribedBarangayIds = alreadySubscribed
    ? resident.subscribedBarangayIds.filter((id) => id !== barangayId)
    : [...resident.subscribedBarangayIds, barangayId];

  if (supabase) {
    try {
      await supabase
        .from('residents')
        .update({ subscribed_barangay_ids: resident.subscribedBarangayIds })
        .eq('id', resident.id);
    } catch {
      // Ignore if table not created yet
    }
  }

  res.json({
    success: true,
    subscribedBarangayIds: resident.subscribedBarangayIds,
  });
});

app.post('/api/auth/official/claim', async (req, res) => {
  if (process.env.OFFICIAL_ACCESS_PASSCODE || claimedRolePasscodes.OFFICIAL) {
    return res.status(409).json({
      success: false,
      message: 'City Official passcode has already been set up. Please sign in normally.',
    });
  }

  const { employeeId, badgeNumber, passcode } = req.body || {};
  if (typeof employeeId !== 'string' || typeof badgeNumber !== 'string' || typeof passcode !== 'string') {
    return res.status(400).json({ success: false, message: 'Employee ID, Badge Number, and Passcode are required.' });
  }
  if (passcode.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'Passcode must be at least 6 characters.' });
  }

  const official = AUTHORIZED_OFFICIALS.find(
    (o) =>
      o.employeeId.toLowerCase() === employeeId.trim().toLowerCase() &&
      o.badgeNumber.toLowerCase() === badgeNumber.trim().toLowerCase()
  );

  if (!official) {
    return res.status(401).json({
      success: false,
      message: 'Employee ID and Badge Number do not match an authorized EPWMD official.',
    });
  }

  const hash = hashPassword(passcode.trim());
  claimedRolePasscodes.OFFICIAL = hash;

  if (supabase) {
    try {
      await supabase.from('role_credentials').upsert({ role: 'OFFICIAL', passcode_hash: hash });
    } catch {
      // Ignore if table not created yet
    }
  }

  const token = createSessionToken(official.id, 'OFFICIAL');
  res.json({ success: true, token, session: { role: 'OFFICIAL', user: official } });
});

app.post('/api/auth/official/login', (req, res) => {
  const { employeeId, badgeNumber, passcode } = req.body || {};
  if (typeof employeeId !== 'string' || typeof badgeNumber !== 'string' || typeof passcode !== 'string') {
    return res.status(400).json({ success: false, message: 'Employee ID, Badge Number, and Passcode are required.' });
  }

  const envPasscode = process.env.OFFICIAL_ACCESS_PASSCODE;
  const claimedHash = claimedRolePasscodes.OFFICIAL;

  if (!envPasscode && !claimedHash) {
    return res.status(403).json({
      success: false,
      message: 'City Official passcode is not set up yet. Please complete first-time setup.',
    });
  }

  const official = AUTHORIZED_OFFICIALS.find(
    (o) =>
      o.employeeId.toLowerCase() === employeeId.trim().toLowerCase() &&
      o.badgeNumber.toLowerCase() === badgeNumber.trim().toLowerCase()
  );

  const passcodeMatches = envPasscode
    ? verifyPlainConstantTime(passcode.trim(), envPasscode)
    : claimedHash
    ? verifyPasswordHash(passcode.trim(), claimedHash)
    : false;

  if (!official || !passcodeMatches) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Employee ID, Badge Number, or Passcode.',
    });
  }

  const token = createSessionToken(official.id, 'OFFICIAL');
  res.json({ success: true, token, session: { role: 'OFFICIAL', user: official } });
});

app.post('/api/auth/driver/claim', async (req, res) => {
  if (process.env.DRIVER_ACCESS_PASSCODE || claimedRolePasscodes.DRIVER) {
    return res.status(409).json({
      success: false,
      message: 'Driver PIN has already been set up. Please sign in normally.',
    });
  }

  const { employeeId, truckCode, pin } = req.body || {};
  if (typeof employeeId !== 'string' || typeof truckCode !== 'string' || typeof pin !== 'string') {
    return res.status(400).json({ success: false, message: 'Driver ID, Truck Code, and PIN are required.' });
  }
  if (pin.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'Driver PIN must be at least 4 characters.' });
  }

  const driver = drivers.find(
    (d) =>
      d.employeeId.toLowerCase() === employeeId.trim().toLowerCase() &&
      d.truckCode.toLowerCase() === truckCode.trim().toLowerCase()
  );

  if (!driver) {
    return res.status(401).json({
      success: false,
      message: 'Driver Employee ID and Truck Code do not match an assigned truck.',
    });
  }

  const hash = hashPassword(pin.trim());
  claimedRolePasscodes.DRIVER = hash;

  if (supabase) {
    try {
      await supabase.from('role_credentials').upsert({ role: 'DRIVER', passcode_hash: hash });
    } catch {
      // Ignore if table not created yet
    }
  }

  const token = createSessionToken(driver.id, 'DRIVER');
  res.json({ success: true, token, session: { role: 'DRIVER', user: driver } });
});

app.post('/api/auth/driver/login', (req, res) => {
  const { employeeId, truckCode, pin } = req.body || {};
  if (typeof employeeId !== 'string' || typeof truckCode !== 'string' || typeof pin !== 'string') {
    return res.status(400).json({ success: false, message: 'Driver ID, Truck Code, and PIN are required.' });
  }

  const envPin = process.env.DRIVER_ACCESS_PASSCODE;
  const claimedHash = claimedRolePasscodes.DRIVER;

  if (!envPin && !claimedHash) {
    return res.status(403).json({
      success: false,
      message: 'Driver access PIN is not set up yet. Please complete first-time setup.',
    });
  }

  const driver = drivers.find(
    (d) =>
      d.employeeId.toLowerCase() === employeeId.trim().toLowerCase() &&
      d.truckCode.toLowerCase() === truckCode.trim().toLowerCase()
  );

  const pinMatches = envPin
    ? verifyPlainConstantTime(pin.trim(), envPin)
    : claimedHash
    ? verifyPasswordHash(pin.trim(), claimedHash)
    : false;

  if (!driver || !pinMatches) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Driver Employee ID, Truck Code, or PIN.',
    });
  }

  const token = createSessionToken(driver.id, 'DRIVER');
  res.json({ success: true, token, session: { role: 'DRIVER', user: driver } });
});

// --- DRIVER ACTION ENDPOINTS ---

// 1. Get all fleet drivers
app.get('/api/drivers', (_req, res) => {
  res.json({ success: true, count: drivers.length, data: drivers });
});

// 2. Driver "ARRIVE" Action
app.post('/api/driver/arrive', requireAuth(['DRIVER']), (req: AuthenticatedRequest, res) => {
  const { driverId, barangayId } = req.body || {};
  const driverIndex = drivers.findIndex(
    (d) => d.id === req.auth!.userId && (d.id === driverId || d.assignedBarangayId === barangayId)
  );

  if (driverIndex === -1) {
    return res.status(403).json({ success: false, message: 'Driver authorization mismatch.' });
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
  if (brgyIndex !== -1) syncSupabaseBarangay(barangays[brgyIndex]);
  syncSupabaseNotification(arrivalNotif);

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
app.post('/api/driver/eta', requireAuth(['DRIVER']), (req: AuthenticatedRequest, res) => {
  const { driverId, etaMinutes, etaFormatted } = req.body || {};
  const driverIndex = drivers.findIndex((d) => d.id === req.auth!.userId && (!driverId || d.id === driverId));

  if (driverIndex === -1) {
    return res.status(403).json({ success: false, message: 'Driver authorization mismatch.' });
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
  if (brgyIndex !== -1) syncSupabaseBarangay(barangays[brgyIndex]);
  syncSupabaseNotification(etaUpdateNotif);

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
app.post('/api/driver/incident', requireAuth(['DRIVER']), (req: AuthenticatedRequest, res) => {
  const { driverId, cause, category, rescheduledTime, advisory } = req.body || {};
  const driverIndex = drivers.findIndex((d) => d.id === req.auth!.userId && (!driverId || d.id === driverId));

  if (driverIndex === -1) {
    return res.status(403).json({ success: false, message: 'Driver authorization mismatch.' });
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
  if (brgyIndex !== -1) syncSupabaseBarangay(barangays[brgyIndex]);
  syncSupabaseNotification(delayNotif);

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
app.get('/api/admin/audit-logs', requireAuth(['OFFICIAL']), (_req, res) => {
  res.json({ success: true, count: adminAuditLogs.length, data: adminAuditLogs });
});

// 5. Update barangay schedule (Admin endpoint)
app.put('/api/admin/barangays/:id/schedule', requireAuth(['OFFICIAL']), (req, res) => {
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
  syncSupabaseBarangay(barangays[brgyIndex]);
  syncSupabaseNotification(scheduleUpdateNotif);

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
app.post('/api/admin/barangays/:id/delay', requireAuth(['OFFICIAL']), (req, res) => {
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
  syncSupabaseBarangay(barangays[brgyIndex]);
  syncSupabaseNotification(delayNotif);

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
app.post('/api/admin/barangays/:id/resolve-delay', requireAuth(['OFFICIAL']), (req, res) => {
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
  syncSupabaseBarangay(barangays[brgyIndex]);
  syncSupabaseNotification(resolvedNotif);

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
app.post('/api/admin/barangays/:id/override-eta', requireAuth(['OFFICIAL']), (req, res) => {
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
  syncSupabaseBarangay(existing);
  syncSupabaseNotification(overrideNotif);

  broadcastSse('NOTIFICATION', overrideNotif);
  broadcastSse('DATA_SYNC', { barangays, notifications, drivers });

  res.json({ success: true, barangay: existing, notification: overrideNotif });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  await hydrateFromSupabase();

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
