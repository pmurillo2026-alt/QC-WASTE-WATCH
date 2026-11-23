import { BarangayTelemetry, SpatialCoordinates, TelemetryPhase } from '../types';

export const INITIAL_BARANGAY_TELEMETRY: Record<string, BarangayTelemetry> = {
  'brgy-batasan-hills': {
    barangayId: 'brgy-batasan-hills',
    barangayName: 'Batasan Hills',
    district: 2,
    targetCoordinates: { lat: 14.6852, lng: 121.0965 },
    truckCode: 'QC-TRK-204',
    truckCallsign: 'HABAGAT-SWEEPER-204',
    contractor: 'QC EPWMD Fleet Sector 2',
    currentCoordinates: { lat: 14.6738, lng: 121.0825 },
    bearing: 42,
    headingLabel: 'NE 42°',
    speedKmh: 18.2,
    distanceRemainingKm: 2.1,
    initialDistanceKm: 6.8,
    etaSeconds: 685, // ~11m 25s
    etaFormatted: '11m 25s',
    predictedArrivalTime: '11:00 AM (Delayed Reroute)',
    confidenceScore: 78,
    etaWindow: '10:56 AM - 11:04 AM (±4 min)',
    dispatchPhase: 'REROUTED_DELAYED',
    vitals: {
      compactorCapacityPercent: 74,
      hydraulicPressurePsi: 2480,
      fuelLevelPercent: 62,
      engineTempC: 89,
      crewSize: 4,
      driverName: 'Nestor Alcantara',
      vehicleType: 'Isuzu Giga 16-CBM Rear Compactor',
      odometerKm: 48920,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D2-BATASAN-01',
      rssiLevel: '-72 dBm (5G Sub-6)',
      latencyMs: 14,
      satelliteCount: 18,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Batasan-San Mateo Bypass Road',
      trafficLevel: 'HEAVY',
      floodRisk: 'SURFACE_WATER',
      passabilityStatus: 'REROUTED',
    },
    waypoints: [
      { name: 'QC Central Depot (Diliman)', coordinates: { lat: 14.6540, lng: 121.0500 }, status: 'PASSED', timeEstimate: '10:15 AM' },
      { name: 'Commonwealth Ave Flyover', coordinates: { lat: 14.6650, lng: 121.0710 }, status: 'PASSED', timeEstimate: '10:35 AM' },
      { name: 'IBP Road Water Crossing (Bypass)', coordinates: { lat: 14.6738, lng: 121.0825 }, status: 'CURRENT', timeEstimate: '10:48 AM' },
      { name: 'Batasan National High School Gate', coordinates: { lat: 14.6810, lng: 121.0910 }, status: 'NEXT', timeEstimate: '10:55 AM' },
      { name: 'Brgy. Batasan Hall & Curbside Sector', coordinates: { lat: 14.6852, lng: 121.0965 }, status: 'FINAL', timeEstimate: '11:00 AM' },
    ],
  },
  'brgy-commonwealth': {
    barangayId: 'brgy-commonwealth',
    barangayName: 'Commonwealth',
    district: 2,
    targetCoordinates: { lat: 14.7011, lng: 121.0924 },
    truckCode: 'QC-TRK-218',
    truckCallsign: 'SIERRA-DELTA-218',
    contractor: 'Metro Solid Waste Consortium - Sector 2',
    currentCoordinates: { lat: 14.6885, lng: 121.0850 },
    bearing: 25,
    headingLabel: 'NNE 25°',
    speedKmh: 34.5,
    distanceRemainingKm: 1.6,
    initialDistanceKm: 7.2,
    etaSeconds: 310, // ~5m 10s
    etaFormatted: '05m 10s',
    predictedArrivalTime: '07:00 AM (Approaching)',
    confidenceScore: 96,
    etaWindow: '06:58 AM - 07:02 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 42,
      hydraulicPressurePsi: 2280,
      fuelLevelPercent: 81,
      engineTempC: 84,
      crewSize: 5,
      driverName: 'Rogelio Cruz',
      vehicleType: 'Fuso Super Great 20-CBM Compactor',
      odometerKm: 31250,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D2-LITEX-02',
      rssiLevel: '-64 dBm (5G Ultra)',
      latencyMs: 11,
      satelliteCount: 21,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Commonwealth Ave Northbound',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Fairview Depot', coordinates: { lat: 14.7120, lng: 121.0700 }, status: 'PASSED', timeEstimate: '06:30 AM' },
      { name: 'Don Fabian Junction', coordinates: { lat: 14.6930, lng: 121.0820 }, status: 'PASSED', timeEstimate: '06:48 AM' },
      { name: 'Litex Public Market Corridor', coordinates: { lat: 14.6885, lng: 121.0850 }, status: 'CURRENT', timeEstimate: '06:55 AM' },
      { name: 'Commonwealth Elementary Hub', coordinates: { lat: 14.6960, lng: 121.0890 }, status: 'NEXT', timeEstimate: '06:58 AM' },
      { name: 'Commonwealth Barangay Curbside Zone', coordinates: { lat: 14.7011, lng: 121.0924 }, status: 'FINAL', timeEstimate: '07:00 AM' },
    ],
  },
  'brgy-holy-spirit': {
    barangayId: 'brgy-holy-spirit',
    barangayName: 'Holy Spirit',
    district: 2,
    targetCoordinates: { lat: 14.6812, lng: 121.0772 },
    truckCode: 'QC-TRK-209',
    truckCallsign: 'SPIRIT-HAUL-209',
    contractor: 'QC EPWMD Fleet Sector 2',
    currentCoordinates: { lat: 14.6680, lng: 121.0690 },
    bearing: 38,
    headingLabel: 'NE 38°',
    speedKmh: 28.0,
    distanceRemainingKm: 1.8,
    initialDistanceKm: 5.4,
    etaSeconds: 430, // ~7m 10s
    etaFormatted: '07m 10s',
    predictedArrivalTime: '07:15 AM',
    confidenceScore: 94,
    etaWindow: '07:12 AM - 07:17 AM (±2.5 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 35,
      hydraulicPressurePsi: 2200,
      fuelLevelPercent: 77,
      engineTempC: 82,
      crewSize: 4,
      driverName: 'Danilo Morales',
      vehicleType: 'Isuzu Forward 12-CBM Compactor',
      odometerKm: 52100,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D2-HOLYSPIRIT-03',
      rssiLevel: '-68 dBm (5G Sub-6)',
      latencyMs: 13,
      satelliteCount: 19,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Faustino & Holy Spirit Drive',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Commonwealth Corridor', coordinates: { lat: 14.6620, lng: 121.0640 }, status: 'PASSED', timeEstimate: '07:00 AM' },
      { name: 'Doña Juana Gate 1', coordinates: { lat: 14.6680, lng: 121.0690 }, status: 'CURRENT', timeEstimate: '07:08 AM' },
      { name: 'Holy Spirit High School', coordinates: { lat: 14.6750, lng: 121.0730 }, status: 'NEXT', timeEstimate: '07:12 AM' },
      { name: 'Holy Spirit Hall & Parish Curbside', coordinates: { lat: 14.6812, lng: 121.0772 }, status: 'FINAL', timeEstimate: '07:15 AM' },
    ],
  },
  'brgy-bagong-silangan': {
    barangayId: 'brgy-bagong-silangan',
    barangayName: 'Bagong Silangan',
    district: 2,
    targetCoordinates: { lat: 14.7029, lng: 121.1128 },
    truckCode: 'QC-TRK-212',
    truckCallsign: 'TUMANA-ALERT-212',
    contractor: 'QC EPWMD Fleet Sector 2',
    currentCoordinates: { lat: 14.6820, lng: 121.1010 },
    bearing: 48,
    headingLabel: 'NE 48°',
    speedKmh: 12.5,
    distanceRemainingKm: 3.4,
    initialDistanceKm: 8.5,
    etaSeconds: 1540, // ~25m 40s
    etaFormatted: '25m 40s',
    predictedArrivalTime: '01:30 PM (Bridge Mud Clearance)',
    confidenceScore: 68,
    etaWindow: '01:25 PM - 01:40 PM (±7 min)',
    dispatchPhase: 'REROUTED_DELAYED',
    vitals: {
      compactorCapacityPercent: 88,
      hydraulicPressurePsi: 2590,
      fuelLevelPercent: 54,
      engineTempC: 92,
      crewSize: 5,
      driverName: 'Felipe Santos',
      vehicleType: 'Hino 500 16-CBM Severe Heavy Compactor',
      odometerKm: 64120,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D2-SILANGAN-04',
      rssiLevel: '-76 dBm (Edge Mesh)',
      latencyMs: 22,
      satelliteCount: 15,
      rtkFixType: 'RTK_FLOAT',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Tumana Bridge Spillway',
      trafficLevel: 'CHOKEPOINT',
      floodRisk: 'SURFACE_WATER',
      passabilityStatus: 'CAUTION',
    },
    waypoints: [
      { name: 'Batasan East Bypass', coordinates: { lat: 14.6750, lng: 121.0950 }, status: 'PASSED', timeEstimate: '01:00 PM' },
      { name: 'Tumana River Checkpoint', coordinates: { lat: 14.6820, lng: 121.1010 }, status: 'CURRENT', timeEstimate: '01:10 PM' },
      { name: 'Clemencia Lowlands Hub', coordinates: { lat: 14.6940, lng: 121.1070 }, status: 'NEXT', timeEstimate: '01:22 PM' },
      { name: 'Bagong Silangan Brgy Multi-purpose', coordinates: { lat: 14.7029, lng: 121.1128 }, status: 'FINAL', timeEstimate: '01:30 PM' },
    ],
  },
  'brgy-payatas': {
    barangayId: 'brgy-payatas',
    barangayName: 'Payatas',
    district: 2,
    targetCoordinates: { lat: 14.7135, lng: 121.1114 },
    truckCode: 'QC-TRK-230',
    truckCallsign: 'PAYATAS-ECO-230',
    contractor: 'Payatas Eco-Waste Operations',
    currentCoordinates: { lat: 14.7050, lng: 121.1040 },
    bearing: 40,
    headingLabel: 'NE 40°',
    speedKmh: 31.0,
    distanceRemainingKm: 1.2,
    initialDistanceKm: 6.0,
    etaSeconds: 230, // ~3m 50s
    etaFormatted: '03m 50s',
    predictedArrivalTime: '06:00 AM (Imminent)',
    confidenceScore: 98,
    etaWindow: '05:58 AM - 06:02 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 20,
      hydraulicPressurePsi: 2150,
      fuelLevelPercent: 92,
      engineTempC: 80,
      crewSize: 6,
      driverName: 'Arman Manalo',
      vehicleType: 'Isuzu Giga 20-CBM Compactor',
      odometerKm: 28400,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D2-PAYATAS-05',
      rssiLevel: '-62 dBm (5G Ultra)',
      latencyMs: 10,
      satelliteCount: 22,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Payatas Road Southbound',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Lupang Pangako Access Gate', coordinates: { lat: 14.6980, lng: 121.0990 }, status: 'PASSED', timeEstimate: '05:45 AM' },
      { name: 'Payatas B Market Crossing', coordinates: { lat: 14.7050, lng: 121.1040 }, status: 'CURRENT', timeEstimate: '05:54 AM' },
      { name: 'Lupang Pangako Phase 2 Sector', coordinates: { lat: 14.7135, lng: 121.1114 }, status: 'FINAL', timeEstimate: '06:00 AM' },
    ],
  },
  'brgy-socorro-cubao': {
    barangayId: 'brgy-socorro-cubao',
    barangayName: 'Socorro (Cubao)',
    district: 3,
    targetCoordinates: { lat: 14.6225, lng: 121.0560 },
    truckCode: 'QC-TRK-302',
    truckCallsign: 'CUBAO-BACKUP-315',
    contractor: 'Araneta Center - QC Joint Hauling Team',
    currentCoordinates: { lat: 14.6180, lng: 121.0480 },
    bearing: 65,
    headingLabel: 'ENE 65°',
    speedKmh: 21.0,
    distanceRemainingKm: 1.1,
    initialDistanceKm: 4.8,
    etaSeconds: 310, // ~5m 10s
    etaFormatted: '05m 10s',
    predictedArrivalTime: '10:15 PM (Backup Dispatched)',
    confidenceScore: 89,
    etaWindow: '10:12 PM - 10:18 PM (±3 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 28,
      hydraulicPressurePsi: 2220,
      fuelLevelPercent: 70,
      engineTempC: 85,
      crewSize: 4,
      driverName: 'Rommel Valdez',
      vehicleType: 'Fuso Fighter 14-CBM Compactor (Relief)',
      odometerKm: 39500,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D3-CUBAO-01',
      rssiLevel: '-60 dBm (5G Dense Urban)',
      latencyMs: 9,
      satelliteCount: 20,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Aurora Blvd Eastbound',
      trafficLevel: 'MODERATE',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Cubao Fleet Depot', coordinates: { lat: 14.6120, lng: 121.0420 }, status: 'PASSED', timeEstimate: '09:50 PM' },
      { name: 'Gateway / Aurora Intersection', coordinates: { lat: 14.6180, lng: 121.0480 }, status: 'CURRENT', timeEstimate: '10:05 PM' },
      { name: '15th Avenue Commercial Strip', coordinates: { lat: 14.6210, lng: 121.0530 }, status: 'NEXT', timeEstimate: '10:11 PM' },
      { name: 'Socorro Brgy Hall & Tuazon Curbside', coordinates: { lat: 14.6225, lng: 121.0560 }, status: 'FINAL', timeEstimate: '10:15 PM' },
    ],
  },
  'brgy-loyola-heights': {
    barangayId: 'brgy-loyola-heights',
    barangayName: 'Loyola Heights',
    district: 3,
    targetCoordinates: { lat: 14.6402, lng: 121.0735 },
    truckCode: 'QC-TRK-311',
    truckCallsign: 'KATIPUNAN-EAGLE-311',
    contractor: 'QC EPWMD Fleet Sector 3',
    currentCoordinates: { lat: 14.6310, lng: 121.0660 },
    bearing: 36,
    headingLabel: 'NE 36°',
    speedKmh: 36.0,
    distanceRemainingKm: 1.4,
    initialDistanceKm: 5.5,
    etaSeconds: 240, // ~4m 00s
    etaFormatted: '04m 00s',
    predictedArrivalTime: '06:30 AM (In Transit)',
    confidenceScore: 97,
    etaWindow: '06:28 AM - 06:32 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 50,
      hydraulicPressurePsi: 2310,
      fuelLevelPercent: 86,
      engineTempC: 83,
      crewSize: 4,
      driverName: 'Jonathan Dizon',
      vehicleType: 'Isuzu Forward 14-CBM Compactor',
      odometerKm: 34100,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D3-KATIPUNAN-02',
      rssiLevel: '-63 dBm (5G Campus)',
      latencyMs: 11,
      satelliteCount: 20,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Katipunan Ave Northbound',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Santolan Flyover Access', coordinates: { lat: 14.6220, lng: 121.0610 }, status: 'PASSED', timeEstimate: '06:15 AM' },
      { name: 'Ateneo Gate 3 Corridor', coordinates: { lat: 14.6310, lng: 121.0660 }, status: 'CURRENT', timeEstimate: '06:24 AM' },
      { name: 'Esteban Abada Residential Sector', coordinates: { lat: 14.6380, lng: 121.0710 }, status: 'NEXT', timeEstimate: '06:28 AM' },
      { name: 'Loyola Heights Barangay Station', coordinates: { lat: 14.6402, lng: 121.0735 }, status: 'FINAL', timeEstimate: '06:30 AM' },
    ],
  },
  'brgy-up-diliman': {
    barangayId: 'brgy-up-diliman',
    barangayName: 'UP Campus (Diliman)',
    district: 4,
    targetCoordinates: { lat: 14.6537, lng: 121.0685 },
    truckCode: 'QC-TRK-405',
    truckCallsign: 'DILIMAN-GREEN-405',
    contractor: 'UP-QC Joint Environmental Team',
    currentCoordinates: { lat: 14.6470, lng: 121.0580 },
    bearing: 58,
    headingLabel: 'ENE 58°',
    speedKmh: 26.5,
    distanceRemainingKm: 1.3,
    initialDistanceKm: 4.2,
    etaSeconds: 295, // ~4m 55s
    etaFormatted: '04m 55s',
    predictedArrivalTime: '07:30 AM (In Transit)',
    confidenceScore: 98,
    etaWindow: '07:28 AM - 07:32 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 30,
      hydraulicPressurePsi: 2180,
      fuelLevelPercent: 88,
      engineTempC: 81,
      crewSize: 4,
      driverName: 'Marcial Gomez',
      vehicleType: 'Hino 300 10-CBM Clean Diesel Compactor',
      odometerKm: 27120,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D4-DILIMAN-01',
      rssiLevel: '-61 dBm (5G Research Link)',
      latencyMs: 9,
      satelliteCount: 23,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'University Ave / C.P. Garcia',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Philcoa Entryway Checkpoint', coordinates: { lat: 14.6410, lng: 121.0510 }, status: 'PASSED', timeEstimate: '07:15 AM' },
      { name: 'University Ave Oblation Gate', coordinates: { lat: 14.6470, lng: 121.0580 }, status: 'CURRENT', timeEstimate: '07:23 AM' },
      { name: 'Academic Oval Outer Perimeter', coordinates: { lat: 14.6510, lng: 121.0640 }, status: 'NEXT', timeEstimate: '07:27 AM' },
      { name: 'UP Campus Residential Village Depot', coordinates: { lat: 14.6537, lng: 121.0685 }, status: 'FINAL', timeEstimate: '07:30 AM' },
    ],
  },
  'brgy-krus-na-ligas': {
    barangayId: 'brgy-krus-na-ligas',
    barangayName: 'Krus na Ligas',
    district: 4,
    targetCoordinates: { lat: 14.6481, lng: 121.0610 },
    truckCode: 'QC-TRK-410',
    truckCallsign: 'CP-GARCIA-410',
    contractor: 'QC EPWMD Fleet Sector 4',
    currentCoordinates: { lat: 14.6430, lng: 121.0540 },
    bearing: 49,
    headingLabel: 'NE 49°',
    speedKmh: 24.0,
    distanceRemainingKm: 0.9,
    initialDistanceKm: 3.5,
    etaSeconds: 180, // ~3m 00s
    etaFormatted: '03m 00s',
    predictedArrivalTime: '06:00 AM (Approaching)',
    confidenceScore: 99,
    etaWindow: '05:58 AM - 06:02 AM (±1.5 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 25,
      hydraulicPressurePsi: 2190,
      fuelLevelPercent: 90,
      engineTempC: 81,
      crewSize: 4,
      driverName: 'Leo Villanueva',
      vehicleType: 'Isuzu Elf 8-CBM Alley-Narrow Compactor',
      odometerKm: 38200,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D4-LIGAS-02',
      rssiLevel: '-65 dBm (5G Sub-6)',
      latencyMs: 12,
      satelliteCount: 20,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'C.P. Garcia Ave & Plaza St',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Magiting St Entry', coordinates: { lat: 14.6400, lng: 121.0490 }, status: 'PASSED', timeEstimate: '05:48 AM' },
      { name: 'C.P. Garcia Intersection', coordinates: { lat: 14.6430, lng: 121.0540 }, status: 'CURRENT', timeEstimate: '05:55 AM' },
      { name: 'Plaza & Holy Cross Chapel Curbside', coordinates: { lat: 14.6481, lng: 121.0610 }, status: 'FINAL', timeEstimate: '06:00 AM' },
    ],
  },
  'brgy-kamuning': {
    barangayId: 'brgy-kamuning',
    barangayName: 'Kamuning',
    district: 4,
    targetCoordinates: { lat: 14.6301, lng: 121.0375 },
    truckCode: 'QC-TRK-418',
    truckCallsign: 'MORATO-FLEET-418',
    contractor: 'QC EPWMD Fleet Sector 4',
    currentCoordinates: { lat: 14.6210, lng: 121.0310 },
    bearing: 33,
    headingLabel: 'NNE 33°',
    speedKmh: 30.2,
    distanceRemainingKm: 1.3,
    initialDistanceKm: 4.8,
    etaSeconds: 260, // ~4m 20s
    etaFormatted: '04m 20s',
    predictedArrivalTime: '07:00 AM (Approaching)',
    confidenceScore: 97,
    etaWindow: '06:58 AM - 07:02 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 48,
      hydraulicPressurePsi: 2320,
      fuelLevelPercent: 79,
      engineTempC: 84,
      crewSize: 5,
      driverName: 'Rodolfo Mendoza',
      vehicleType: 'Isuzu Giga 16-CBM Rear Compactor',
      odometerKm: 41200,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D4-KAMUNING-03',
      rssiLevel: '-62 dBm (5G Dense Urban)',
      latencyMs: 10,
      satelliteCount: 21,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Tomas Morato Ave & K-1st',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Timog Avenue Circle', coordinates: { lat: 14.6150, lng: 121.0260 }, status: 'PASSED', timeEstimate: '06:45 AM' },
      { name: 'Scout Gandia Corner', coordinates: { lat: 14.6210, lng: 121.0310 }, status: 'CURRENT', timeEstimate: '06:53 AM' },
      { name: 'Kamuning Market Sector', coordinates: { lat: 14.6270, lng: 121.0350 }, status: 'NEXT', timeEstimate: '06:58 AM' },
      { name: 'Kamuning Barangay Operations Hall', coordinates: { lat: 14.6301, lng: 121.0375 }, status: 'FINAL', timeEstimate: '07:00 AM' },
    ],
  },
  'brgy-tandang-sora': {
    barangayId: 'brgy-tandang-sora',
    barangayName: 'Tandang Sora',
    district: 6,
    targetCoordinates: { lat: 14.6780, lng: 121.0470 },
    truckCode: 'QC-TRK-604',
    truckCallsign: 'BANLAT-DISPATCH-604',
    contractor: 'QC EPWMD Fleet Sector 6',
    currentCoordinates: { lat: 14.6650, lng: 121.0390 },
    bearing: 30,
    headingLabel: 'NNE 30°',
    speedKmh: 35.0,
    distanceRemainingKm: 1.7,
    initialDistanceKm: 6.2,
    etaSeconds: 290, // ~4m 50s
    etaFormatted: '04m 50s',
    predictedArrivalTime: '07:00 AM',
    confidenceScore: 96,
    etaWindow: '06:57 AM - 07:02 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 38,
      hydraulicPressurePsi: 2260,
      fuelLevelPercent: 84,
      engineTempC: 83,
      crewSize: 4,
      driverName: 'Oscar Ramos',
      vehicleType: 'Fuso Super Great 18-CBM Compactor',
      odometerKm: 33900,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D6-TANDANGSORA-01',
      rssiLevel: '-66 dBm (5G Sub-6)',
      latencyMs: 12,
      satelliteCount: 19,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Mindanao Ave & Banlat Rd',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Congressional Ave Interchange', coordinates: { lat: 14.6550, lng: 121.0320 }, status: 'PASSED', timeEstimate: '06:40 AM' },
      { name: 'Mindanao / Tandang Sora Flyover', coordinates: { lat: 14.6650, lng: 121.0390 }, status: 'CURRENT', timeEstimate: '06:52 AM' },
      { name: 'Banlat National Shrine Gate', coordinates: { lat: 14.6730, lng: 121.0440 }, status: 'NEXT', timeEstimate: '06:57 AM' },
      { name: 'Tandang Sora Curbside Collection Point', coordinates: { lat: 14.6780, lng: 121.0470 }, status: 'FINAL', timeEstimate: '07:00 AM' },
    ],
  },
  'brgy-culiat': {
    barangayId: 'brgy-culiat',
    barangayName: 'Culiat',
    district: 6,
    targetCoordinates: { lat: 14.6644, lng: 121.0535 },
    truckCode: 'QC-TRK-615',
    truckCallsign: 'LUZON-BYPASS-615',
    contractor: 'QC EPWMD Fleet Sector 6',
    currentCoordinates: { lat: 14.6520, lng: 121.0440 },
    bearing: 38,
    headingLabel: 'NE 38°',
    speedKmh: 14.2,
    distanceRemainingKm: 2.3,
    initialDistanceKm: 7.1,
    etaSeconds: 840, // ~14m 00s
    etaFormatted: '14m 00s',
    predictedArrivalTime: '10:30 AM (Pipe Repair Reroute)',
    confidenceScore: 75,
    etaWindow: '10:25 AM - 10:35 AM (±5 min)',
    dispatchPhase: 'REROUTED_DELAYED',
    vitals: {
      compactorCapacityPercent: 62,
      hydraulicPressurePsi: 2420,
      fuelLevelPercent: 68,
      engineTempC: 88,
      crewSize: 4,
      driverName: 'Benito Flores',
      vehicleType: 'Isuzu Forward 14-CBM Compactor',
      odometerKm: 51200,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D6-CULIAT-02',
      rssiLevel: '-70 dBm (5G Sub-6)',
      latencyMs: 15,
      satelliteCount: 17,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Luzon Avenue Water Pipe Construction',
      trafficLevel: 'HEAVY',
      floodRisk: 'NONE',
      passabilityStatus: 'REROUTED',
    },
    waypoints: [
      { name: 'Central Ave Terminal', coordinates: { lat: 14.6440, lng: 121.0380 }, status: 'PASSED', timeEstimate: '10:00 AM' },
      { name: 'Tandang Sora Reroute Divergence', coordinates: { lat: 14.6520, lng: 121.0440 }, status: 'CURRENT', timeEstimate: '10:14 AM' },
      { name: 'Muslim Compound Curbside Entry', coordinates: { lat: 14.6590, lng: 121.0490 }, status: 'NEXT', timeEstimate: '10:24 AM' },
      { name: 'Culiat Brgy Hall Collection Area', coordinates: { lat: 14.6644, lng: 121.0535 }, status: 'FINAL', timeEstimate: '10:30 AM' },
    ],
  },
  'brgy-fairview': {
    barangayId: 'brgy-fairview',
    barangayName: 'Fairview',
    district: 5,
    targetCoordinates: { lat: 14.7104, lng: 121.0645 },
    truckCode: 'QC-TRK-508',
    truckCallsign: 'REGALADO-SPEED-508',
    contractor: 'QC North Waste Solutions - Sector 5',
    currentCoordinates: { lat: 14.6990, lng: 121.0580 },
    bearing: 31,
    headingLabel: 'NNE 31°',
    speedKmh: 33.8,
    distanceRemainingKm: 1.5,
    initialDistanceKm: 6.0,
    etaSeconds: 270, // ~4m 30s
    etaFormatted: '04m 30s',
    predictedArrivalTime: '06:45 AM (Approaching)',
    confidenceScore: 98,
    etaWindow: '06:43 AM - 06:47 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 44,
      hydraulicPressurePsi: 2270,
      fuelLevelPercent: 82,
      engineTempC: 83,
      crewSize: 5,
      driverName: 'Gregorio Garcia',
      vehicleType: 'Fuso Super Great 18-CBM Compactor',
      odometerKm: 32600,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D5-FAIRVIEW-01',
      rssiLevel: '-64 dBm (5G Ultra)',
      latencyMs: 11,
      satelliteCount: 21,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Regalado Highway & Fairview Park',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'West Fairview Depot', coordinates: { lat: 14.6890, lng: 121.0510 }, status: 'PASSED', timeEstimate: '06:30 AM' },
      { name: 'Regalado / Commonwealth Junction', coordinates: { lat: 14.6990, lng: 121.0580 }, status: 'CURRENT', timeEstimate: '06:39 AM' },
      { name: 'Fairview Park Subdivision Gate', coordinates: { lat: 14.7060, lng: 121.0620 }, status: 'NEXT', timeEstimate: '06:43 AM' },
      { name: 'Fairview Barangay Complex', coordinates: { lat: 14.7104, lng: 121.0645 }, status: 'FINAL', timeEstimate: '06:45 AM' },
    ],
  },
  'brgy-novaliches-proper': {
    barangayId: 'brgy-novaliches-proper',
    barangayName: 'Novaliches Proper',
    district: 5,
    targetCoordinates: { lat: 14.7290, lng: 121.0420 },
    truckCode: 'QC-TRK-512',
    truckCallsign: 'QUIRINO-SWIFT-512',
    contractor: 'QC North Waste Solutions - Sector 5',
    currentCoordinates: { lat: 14.7180, lng: 121.0360 },
    bearing: 28,
    headingLabel: 'NNE 28°',
    speedKmh: 31.5,
    distanceRemainingKm: 1.4,
    initialDistanceKm: 7.0,
    etaSeconds: 270, // ~4m 30s
    etaFormatted: '04m 30s',
    predictedArrivalTime: '09:30 PM (Approaching)',
    confidenceScore: 97,
    etaWindow: '09:28 PM - 09:32 PM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 55,
      hydraulicPressurePsi: 2360,
      fuelLevelPercent: 75,
      engineTempC: 84,
      crewSize: 4,
      driverName: 'Vicente Aguilar',
      vehicleType: 'Isuzu Giga 16-CBM Rear Compactor',
      odometerKm: 44100,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D5-NOVALICHES-02',
      rssiLevel: '-63 dBm (5G Sub-6)',
      latencyMs: 12,
      satelliteCount: 20,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Quirino Highway Bayan Corridor',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'SM Novaliches Transit Point', coordinates: { lat: 14.7080, lng: 121.0310 }, status: 'PASSED', timeEstimate: '09:15 PM' },
      { name: 'Novaliches Bayan Arch', coordinates: { lat: 14.7180, lng: 121.0360 }, status: 'CURRENT', timeEstimate: '09:24 PM' },
      { name: 'Bayan Public Market Square', coordinates: { lat: 14.7250, lng: 121.0400 }, status: 'NEXT', timeEstimate: '09:28 PM' },
      { name: 'Novaliches Proper Plaza Curbside', coordinates: { lat: 14.7290, lng: 121.0420 }, status: 'FINAL', timeEstimate: '09:30 PM' },
    ],
  },
  'brgy-san-antonio': {
    barangayId: 'brgy-san-antonio',
    barangayName: 'San Antonio',
    district: 1,
    targetCoordinates: { lat: 14.6472, lng: 121.0180 },
    truckCode: 'QC-TRK-103',
    truckCallsign: 'ROOSEVELT-CREW-103',
    contractor: 'QC EPWMD Fleet Sector 1',
    currentCoordinates: { lat: 14.6390, lng: 121.0120 },
    bearing: 36,
    headingLabel: 'NE 36°',
    speedKmh: 27.5,
    distanceRemainingKm: 1.1,
    initialDistanceKm: 4.5,
    etaSeconds: 240, // ~4m 00s
    etaFormatted: '04m 00s',
    predictedArrivalTime: '06:30 AM (Approaching)',
    confidenceScore: 98,
    etaWindow: '06:28 AM - 06:32 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 32,
      hydraulicPressurePsi: 2210,
      fuelLevelPercent: 87,
      engineTempC: 82,
      crewSize: 4,
      driverName: 'Salvador Tan',
      vehicleType: 'Isuzu Forward 12-CBM Compactor',
      odometerKm: 31800,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D1-SANANTONIO-01',
      rssiLevel: '-61 dBm (5G Dense Urban)',
      latencyMs: 10,
      satelliteCount: 22,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'FPJ Ave (Roosevelt) & San Antonio',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'EDSA Muñoz Station', coordinates: { lat: 14.6320, lng: 121.0070 }, status: 'PASSED', timeEstimate: '06:18 AM' },
      { name: 'FPJ Ave / Zamboanga St', coordinates: { lat: 14.6390, lng: 121.0120 }, status: 'CURRENT', timeEstimate: '06:25 AM' },
      { name: 'San Antonio Church & Plaza Curbside', coordinates: { lat: 14.6472, lng: 121.0180 }, status: 'FINAL', timeEstimate: '06:30 AM' },
    ],
  },
  'brgy-project-6': {
    barangayId: 'brgy-project-6',
    barangayName: 'Project 6',
    district: 1,
    targetCoordinates: { lat: 14.6610, lng: 121.0380 },
    truckCode: 'QC-TRK-109',
    truckCallsign: 'VISAYAS-COMPACTOR-109',
    contractor: 'QC EPWMD Fleet Sector 1',
    currentCoordinates: { lat: 14.6520, lng: 121.0310 },
    bearing: 38,
    headingLabel: 'NE 38°',
    speedKmh: 29.0,
    distanceRemainingKm: 1.2,
    initialDistanceKm: 4.8,
    etaSeconds: 250, // ~4m 10s
    etaFormatted: '04m 10s',
    predictedArrivalTime: '07:00 AM (Approaching)',
    confidenceScore: 98,
    etaWindow: '06:58 AM - 07:02 AM (±2 min)',
    dispatchPhase: 'APPROACHING_CURB',
    vitals: {
      compactorCapacityPercent: 40,
      hydraulicPressurePsi: 2240,
      fuelLevelPercent: 82,
      engineTempC: 83,
      crewSize: 5,
      driverName: 'Edgardo Reyes',
      vehicleType: 'Fuso Fighter 14-CBM Compactor',
      odometerKm: 36700,
    },
    edgeNode: {
      edgeNodeId: 'EDGE-QC-D1-PROJECT6-02',
      rssiLevel: '-62 dBm (5G Sub-6)',
      latencyMs: 11,
      satelliteCount: 21,
      rtkFixType: 'RTK_FIXED',
      lastSyncIso: new Date().toISOString(),
    },
    impedance: {
      corridorName: 'Visayas Avenue & Road 1',
      trafficLevel: 'FLOWING',
      floodRisk: 'NONE',
      passabilityStatus: 'CLEAR',
    },
    waypoints: [
      { name: 'Elliptical Road QC Memorial Exit', coordinates: { lat: 14.6450, lng: 121.0250 }, status: 'PASSED', timeEstimate: '06:45 AM' },
      { name: 'Visayas Ave / Road 8 Crossing', coordinates: { lat: 14.6520, lng: 121.0310 }, status: 'CURRENT', timeEstimate: '06:54 AM' },
      { name: 'Project 6 Elementary & Barangay Oval', coordinates: { lat: 14.6610, lng: 121.0380 }, status: 'FINAL', timeEstimate: '07:00 AM' },
    ],
  },
};

