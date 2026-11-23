export type WasteType =
  | 'Biodegradable (Food & Kitchen Waste)'
  | 'Non-Biodegradable (Residual & Plastics)'
  | 'Recyclables (Paper, Cartons & Metal)'
  | 'Hazardous & Special Household Waste'
  | 'General Waste';

export type CollectionStatus = 'ON_SCHEDULE' | 'DELAYED' | 'IN_PROGRESS' | 'COMPLETED';

export interface SpatialCoordinates {
  lat: number;
  lng: number;
}

export type TelemetryPhase =
  | 'APPROACHING_CURB'
  | 'IN_TRANSIT'
  | 'EN_ROUTE_SECTOR'
  | 'ON_SITE_COLLECTING'
  | 'REROUTED_DELAYED'
  | 'DEPOT_STAGED';

export interface Waypoint {
  name: string;
  coordinates: SpatialCoordinates;
  status: 'PASSED' | 'CURRENT' | 'NEXT' | 'FINAL';
  timeEstimate: string;
}

export interface VehicleVitals {
  compactorCapacityPercent: number;
  hydraulicPressurePsi: number;
  fuelLevelPercent: number;
  engineTempC: number;
  crewSize: number;
  driverName: string;
  vehicleType: string;
  odometerKm: number;
}

export interface EdgeNodeHealth {
  edgeNodeId: string;
  rssiLevel: string;
  latencyMs: number;
  satelliteCount: number;
  rtkFixType: 'RTK_FIXED' | 'RTK_FLOAT' | 'DGPS' | '3D_FIX';
  lastSyncIso: string;
}

export interface CorridorImpedance {
  corridorName: string;
  trafficLevel: 'FLOWING' | 'MODERATE' | 'HEAVY' | 'CHOKEPOINT';
  floodRisk: 'NONE' | 'SURFACE_WATER' | 'IMPASSABLE_FLOOD';
  passabilityStatus: 'CLEAR' | 'CAUTION' | 'REROUTED';
}

export interface BarangayTelemetry {
  barangayId: string;
  barangayName: string;
  district: number;
  targetCoordinates: SpatialCoordinates;
  truckCode: string;
  truckCallsign: string;
  contractor: string;
  currentCoordinates: SpatialCoordinates;
  bearing: number;
  headingLabel: string;
  speedKmh: number;
  distanceRemainingKm: number;
  initialDistanceKm: number;
  etaSeconds: number;
  etaFormatted: string;
  predictedArrivalTime: string;
  confidenceScore: number;
  etaWindow: string;
  dispatchPhase: TelemetryPhase;
  vitals: VehicleVitals;
  edgeNode: EdgeNodeHealth;
  impedance: CorridorImpedance;
  waypoints: Waypoint[];
  lastTelemetryPacket?: string;
}

export interface DelayDetails {
  cause: string;
  category: 'Typhoon / Severe Weather' | 'Road Closure / Heavy Traffic' | 'Truck Mechanical Issue' | 'Disposal Facility Congestion' | 'Emergency Rerouting';
  originalDate: string;
  originalTime: string;
  rescheduledDate: string;
  rescheduledTime: string;
  reportedAt: string;
  advisoryNote: string;
}

export interface AdminOfficial {
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

export interface AdminAuditLog {
  id: string;
  adminName: string;
  action: 'SCHEDULE_UPDATED' | 'DELAY_REPORTED' | 'DELAY_RESOLVED' | 'EMERGENCY_BROADCAST';
  barangayName: string;
  details: string;
  timestamp: string;
}

export interface BarangaySchedule {
  id: string;
  name: string;
  district: number;
  subArea?: string;
  zipCode: string;
  regularDays: string[];
  pickupWindow: string;
  wasteType: WasteType;
  nextScheduledDate: string;
  nextScheduledTime: string;
  contractor: string;
  truckCode: string;
  status: CollectionStatus;
  currentDelay?: DelayDetails;
  telemetry?: BarangayTelemetry;
}

export interface ResidentUser {
  id: string;
  fullName: string;
  address: string;
  mobileNumber: string;
  homeBarangayId: string;
  subscribedBarangayIds: string[];
  createdAt: string;
}

export type UserRole = 'RESIDENT' | 'OFFICIAL' | 'DRIVER';

export interface DriverUser {
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
  targetEtaTimestamp?: number; // millisecond timestamp
  targetEtaFormatted?: string; // e.g. "07:35 AM"
  slaBreachDetected?: boolean;
}

export interface ResidentAuthSession {
  role: 'RESIDENT';
  user: ResidentUser;
}

export interface OfficialAuthSession {
  role: 'OFFICIAL';
  user: AdminOfficial;
}

export interface DriverAuthSession {
  role: 'DRIVER';
  user: DriverUser;
}

export type AuthSession = ResidentAuthSession | OfficialAuthSession | DriverAuthSession;

export interface WasteNotification {
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
  severity: 'normal' | 'warning' | 'critical';
  updatedBy?: string;
  telemetryDistanceKm?: number;
  telemetryEtaFormatted?: string;
  isSlaBreach?: boolean;
  driverId?: string;
  truckCode?: string;
}


