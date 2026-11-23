import { AdminOfficial } from '../types';

export const QC_AUTHORIZED_OFFICIALS: AdminOfficial[] = [
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
    department: 'EPWMD Fleet Monitoring & Hauler Operations',
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