// Haversine distance in kilometers
export function calculateDistanceKm(c1: SpatialCoordinates, c2: SpatialCoordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Format seconds into "12m 45s" or "1h 14m"
export function formatEtaCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00m 00s (Arrived)';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

// Compute phase from remaining seconds and status
export function determinePhase(etaSeconds: number, isDelayed: boolean): TelemetryPhase {
  if (isDelayed) return 'REROUTED_DELAYED';
  if (etaSeconds <= 0) return 'ON_SITE_COLLECTING';
  if (etaSeconds <= 600) return 'APPROACHING_CURB'; // under 10m
  if (etaSeconds <= 2700) return 'IN_TRANSIT'; // 10 to 45m
  return 'EN_ROUTE_SECTOR';
}

// Tick-by-tick simulation step generator
export function stepTelemetrySimulation(
  current: Record<string, BarangayTelemetry>,
  speedMultiplier: number = 1
): { updated: Record<string, BarangayTelemetry>; packetLogs: string[] } {
  const updated: Record<string, BarangayTelemetry> = {};
  const packetLogs: string[] = [];

  Object.entries(current).forEach(([id, item]) => {
    // Decrement ETA seconds
    let newSeconds = item.etaSeconds - Math.max(1, Math.round(1 * speedMultiplier));
    if (newSeconds < 0) {
      newSeconds = 0;
    }

    // Move coordinates proportionally towards target
    const target = item.targetCoordinates;
    const curr = item.currentCoordinates;

    // Subtle natural coordinate progression
    const stepRatio = 0.0006 * speedMultiplier;
    const latDelta = (target.lat - curr.lat) * stepRatio;
    const lngDelta = (target.lng - curr.lng) * stepRatio;

    const newLat = parseFloat((curr.lat + latDelta).toFixed(5));
    const newLng = parseFloat((curr.lng + lngDelta).toFixed(5));

    // Calculate real remaining distance
    const dist = calculateDistanceKm({ lat: newLat, lng: newLng }, target);

    // Natural fluctuation in speed
    const jitter = (Math.random() - 0.5) * 1.5;
    const newSpeed = Math.max(8, parseFloat((item.speedKmh + jitter).toFixed(1)));

    // Hydraulic fluctuation
    const psiJitter = Math.floor((Math.random() - 0.5) * 15);
    const newPsi = Math.min(2700, Math.max(2000, item.vitals.hydraulicPressurePsi + psiJitter));

    // Latency jitter
    const latencyJitter = Math.floor((Math.random() - 0.5) * 3);
    const newLatency = Math.max(8, Math.min(45, item.edgeNode.latencyMs + latencyJitter));

    const newPhase = determinePhase(newSeconds, item.dispatchPhase === 'REROUTED_DELAYED');

    const updatedItem: BarangayTelemetry = {
      ...item,
      currentCoordinates: { lat: newLat, lng: newLng },
      distanceRemainingKm: dist,
      speedKmh: newSpeed,
      etaSeconds: newSeconds,
      etaFormatted: formatEtaCountdown(newSeconds),
      dispatchPhase: newPhase,
      vitals: {
        ...item.vitals,
        hydraulicPressurePsi: newPsi,
      },
      edgeNode: {
        ...item.edgeNode,
        latencyMs: newLatency,
        lastSyncIso: new Date().toISOString(),
      },
    };

    updated[id] = updatedItem;

    // Sample packet log for edge ingestion console
    if (Math.random() < 0.25) {
      packetLogs.push(
        `[${updatedItem.edgeNode.edgeNodeId}] RTK_FIX: Lat ${newLat.toFixed(4)}, Lng ${newLng.toFixed(4)} | ` +
        `Spd ${newSpeed}km/h | Rem ${dist}km | ETA ${updatedItem.etaFormatted} | ` +
        `Hauler ${updatedItem.truckCode} | Sig ${updatedItem.edgeNode.rssiLevel} | Ping ${newLatency}ms`
      );
    }
  });

  return { updated, packetLogs };
}
