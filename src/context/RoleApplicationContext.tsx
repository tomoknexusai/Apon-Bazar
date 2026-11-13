/**
 * AANO BAZAR APPLICATION ROLE SYSTEM ENGINE
 * Comprehensive Management for:
 * 1. District Admin (Strictly 1 Active per District)
 * 2. Upazila Operational Officer (Strictly 1 Active per Upazila)
 * 3. Product Delivery Man (Unlimited across all Districts/Upazilas)
 *
 * STRICT SECURITY RULE:
 * Application data is sensitive administrative information and is visible
 * EXCLUSIVELY to authorized Super Admin users.
 *
 * Project: আনো বাজার (AANO BAZAR)
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  RoleApplication,
  ApplicationRoleType,
  ApplicationStatus,
  DistrictAdminQuota,
  UpazilaOfficerQuota,
  UserProfile,
  UserRole,
  ServiceAddress,
  ApplicationAuditLog,
  FIXED_SUPER_ADMIN_ID
} from '../types';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { BD_DIVISIONS } from '../lib/bd-locations';
import { canAccessRoleApplications } from '../lib/rbac';

interface RoleApplicationContextType {
  applications: RoleApplication[];
  isSuperAdminAuthorized: boolean;
  auditLogs: ApplicationAuditLog[];
  
  // Vacancy & Area Validation Queries
  checkDistrictAdminVacancy: (districtName: string) => {
    isVacant: boolean;
    activeAdmin?: UserProfile;
    pendingCount: number;
    message: string;
  };
  checkUpazilaOfficerVacancy: (districtName: string, upazilaName: string) => {
    isVacant: boolean;
    activeOfficer?: UserProfile;
    pendingCount: number;
    message: string;
  };
  getDeliveryMenCountForArea: (districtName: string, upazilaName?: string) => {
    activeCount: number;
    pendingCount: number;
  };
  
  // Submission & Tracking (Applicant-safe)
  submitRoleApplication: (
    data: Omit<RoleApplication, 'id' | 'trackingNumber' | 'status' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ success: boolean; application?: RoleApplication; trackingNumber?: string; message: string }>;
  
  getApplicationByTracking: (trackingNumberOrMobile: string) => RoleApplication | undefined;
  getApplicationsByMobile: (mobile: string) => RoleApplication[];
  
  // Super Admin Exclusive Management Actions
  putUnderReview: (applicationId: string, notes?: string) => Promise<{ success: boolean; message: string }>;
  rejectApplication: (applicationId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  approveApplication: (applicationId: string) => Promise<{ success: boolean; user?: UserProfile; roleId?: string; message: string }>;
  deleteApplication: (applicationId: string) => Promise<{ success: boolean; message: string }>;
  requestApplicantInfo: (applicationId: string, infoRequestText: string) => Promise<{ success: boolean; message: string }>;
  addInternalNote: (applicationId: string, noteText: string) => Promise<{ success: boolean; message: string }>;
  cancelApplication: (applicationId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  logApplicationAudit: (
    action: string,
    applicationId: string,
    applicantName?: string,
    position?: string,
    reasonOrNote?: string
  ) => void;
  
  // Quota & Area Summaries
  getAllDistrictQuotas: () => DistrictAdminQuota[];
  getAllUpazilaQuotas: (districtName?: string) => UpazilaOfficerQuota[];
  getOverallStats: () => {
    totalApplications: number;
    pendingApplications: number;
    approvedAdminsCount: number;
    totalDistricts: number;
    districtsOccupied: number;
    districtsVacant: number;
    totalUpazilas: number;
    upazilasOccupied: number;
    upazilasVacant: number;
    totalDeliveryMen: number;
  };
}

const STORAGE_APPLICATIONS_KEY = 'aano_bazar_role_applications_v2';
const STORAGE_APP_AUDIT_LOGS_KEY = 'aano_bazar_app_audit_logs_v2';

// Seed demo applications
const initialSeedApplications: RoleApplication[] = [
  {
    id: 'APP-000001',
    applicationId: 'APP-000001',
    trackingNumber: 'APP-ADM-260101',
    roleType: 'admin',
    appliedPosition: 'Admin',
    fullName: 'তানজিনা রহমান',
    applicantName: 'তানজিনা রহমান',
    mobileNumber: '01711000002',
    email: 'tanjina.admin@tomshopbd.com',
    nationalId: '19942691234567892',
    dateOfBirth: '1994-05-20',
    gender: 'female',
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'গুলশান',
    unionName: 'গুলশান-১',
    address: 'ব্লক বি, রোড ৫১, গুলশান-১, ঢাকা',
    fullAddress: 'ব্লক বি, রোড ৫১, গুলশান-১, ঢাকা',
    educationalQualification: 'MBA in Management, Dhaka University',
    experienceYears: '5+ Years',
    previousExperience: 'Former Regional Operations Lead at Retail Co.',
    statementOfPurpose: 'Dedicated to modernizing grocery and e-commerce distribution across Dhaka District.',
    documents: [
      { title: 'National ID Card (Front & Back)', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
      { title: 'Educational Certificate (MBA)', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' },
      { title: 'Trade/Professional Reference', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
    ],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    nidFrontPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
    status: 'Approved',
    reviewedBy: 'Mirza Khatib Uddin (Super Admin)',
    reviewedByUserId: FIXED_SUPER_ADMIN_ID,
    reviewedByUserName: 'Mirza Khatib Uddin',
    reviewDate: '2026-01-02',
    reviewedAt: '2026-01-02T10:00:00.000Z',
    adminNotes: 'Candidate has exemplary qualifications and leadership credentials for Dhaka District Admin role.',
    internalNotes: [
      { id: 'NOTE-001', authorId: FIXED_SUPER_ADMIN_ID, authorName: 'Mirza Khatib Uddin', text: 'Document verification and background check completed successfully.', createdAt: '2026-01-02T09:30:00.000Z' }
    ],
    history: [
      { id: 'HIST-001', action: 'Application Submitted', actorId: 'usr-applicant-01', actorName: 'তানজিনা রহমান', timestamp: '2026-01-01T08:30:00.000Z', note: 'Public Portal Submission' },
      { id: 'HIST-002', action: 'Application Reviewed', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-02T09:15:00.000Z', note: 'Put under executive review' },
      { id: 'HIST-003', action: 'Application Approved', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-02T10:00:00.000Z', note: 'Approved and granted District Admin role (ADM-DHAKA-01)' }
    ],
    assignedUserId: 'usr-admin-02',
    assignedRoleUniqueId: 'ADM-DHAKA-01',
    approvedAt: '2026-01-02T10:00:00.000Z',
    applicationDate: '2026-01-01',
    createdAt: '2026-01-01T08:30:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z'
  },
  {
    id: 'APP-000002',
    applicationId: 'APP-000002',
    trackingNumber: 'APP-OPS-260102',
    roleType: 'operational_officer',
    appliedPosition: 'Operations Officer',
    fullName: 'ফরিদা পারভীন',
    applicantName: 'ফরিদা পারভীন',
    mobileNumber: '01611000005',
    email: 'farida.ops@tomshopbd.com',
    nationalId: '19912691234567895',
    dateOfBirth: '1991-03-30',
    gender: 'female',
    division: 'রাজশাহী',
    district: 'রাজশাহী',
    upazila: 'বোয়ালিয়া',
    unionName: 'সাহেব বাজার',
    address: 'হাব ভবন ৩য় তলা, সাহেব বাজার, বোয়ালিয়া, রাজশাহী',
    fullAddress: 'হাব ভবন ৩য় তলা, সাহেব বাজার, বোয়ালিয়া, রাজশাহী',
    educationalQualification: 'BBA in Supply Chain Management',
    experienceYears: '4 Years',
    previousExperience: 'Hub in-charge and logistics coordinator',
    statementOfPurpose: 'Ensuring 100% same-day and fresh deliveries across Boalia Upazila.',
    documents: [
      { title: 'NID Card Copy', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
      { title: 'Supply Chain Diploma', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
    ],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    status: 'Approved',
    reviewedBy: 'Mirza Khatib Uddin (Super Admin)',
    reviewedByUserId: FIXED_SUPER_ADMIN_ID,
    reviewedByUserName: 'Mirza Khatib Uddin',
    reviewDate: '2026-01-12',
    reviewedAt: '2026-01-12T14:00:00.000Z',
    adminNotes: 'Approved as Upazila Operations Officer for Boalia Upazila.',
    internalNotes: [],
    history: [
      { id: 'HIST-004', action: 'Application Submitted', actorId: 'usr-applicant-02', actorName: 'ফরিদা পারভীন', timestamp: '2026-01-10T11:20:00.000Z', note: 'Public Portal Submission' },
      { id: 'HIST-005', action: 'Application Approved', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-12T14:00:00.000Z', note: 'Assigned OPS-BOALIA-01' }
    ],
    assignedUserId: 'usr-partner-05',
    assignedRoleUniqueId: 'OPS-BOALIA-01',
    approvedAt: '2026-01-12T14:00:00.000Z',
    applicationDate: '2026-01-10',
    createdAt: '2026-01-10T11:20:00.000Z',
    updatedAt: '2026-01-12T14:00:00.000Z'
  },
  {
    id: 'APP-000003',
    applicationId: 'APP-000003',
    trackingNumber: 'APP-DEL-260103',
    roleType: 'delivery_man',
    appliedPosition: 'Product Delivery Man',
    fullName: 'রাশেদুল হাসান',
    applicantName: 'রাশেদুল হাসান',
    mobileNumber: '01511000006',
    email: 'rashedul.del@tomshopbd.com',
    nationalId: '19982691234567896',
    dateOfBirth: '1998-09-18',
    gender: 'male',
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'মিরপুর',
    unionName: 'মিরপুর-১০',
    address: 'ব্লক সি, লাইন ২, মিরপুর-১০, ঢাকা',
    fullAddress: 'ব্লক সি, লাইন ২, মিরপুর-১০, ঢাকা',
    vehicleType: 'Motorcycle',
    vehicleRegNumber: 'DHAKA-METRO-HA-12-3456',
    drivingLicenseNumber: 'DL-88392019',
    emergencyContact: '01711223344',
    emergencyContactRelation: 'Brother',
    educationalQualification: 'HSC Passed',
    experienceYears: '3 Years',
    previousExperience: 'Food & Express parcel delivery rider',
    statementOfPurpose: 'Eager to serve customers with speed, precision, and courtesy.',
    documents: [
      { title: 'Driving License Copy', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
      { title: 'Vehicle Registration Document', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
    ],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    status: 'Approved',
    reviewedBy: 'Mirza Khatib Uddin (Super Admin)',
    reviewedByUserId: FIXED_SUPER_ADMIN_ID,
    reviewedByUserName: 'Mirza Khatib Uddin',
    reviewDate: '2026-01-15',
    reviewedAt: '2026-01-15T09:00:00.000Z',
    adminNotes: 'Valid license and motorcycle verified. Assigned Mirpur delivery route.',
    internalNotes: [],
    history: [
      { id: 'HIST-006', action: 'Application Submitted', actorId: 'usr-applicant-03', actorName: 'রাশেদুল হাসান', timestamp: '2026-01-14T15:10:00.000Z', note: 'Public Portal Submission' },
      { id: 'HIST-007', action: 'Application Approved', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-15T09:00:00.000Z', note: 'Assigned DEL-MIRPUR-01' }
    ],
    assignedUserId: 'usr-rider-06',
    assignedRoleUniqueId: 'DEL-MIRPUR-01',
    approvedAt: '2026-01-15T09:00:00.000Z',
    applicationDate: '2026-01-14',
    createdAt: '2026-01-14T15:10:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z'
  },
  {
    id: 'APP-000004',
    applicationId: 'APP-000004',
    trackingNumber: 'APP-ADM-260210',
    roleType: 'admin',
    appliedPosition: 'Admin',
    fullName: 'মোঃ শহিদুল আলম',
    applicantName: 'মোঃ শহিদুল আলম',
    mobileNumber: '01819876543',
    email: 'shahidul.khulna@gmail.com',
    nationalId: '19892691234567898',
    dateOfBirth: '1989-08-14',
    gender: 'male',
    division: 'খুলনা',
    district: 'খুলনা',
    upazila: 'খুলনা সদর',
    unionName: 'সোনাডাঙ্গা',
    address: 'মজিদ স্মরণী, সোনাডাঙ্গা, খুলনা',
    fullAddress: 'মজিদ স্মরণী, সোনাডাঙ্গা, খুলনা',
    educationalQualification: 'Masters in Economics, Rajshahi University',
    experienceYears: '6 Years',
    previousExperience: 'Business Development Manager at Agro Export Ltd.',
    statementOfPurpose: 'I want to lead TOMSHOPBD operations across Khulna District as the District Admin.',
    documents: [
      { title: 'National ID Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
      { title: 'Academic Certificate (Masters)', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
    ],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
    status: 'Pending',
    adminNotes: 'Under review for Khulna District Admin appointment.',
    internalNotes: [],
    history: [
      { id: 'HIST-008', action: 'Application Submitted', actorId: 'usr-applicant-04', actorName: 'মোঃ শহিদুল আলম', timestamp: '2026-02-10T11:00:00.000Z', note: 'Public Portal Submission' }
    ],
    applicationDate: '2026-02-10',
    createdAt: '2026-02-10T11:00:00.000Z',
    updatedAt: '2026-02-10T11:00:00.000Z'
  },
  {
    id: 'APP-000005',
    applicationId: 'APP-000005',
    trackingNumber: 'APP-OPS-260215',
    roleType: 'operational_officer',
    appliedPosition: 'Operations Officer',
    fullName: 'আরিফুল ইসলাম সুজন',
    applicantName: 'আরিফুল ইসলাম সুজন',
    mobileNumber: '01912345670',
    email: 'ariful.dumuria@gmail.com',
    nationalId: '19932691234567877',
    dateOfBirth: '1993-11-22',
    gender: 'male',
    division: 'খুলনা',
    district: 'খুলনা',
    upazila: 'ডুমুরিয়া',
    unionName: 'ডুমুরিয়া সদর',
    address: 'ডুমুরিয়া বাজার রোড, ডুমুরিয়া, খুলনা',
    fullAddress: 'ডুমুরিয়া বাজার রোড, ডুমুরিয়া, খুলনা',
    educationalQualification: 'Graduation in Management',
    experienceYears: '3.5 Years',
    previousExperience: 'Local FMCG Distribution Supervisor',
    statementOfPurpose: 'Eager to manage and monitor order distribution in Dumuria Upazila.',
    documents: [
      { title: 'National ID Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' }
    ],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    status: 'Pending',
    internalNotes: [],
    history: [
      { id: 'HIST-009', action: 'Application Submitted', actorId: 'usr-applicant-05', actorName: 'আরিফুল ইসলাম সুজন', timestamp: '2026-02-15T09:45:00.000Z', note: 'Public Portal Submission' }
    ],
    applicationDate: '2026-02-15',
    createdAt: '2026-02-15T09:45:00.000Z',
    updatedAt: '2026-02-15T09:45:00.000Z'
  },
  {
    id: 'APP-000006',
    applicationId: 'APP-000006',
    trackingNumber: 'APP-DEL-260218',
    roleType: 'delivery_man',
    appliedPosition: 'Product Delivery Man',
    fullName: 'সাজ্জাদ হোসেন রনি',
    applicantName: 'সাজ্জাদ হোসেন রনি',
    mobileNumber: '01755123456',
    email: 'sajjad.rider@gmail.com',
    nationalId: '19992691234567844',
    dateOfBirth: '1999-04-12',
    gender: 'male',
    division: 'খুলনা',
    district: 'খুলনা',
    upazila: 'ডুমুরিয়া',
    unionName: 'ডুমুরিয়া সদর',
    address: 'শান্তিনগর, ডুমুরিয়া, খুলনা',
    fullAddress: 'শান্তিনগর, ডুমুরিয়া, খুলনা',
    vehicleType: 'Bicycle',
    emergencyContact: '01755998877',
    emergencyContactRelation: 'Father',
    educationalQualification: 'HSC',
    experienceYears: '1 Year',
    previousExperience: 'Courier Delivery Boy',
    statementOfPurpose: 'Fast and reliable delivery in Dumuria local area.',
    documents: [
      { title: 'NID Card Copy', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' }
    ],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
    status: 'Pending',
    internalNotes: [],
    history: [
      { id: 'HIST-010', action: 'Application Submitted', actorId: 'usr-applicant-06', actorName: 'সাজ্জাদ হোসেন রনি', timestamp: '2026-02-18T14:30:00.000Z', note: 'Public Portal Submission' }
    ],
    applicationDate: '2026-02-18',
    createdAt: '2026-02-18T14:30:00.000Z',
    updatedAt: '2026-02-18T14:30:00.000Z'
  }
];

const initialSeedAuditLogs: ApplicationAuditLog[] = [
  {
    id: 'AUD-APP-001',
    superAdminId: FIXED_SUPER_ADMIN_ID,
    superAdminName: 'Mirza Khatib Uddin',
    applicationId: 'APP-000001',
    applicantName: 'তানজিনা রহমান',
    appliedPosition: 'Admin',
    action: 'Application Approved',
    date: '2026-01-02',
    time: '10:00:00',
    reasonOrNote: 'District Admin appointed for Dhaka District with Role ID ADM-DHAKA-01',
    createdAt: '2026-01-02T10:00:00.000Z'
  },
  {
    id: 'AUD-APP-002',
    superAdminId: FIXED_SUPER_ADMIN_ID,
    superAdminName: 'Mirza Khatib Uddin',
    applicationId: 'APP-000002',
    applicantName: 'ফরিদা পারভীন',
    appliedPosition: 'Operations Officer',
    action: 'Application Approved',
    date: '2026-01-12',
    time: '14:00:00',
    reasonOrNote: 'Operations Officer appointed for Boalia Upazila with Role ID OPS-BOALIA-01',
    createdAt: '2026-01-12T14:00:00.000Z'
  },
  {
    id: 'AUD-APP-003',
    superAdminId: FIXED_SUPER_ADMIN_ID,
    superAdminName: 'Mirza Khatib Uddin',
    applicationId: 'APP-000003',
    applicantName: 'রাশেদুল হাসান',
    appliedPosition: 'Product Delivery Man',
    action: 'Application Approved',
    date: '2026-01-15',
    time: '09:00:00',
    reasonOrNote: 'Product Delivery Rider verified and onboarded with Role ID DEL-MIRPUR-01',
    createdAt: '2026-01-15T09:00:00.000Z'
  }
];

const RoleApplicationContext = createContext<RoleApplicationContextType | undefined>(undefined);

export const RoleApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { allUsers, currentUser, updateUserByAdmin, registerUser } = useAuth();
  const { addToast, sendNotification } = useNotifications();

  const isSuperAdminAuthorized = useMemo(() => {
    return canAccessRoleApplications(currentUser);
  }, [currentUser]);

  // Secure raw applications store
  const [storedApplications, setStoredApplications] = useState<RoleApplication[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_APPLICATIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load applications from localStorage', e);
    }
    return initialSeedApplications;
  });

  // Secure audit logs store
  const [auditLogs, setAuditLogs] = useState<ApplicationAuditLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_APP_AUDIT_LOGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load audit logs from localStorage', e);
    }
    return initialSeedAuditLogs;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_APPLICATIONS_KEY, JSON.stringify(storedApplications));
    } catch (e) {
      console.error('Failed to persist applications to localStorage', e);
    }
  }, [storedApplications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_APP_AUDIT_LOGS_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Failed to persist audit logs to localStorage', e);
    }
  }, [auditLogs]);

  // =========================================================================
  // STRICT DATA VISIBILITY ENFORCEMENT:
  // If user is NOT Super Admin, return empty array to prevent client leaks.
  // =========================================================================
  const applications = useMemo(() => {
    if (!isSuperAdminAuthorized) {
      return [];
    }
    return storedApplications;
  }, [isSuperAdminAuthorized, storedApplications]);

  // Helper to log application audit
  const logApplicationAudit = (
    action: string,
    applicationId: string,
    applicantName?: string,
    position?: string,
    reasonOrNote?: string
  ) => {
    const nowIso = new Date().toISOString();
    const nowDate = nowIso.slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 8);

    const newLog: ApplicationAuditLog = {
      id: `AUD-APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superAdminId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
      superAdminName: currentUser?.fullName || 'Super Admin',
      applicationId,
      applicantName: applicantName || 'Applicant',
      appliedPosition: position || 'Responsible Position',
      action,
      date: nowDate,
      time: nowTime,
      reasonOrNote: reasonOrNote || `Action '${action}' executed`,
      createdAt: nowIso
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // =========================================================================
  // 1. VACANCY & AREA QUOTA LOGIC (Strict 1 Admin / District, 1 Officer / Upazila)
  // =========================================================================

  const checkDistrictAdminVacancy = (districtName: string) => {
    if (!districtName) {
      return { isVacant: true, pendingCount: 0, message: 'জেলা নির্বাচন করুন।' };
    }

    const cleanDistrict = districtName.trim().toLowerCase();

    // 1. Find active Admin in allUsers
    const activeAdmin = allUsers.find((u) => {
      const isActive = u.accountStatus === 'active';
      const hasAdminRole = u.roles?.includes('admin') || u.primaryRole === 'admin';
      const userDistrict = (u.mandatoryAddress?.district || '').trim().toLowerCase();
      return isActive && hasAdminRole && userDistrict === cleanDistrict;
    });

    // 2. Count pending applications for this district
    const pendingCount = storedApplications.filter(
      (app) =>
        app.roleType === 'admin' &&
        (app.status.toLowerCase() === 'pending' || app.status.toLowerCase() === 'under_review' || app.status.toLowerCase() === 'under review') &&
        (app.district || '').trim().toLowerCase() === cleanDistrict
    ).length;

    if (activeAdmin) {
      return {
        isVacant: false,
        activeAdmin,
        pendingCount,
        message: `${districtName} জেলায় ইতোমধ্যে একজন অনুমোদিত ও সক্রিয় জেলা অ্যাডমিন (${activeAdmin.fullName} - আইডি: ${activeAdmin.permanentMemberId || activeAdmin.id}) দায়িত্ব পালন করছেন। নতুন অ্যাডমিন নিয়োগের জন্য আসনটি বর্তমানে খালি নেই।`
      };
    }

    return {
      isVacant: true,
      pendingCount,
      message: `${districtName} জেলায় জেলা অ্যাডমিনের পদটি বর্তমানে খালি (Vacant) রয়েছে। আবেদন গ্রহণ করা হচ্ছে।`
    };
  };

  const checkUpazilaOfficerVacancy = (districtName: string, upazilaName: string) => {
    if (!upazilaName) {
      return { isVacant: true, pendingCount: 0, message: 'উপজেলা নির্বাচন করুন।' };
    }

    const cleanDistrict = (districtName || '').trim().toLowerCase();
    const cleanUpazila = upazilaName.trim().toLowerCase();

    const activeOfficer = allUsers.find((u) => {
      const isActive = u.accountStatus === 'active';
      const hasOpsRole = u.roles?.includes('operations_partner') || u.primaryRole === 'operations_partner';
      const userUpazila = (u.mandatoryAddress?.upazila || '').trim().toLowerCase();
      const userDistrict = (u.mandatoryAddress?.district || '').trim().toLowerCase();
      return isActive && hasOpsRole && userUpazila === cleanUpazila && (!cleanDistrict || userDistrict === cleanDistrict);
    });

    const pendingCount = storedApplications.filter(
      (app) =>
        app.roleType === 'operational_officer' &&
        (app.status.toLowerCase() === 'pending' || app.status.toLowerCase() === 'under_review' || app.status.toLowerCase() === 'under review') &&
        (app.upazila || '').trim().toLowerCase() === cleanUpazila
    ).length;

    if (activeOfficer) {
      return {
        isVacant: false,
        activeOfficer,
        pendingCount,
        message: `${upazilaName} উপজেলায় ইতোমধ্যে একজন অনুমোদিত ও সক্রিয় অপারেশনাল অফিসার (${activeOfficer.fullName} - আইডি: ${activeOfficer.permanentMemberId || activeOfficer.id}) দায়িত্ব পালন করছেন। নতুন অফিসারের জন্য আসনটি বর্তমানে খালি নেই।`
      };
    }

    return {
      isVacant: true,
      pendingCount,
      message: `${upazilaName} উপজেলায় অপারেশনাল অফিসারের পদটি বর্তমানে খালি (Vacant) রয়েছে। আবেদন গ্রহণ করা হচ্ছে।`
    };
  };

  const getDeliveryMenCountForArea = (districtName: string, upazilaName?: string) => {
    const cleanDistrict = (districtName || '').trim().toLowerCase();
    const cleanUpazila = (upazilaName || '').trim().toLowerCase();

    const activeCount = allUsers.filter((u) => {
      const isActive = u.accountStatus === 'active';
      const isRider = u.roles?.includes('delivery_rider') || u.primaryRole === 'delivery_rider';
      const userDistrict = (u.mandatoryAddress?.district || '').trim().toLowerCase();
      const userUpazila = (u.mandatoryAddress?.upazila || '').trim().toLowerCase();

      if (!isActive || !isRider) return false;
      if (cleanUpazila) {
        return userUpazila === cleanUpazila;
      }
      return userDistrict === cleanDistrict;
    }).length;

    const pendingCount = storedApplications.filter((app) => {
      if (app.roleType !== 'delivery_man') return false;
      const st = app.status.toLowerCase();
      if (st !== 'pending' && st !== 'under_review' && st !== 'under review') return false;
      if (cleanUpazila) {
        return (app.upazila || '').trim().toLowerCase() === cleanUpazila;
      }
      return (app.district || '').trim().toLowerCase() === cleanDistrict;
    }).length;

    return { activeCount, pendingCount };
  };

  // =========================================================================
  // 2. SUBMISSION LOGIC (Public / Applicant Portal)
  // =========================================================================

  const submitRoleApplication = async (
    data: Omit<RoleApplication, 'id' | 'trackingNumber' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; application?: RoleApplication; trackingNumber?: string; message: string }> => {
    try {
      // 1. Validation for Role Rules & Area Availability
      if (data.roleType === 'admin') {
        const vacancy = checkDistrictAdminVacancy(data.district);
        if (!vacancy.isVacant) {
          return {
            success: false,
            message: `আবেদন ব্যর্থ: ${data.district} জেলায় ইতোমধ্যে একজন সক্রিয় জেলা অ্যাডমিন নিয়োজিত রয়েছেন। এক জেলায় একাধিক জেলা অ্যাডমিন নিযুক্ত করা সম্ভব নয়।`
          };
        }
      } else if (data.roleType === 'operational_officer') {
        if (!data.upazila) {
          return { success: false, message: 'অপারেশনাল অফিসার আবেদনের জন্য উপজেলা নির্বাচন আবশ্যক।' };
        }
        const vacancy = checkUpazilaOfficerVacancy(data.district, data.upazila);
        if (!vacancy.isVacant) {
          return {
            success: false,
            message: `আবেদন ব্যর্থ: ${data.upazila} উপজেলায় ইতোমধ্যে একজন সক্রিয় অপারেশনাল অফিসার নিয়োজিত রয়েছেন। এক উপজেলায় একাধিক অফিসার নিযুক্ত করা সম্ভব নয়।`
          };
        }
      }

      // 2. Check for duplicate pending application for the same mobile and role
      const cleanMobile = data.mobileNumber.trim().replace(/\D/g, '');
      const existingPending = storedApplications.find(
        (app) =>
          app.roleType === data.roleType &&
          (app.status.toLowerCase() === 'pending' || app.status.toLowerCase().includes('review')) &&
          app.mobileNumber.trim().replace(/\D/g, '') === cleanMobile
      );

      if (existingPending) {
        return {
          success: false,
          message: `মোবাইল নম্বর ${data.mobileNumber} দিয়ে ইতোমধ্যেই এই পদের একটি আবেদন জমা রয়েছে (ট্র্যাকিং আইডি: ${existingPending.trackingNumber})। দয়া করে স্ট্যাটাস চেক করুন।`
        };
      }

      // 3. Generate IDs
      const prefix =
        data.roleType === 'admin'
          ? 'APP-ADM'
          : data.roleType === 'operational_officer'
          ? 'APP-OPS'
          : 'APP-DEL';
      const timestampPart = Date.now().toString().slice(-6);
      const trackingNumber = `${prefix}-${timestampPart}`;
      const applicationId = `APP-${String(storedApplications.length + 101).padStart(6, '0')}`;

      const appliedPosition =
        data.roleType === 'admin'
          ? 'Admin'
          : data.roleType === 'operational_officer'
          ? 'Operations Officer'
          : 'Product Delivery Man';

      const nowIso = new Date().toISOString();

      const newApp: RoleApplication = {
        ...data,
        id: applicationId,
        applicationId,
        trackingNumber,
        appliedPosition,
        applicantName: data.fullName,
        status: 'Pending',
        adminNotes: '',
        internalNotes: [],
        history: [
          {
            id: `HIST-${Date.now()}`,
            action: 'Application Submitted',
            actorId: 'public_portal',
            actorName: data.fullName,
            timestamp: nowIso,
            note: 'Application submitted via public role application portal'
          }
        ],
        applicationDate: nowIso.slice(0, 10),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      setStoredApplications((prev) => [newApp, ...prev]);

      // 4. Notification EXCLUSIVELY to Super Admin
      sendNotification(
        FIXED_SUPER_ADMIN_ID,
        `New ${appliedPosition} Application Received`,
        `Application ID: ${applicationId}. Applicant: ${data.fullName}, Position: ${appliedPosition}, Location: ${data.district}${data.upazila ? ', ' + data.upazila : ''}. Visible in Super Admin Dashboard.`,
        'in_app',
        { applicationId, trackingNumber, position: appliedPosition, district: data.district }
      );

      // 5. Record Audit Log
      logApplicationAudit(
        'Application Submitted',
        applicationId,
        data.fullName,
        appliedPosition,
        `New application submitted via public portal for location: ${data.district}${data.upazila ? ', ' + data.upazila : ''}.`
      );

      addToast({
        title: 'আবেদন সফলভাবে জমা হয়েছে!',
        message: `আপনার ${
          data.roleType === 'admin'
            ? 'জেলা অ্যাডমিন'
            : data.roleType === 'operational_officer'
            ? 'উপজেলা অপারেশনাল অফিসার'
            : 'প্রোডাক্ট ডেলিভারি ম্যান'
        } আবেদন গৃহীত হয়েছে। ট্র্যাকিং আইডি: ${trackingNumber}`,
        type: 'success'
      });

      return {
        success: true,
        application: newApp,
        trackingNumber,
        message: `আপনার আবেদন সফলভাবে গৃহীত হয়েছে। আপনার ট্র্যাকিং আইডি: ${trackingNumber} (Application ID: ${applicationId})। কর্তৃপক্ষ যাচাই-বাছাই শেষে অনুমোদন প্রদান করবেন।`
      };
    } catch (err: any) {
      console.error('Failed to submit role application:', err);
      return { success: false, message: err?.message || 'আবেদন জমা দিতে সমস্যা হয়েছে।' };
    }
  };

  // Status tracker lookup (applicant safe lookup for single record)
  const getApplicationByTracking = (trackingNumberOrMobile: string): RoleApplication | undefined => {
    if (!trackingNumberOrMobile || !trackingNumberOrMobile.trim()) return undefined;
    const clean = trackingNumberOrMobile.trim().toLowerCase();
    const cleanDigits = clean.replace(/\D/g, '');

    return storedApplications.find((app) => {
      if (app.trackingNumber.toLowerCase() === clean) return true;
      if (app.id.toLowerCase() === clean) return true;
      if (app.applicationId && app.applicationId.toLowerCase() === clean) return true;
      if (cleanDigits && app.mobileNumber.replace(/\D/g, '') === cleanDigits) return true;
      if (app.nationalId && app.nationalId.toLowerCase() === clean) return true;
      return false;
    });
  };

  const getApplicationsByMobile = (mobile: string): RoleApplication[] => {
    if (!mobile) return [];
    const cleanDigits = mobile.trim().replace(/\D/g, '');
    return storedApplications.filter((app) => app.mobileNumber.replace(/\D/g, '').includes(cleanDigits));
  };

  // =========================================================================
  // 3. SUPER ADMIN EXCLUSIVE ACTIONS (With Strict RBAC & Audit Trail)
  // =========================================================================

  const putUnderReview = async (applicationId: string, notes?: string): Promise<{ success: boolean; message: string }> => {
    if (!isSuperAdminAuthorized) {
      return { success: false, message: '403 Forbidden: Only Super Admin can manage applications.' };
    }

    const app = storedApplications.find((a) => a.id === applicationId || a.applicationId === applicationId || a.trackingNumber === applicationId);
    if (!app) return { success: false, message: 'আবেদন পাওয়া যায়নি।' };

    const nowIso = new Date().toISOString();

    setStoredApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: 'Under Review',
              adminNotes: notes ? (a.adminNotes ? `${a.adminNotes}\n${notes}` : notes) : a.adminNotes,
              reviewedBy: `${currentUser?.fullName || 'Super Admin'} (Super Admin)`,
              reviewedByUserId: currentUser?.id,
              reviewedByUserName: currentUser?.fullName,
              reviewDate: nowIso.slice(0, 10),
              reviewedAt: nowIso,
              updatedAt: nowIso,
              history: [
                ...(a.history || []),
                {
                  id: `HIST-${Date.now()}`,
                  action: 'Application Reviewed',
                  actorId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
                  actorName: currentUser?.fullName || 'Super Admin',
                  timestamp: nowIso,
                  note: notes || 'Put under review'
                }
              ]
            }
          : a
      )
    );

    logApplicationAudit(
      'Application Reviewed',
      app.applicationId || app.id,
      app.fullName,
      app.appliedPosition,
      notes || 'Put under active review by Super Admin.'
    );

    addToast({
      title: 'আবেদন পর্যালোচনা তালিকায় রাখা হয়েছে',
      message: `ট্র্যাকিং আইডি: ${app.trackingNumber} এখন পর্যালোচনায় রয়েছে।`,
      type: 'info'
    });

    return { success: true, message: 'আবেদন সফলভাবে পর্যালোচনা তালিকায় যুক্ত করা হয়েছে।' };
  };

  const requestApplicantInfo = async (applicationId: string, infoRequestText: string): Promise<{ success: boolean; message: string }> => {
    if (!isSuperAdminAuthorized) {
      return { success: false, message: '403 Forbidden: Only Super Admin can request applicant information.' };
    }

    const app = storedApplications.find((a) => a.id === applicationId || a.applicationId === applicationId || a.trackingNumber === applicationId);
    if (!app) return { success: false, message: 'আবেদন পাওয়া যায়নি।' };

    const nowIso = new Date().toISOString();

    setStoredApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: 'Under Review',
              internalNotes: [
                ...(a.internalNotes || []),
                {
                  id: `NOTE-${Date.now()}`,
                  authorId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
                  authorName: currentUser?.fullName || 'Super Admin',
                  text: `[Applicant Info Request]: ${infoRequestText}`,
                  createdAt: nowIso,
                  isInfoRequest: true
                }
              ],
              history: [
                ...(a.history || []),
                {
                  id: `HIST-${Date.now()}`,
                  action: 'Information Requested',
                  actorId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
                  actorName: currentUser?.fullName || 'Super Admin',
                  timestamp: nowIso,
                  note: infoRequestText
                }
              ],
              updatedAt: nowIso
            }
          : a
      )
    );

    logApplicationAudit(
      'Information Requested',
      app.applicationId || app.id,
      app.fullName,
      app.appliedPosition,
      infoRequestText
    );

    return { success: true, message: 'আবেদনকারীর নিকট প্রয়োজনীয় অতিরিক্ত তথ্যের অনুরোধ নথিভুক্ত হয়েছে।' };
  };

  const addInternalNote = async (applicationId: string, noteText: string): Promise<{ success: boolean; message: string }> => {
    if (!isSuperAdminAuthorized) {
      return { success: false, message: '403 Forbidden: Only Super Admin can add internal notes.' };
    }

    const app = storedApplications.find((a) => a.id === applicationId || a.applicationId === applicationId || a.trackingNumber === applicationId);
    if (!app) return { success: false, message: 'আবেদন পাওয়া যায়নি।' };

    const nowIso = new Date().toISOString();

    setStoredApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              internalNotes: [
                ...(a.internalNotes || []),
                {
                  id: `NOTE-${Date.now()}`,
                  authorId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
                  authorName: currentUser?.fullName || 'Super Admin',
                  text: noteText,
                  createdAt: nowIso
                }
              ],
              updatedAt: nowIso
            }
          : a
      )
    );

    logApplicationAudit(
      'Internal Note Added',
      app.applicationId || app.id,
      app.fullName,
      app.appliedPosition,
      noteText
    );

    return { success: true, message: 'অভ্যন্তরীণ নোট সফলভাবে সংরক্ষণ করা হয়েছে।' };
  };

  const rejectApplication = async (applicationId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    if (!isSuperAdminAuthorized) {
      return { success: false, message: '403 Forbidden: Only Super Admin can reject applications.' };
    }

    const app = storedApplications.find((a) => a.id === applicationId || a.applicationId === applicationId || a.trackingNumber === applicationId);
    if (!app) return { success: false, message: 'আবেদন পাওয়া যায়নি।' };

    const nowIso = new Date().toISOString();

    setStoredApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: 'Rejected',
              rejectionReason: reason || 'যোগ্যতা বা এলাকার নীতিমালার সাথে সংগতিপূর্ণ না হওয়ায় বাতিল করা হয়েছে।',
              reviewedBy: `${currentUser?.fullName || 'Super Admin'} (Super Admin)`,
              reviewedByUserId: currentUser?.id,
              reviewedByUserName: currentUser?.fullName,
              reviewDate: nowIso.slice(0, 10),
              reviewedAt: nowIso,
              updatedAt: nowIso,
              history: [
                ...(a.history || []),
                {
                  id: `HIST-${Date.now()}`,
                  action: 'Application Rejected',
                  actorId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
                  actorName: currentUser?.fullName || 'Super Admin',
                  timestamp: nowIso,
                  note: reason
                }
              ]
            }
          : a
      )
    );

    logApplicationAudit(
      'Application Rejected',
      app.applicationId || app.id,
      app.fullName,
      app.appliedPosition,
      reason || 'Application rejected by Super Admin.'
    );

    addToast({
      title: 'আবেদন বাতিল করা হয়েছে',
      message: `আবেদন ${app.trackingNumber} বাতিল করা হয়েছে।`,
      type: 'warning'
    });

    return { success: true, message: 'আবেদন বাতিল করা হয়েছে।' };
  };

  const cancelApplication = async (applicationId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    if (!isSuperAdminAuthorized) {
      return { success: false, message: '403 Forbidden: Only Super Admin can cancel applications.' };
    }

    const app = storedApplications.find((a) => a.id === applicationId || a.applicationId === applicationId || a.trackingNumber === applicationId);
    if (!app) return { success: false, message: 'আবেদন পাওয়া যায়নি।' };

    const nowIso = new Date().toISOString();

    setStoredApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: 'Cancelled',
              rejectionReason: reason || 'Cancelled',
              updatedAt: nowIso,
              history: [
                ...(a.history || []),
                {
                  id: `HIST-${Date.now()}`,
                  action: 'Application Cancelled',
                  actorId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
                  actorName: currentUser?.fullName || 'Super Admin',
                  timestamp: nowIso,
                  note: reason || 'Application cancelled'
                }
              ]
            }
          : a
      )
    );

    logApplicationAudit(
      'Status Changed',
      app.applicationId || app.id,
      app.fullName,
      app.appliedPosition,
      reason || 'Application marked as Cancelled by Super Admin.'
    );

    return { success: true, message: 'আবেদন বাতিল (Cancelled) তালিকায় রাখা হয়েছে।' };
  };

  const deleteApplication = async (applicationId: string): Promise<{ success: boolean; message: string }> => {
    if (!isSuperAdminAuthorized) {
      return { success: false, message: '403 Forbidden: Only Super Admin can delete applications.' };
    }

    const app = storedApplications.find((a) => a.id === applicationId || a.applicationId === applicationId);
    setStoredApplications((prev) => prev.filter((a) => a.id !== applicationId && a.applicationId !== applicationId));

    if (app) {
      logApplicationAudit(
        'Application Deleted',
        app.applicationId || app.id,
        app.fullName,
        app.appliedPosition,
        'Application record deleted by Super Admin'
      );
    }

    return { success: true, message: 'আবেদন সফলভাবে মুছে ফেলা হয়েছে।' };
  };

  const approveApplication = async (
    applicationId: string
  ): Promise<{ success: boolean; user?: UserProfile; roleId?: string; message: string }> => {
    if (!isSuperAdminAuthorized) {
      return { success: false, message: '403 Forbidden: Only Super Admin can approve applications.' };
    }

    const app = storedApplications.find((a) => a.id === applicationId || a.applicationId === applicationId || a.trackingNumber === applicationId);
    if (!app) return { success: false, message: 'আবেদন পাওয়া যায়নি।' };

    // 1. Re-verify area quota rules at the moment of approval
    if (app.roleType === 'admin') {
      const vacancy = checkDistrictAdminVacancy(app.district);
      if (!vacancy.isVacant && vacancy.activeAdmin?.id !== app.assignedUserId) {
        return {
          success: false,
          message: `অনুমোদন ব্যর্থ: ${app.district} জেলায় ইতোমধ্যে একজন সক্রিয় জেলা অ্যাডমিন নিযুক্ত রয়েছেন (${vacancy.activeAdmin?.fullName})। প্রথমে বর্তমান অ্যাডমিনকে প্রত্যাহার/স্থগিত করুন।`
        };
      }
    } else if (app.roleType === 'operational_officer') {
      if (!app.upazila) return { success: false, message: 'উপজেলা তথ্য অনুপস্থিত।' };
      const vacancy = checkUpazilaOfficerVacancy(app.district, app.upazila);
      if (!vacancy.isVacant && vacancy.activeOfficer?.id !== app.assignedUserId) {
        return {
          success: false,
          message: `অনুমোদন ব্যর্থ: ${app.upazila} উপজেলায় ইতোমধ্যে একজন সক্রিয় অপারেশনাল অফিসার নিযুক্ত রয়েছেন (${vacancy.activeOfficer?.fullName})। প্রথমে বর্তমান অফিসারকে প্রত্যাহার/স্থগিত করুন।`
        };
      }
    }

    // 2. Generate appropriate Unique Role ID
    let roleUniqueId = '';
    let targetRole: UserRole = 'customer';

    if (app.roleType === 'admin') {
      targetRole = 'admin';
      const districtCode = app.district.replace(/\s+/g, '').slice(0, 4).toUpperCase();
      roleUniqueId = `ADM-${districtCode}-${Date.now().toString().slice(-4)}`;
    } else if (app.roleType === 'operational_officer') {
      targetRole = 'operations_partner';
      const upazilaCode = (app.upazila || 'UPZ').replace(/\s+/g, '').slice(0, 4).toUpperCase();
      roleUniqueId = `OPS-${upazilaCode}-${Date.now().toString().slice(-4)}`;
    } else {
      targetRole = 'delivery_rider';
      roleUniqueId = `DEL-${Date.now().toString().slice(-6)}`;
    }

    // 3. Find or Create User
    const cleanMobile = app.mobileNumber.trim().replace(/\D/g, '');
    let existingUser = allUsers.find(
      (u) => u.mobileNumber.trim().replace(/\D/g, '') === cleanMobile
    );

    let resultingUserId = existingUser?.id || `usr-${targetRole.replace('_', '-')}-${Date.now().toString().slice(-5)}`;

    const effectiveAddress: ServiceAddress = {
      id: `addr-role-${Date.now()}`,
      userId: resultingUserId,
      title: `${
        app.roleType === 'admin'
          ? 'জেলা অ্যাডমিন কার্যনির্বাহী কার্যালয়'
          : app.roleType === 'operational_officer'
          ? 'উপজেলা অপারেশনাল অফিস'
          : 'ডেলিভারি সার্ভিস এরিয়া'
      }`,
      division: app.division,
      district: app.district,
      upazila: app.upazila || (app.district + ' সদর'),
      unionName: app.unionName || 'কেন্দ্রীয় এলাকা',
      area: app.serviceAreaName || app.villagePara || app.fullAddress || app.district,
      fullServiceAddress: app.fullAddress || `${app.district}, ${app.division}`,
      postalCode: '1000',
      motorcycleModel: app.vehicleType,
      vehicleRegNumber: app.vehicleRegNumber,
      drivingLicenseNumber: app.drivingLicenseNumber,
      isMandatoryServiceAddress: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingUser) {
      const existingRoles = existingUser.roles || [existingUser.primaryRole];
      const updatedRoles = Array.from(new Set([...existingRoles, targetRole]));

      const updatedUser: UserProfile = {
        ...existingUser,
        accountStatus: 'active',
        verificationStatus: 'verified',
        primaryRole: targetRole,
        roles: updatedRoles,
        permanentMemberId: existingUser.permanentMemberId || roleUniqueId,
        mandatoryAddress: effectiveAddress,
        vehicleType: app.vehicleType || existingUser.vehicleType,
        vehicleRegNumber: app.vehicleRegNumber || existingUser.vehicleRegNumber,
        drivingLicenseNumber: app.drivingLicenseNumber || existingUser.drivingLicenseNumber,
        updatedAt: new Date().toISOString()
      };

      try {
        updateUserByAdmin(existingUser.id, updatedUser, effectiveAddress);
      } catch (e) {
        console.warn('updateUserByAdmin fallback', e);
      }
    } else {
      try {
        registerUser({
          fullName: app.fullName,
          mobileNumber: app.mobileNumber,
          email: app.email,
          role: targetRole,
          nationalId: app.nationalId,
          division: app.division,
          district: app.district,
          upazila: app.upazila,
          unionName: app.unionName,
          area: app.serviceAreaName || app.villagePara || app.fullAddress,
          fullServiceAddress: app.fullAddress || `${app.district}, ${app.division}`,
          vehicleType: app.vehicleType,
          vehicleRegNumber: app.vehicleRegNumber,
          drivingLicenseNumber: app.drivingLicenseNumber
        });
      } catch (e) {
        console.warn('registerUser fallback', e);
      }
    }

    const nowIso = new Date().toISOString();

    // 4. Update Application status
    setStoredApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: 'Approved',
              assignedUserId: resultingUserId,
              assignedRoleUniqueId: roleUniqueId,
              reviewedBy: `${currentUser?.fullName || 'Super Admin'} (Super Admin)`,
              reviewedByUserId: currentUser?.id,
              reviewedByUserName: currentUser?.fullName,
              reviewDate: nowIso.slice(0, 10),
              reviewedAt: nowIso,
              approvedAt: nowIso,
              updatedAt: nowIso,
              history: [
                ...(a.history || []),
                {
                  id: `HIST-${Date.now()}`,
                  action: 'Application Approved',
                  actorId: currentUser?.id || FIXED_SUPER_ADMIN_ID,
                  actorName: currentUser?.fullName || 'Super Admin',
                  timestamp: nowIso,
                  note: `Approved and granted Role ID ${roleUniqueId}`
                }
              ]
            }
          : a
      )
    );

    logApplicationAudit(
      'Application Approved',
      app.applicationId || app.id,
      app.fullName,
      app.appliedPosition,
      `Approved by Super Admin. Assigned Role Unique ID: ${roleUniqueId}.`
    );

    addToast({
      title: 'আবেদন অনুমোদিত হয়েছে!',
      message: `${app.fullName}-কে ${
        app.roleType === 'admin'
          ? 'জেলা অ্যাডমিন'
          : app.roleType === 'operational_officer'
          ? 'অপারেশনাল অফিসার'
          : 'প্রোডাক্ট ডেলিভারি ম্যান'
      } হিসেবে অনুমোদন দেওয়া হয়েছে (আইডি: ${roleUniqueId})।`,
      type: 'success'
    });

    return {
      success: true,
      roleId: roleUniqueId,
      message: `আবেদন সফলভাবে অনুমোদিত হয়েছে। তৈরি হওয়া রোল আইডি: ${roleUniqueId}`
    };
  };

  // =========================================================================
  // 4. QUOTAS & AGGREGATE SUMMARIES
  // =========================================================================

  const getAllDistrictQuotas = (): DistrictAdminQuota[] => {
    const list: DistrictAdminQuota[] = [];

    BD_DIVISIONS.forEach((div) => {
      div.districts.forEach((dist) => {
        const vacancy = checkDistrictAdminVacancy(dist.nameBn);
        list.push({
          districtName: dist.nameBn,
          divisionName: div.nameBn,
          hasActiveAdmin: !vacancy.isVacant,
          activeAdminId: vacancy.activeAdmin?.id,
          activeAdminName: vacancy.activeAdmin?.fullName,
          activeAdminMobile: vacancy.activeAdmin?.mobileNumber,
          activeAdminMemberId: vacancy.activeAdmin?.permanentMemberId,
          pendingApplicationsCount: vacancy.pendingCount
        });
      });
    });

    return list;
  };

  const getAllUpazilaQuotas = (filterDistrict?: string): UpazilaOfficerQuota[] => {
    const list: UpazilaOfficerQuota[] = [];

    BD_DIVISIONS.forEach((div) => {
      div.districts.forEach((dist) => {
        if (filterDistrict && dist.nameBn !== filterDistrict && dist.nameEn !== filterDistrict) {
          return;
        }
        dist.upazilas.forEach((upz) => {
          const vacancy = checkUpazilaOfficerVacancy(dist.nameBn, upz.nameBn);
          list.push({
            upazilaName: upz.nameBn,
            districtName: dist.nameBn,
            divisionName: div.nameBn,
            hasActiveOfficer: !vacancy.isVacant,
            activeOfficerId: vacancy.activeOfficer?.id,
            activeOfficerName: vacancy.activeOfficer?.fullName,
            activeOfficerMobile: vacancy.activeOfficer?.mobileNumber,
            activeOfficerMemberId: vacancy.activeOfficer?.permanentMemberId,
            pendingApplicationsCount: vacancy.pendingCount
          });
        });
      });
    });

    return list;
  };

  const getOverallStats = () => {
    const allDistricts = getAllDistrictQuotas();
    const occupiedDistricts = allDistricts.filter((d) => d.hasActiveAdmin).length;
    const vacantDistricts = allDistricts.length - occupiedDistricts;

    const allUpazilas = getAllUpazilaQuotas();
    const occupiedUpazilas = allUpazilas.filter((u) => u.hasActiveOfficer).length;
    const vacantUpazilas = allUpazilas.length - occupiedUpazilas;

    const totalDeliveryMen = allUsers.filter(
      (u) =>
        u.accountStatus === 'active' &&
        (u.roles?.includes('delivery_rider') || u.primaryRole === 'delivery_rider')
    ).length;

    const pendingApps = storedApplications.filter((a) => {
      const st = a.status.toLowerCase();
      return st === 'pending' || st === 'under_review' || st === 'under review';
    }).length;

    return {
      totalApplications: storedApplications.length,
      pendingApplications: pendingApps,
      approvedAdminsCount: occupiedDistricts,
      totalDistricts: allDistricts.length || 64,
      districtsOccupied: occupiedDistricts,
      districtsVacant: vacantDistricts,
      totalUpazilas: allUpazilas.length || 495,
      upazilasOccupied: occupiedUpazilas,
      upazilasVacant: vacantUpazilas,
      totalDeliveryMen
    };
  };

  return (
    <RoleApplicationContext.Provider
      value={{
        applications,
        isSuperAdminAuthorized,
        auditLogs,
        checkDistrictAdminVacancy,
        checkUpazilaOfficerVacancy,
        getDeliveryMenCountForArea,
        submitRoleApplication,
        getApplicationByTracking,
        getApplicationsByMobile,
        putUnderReview,
        rejectApplication,
        approveApplication,
        deleteApplication,
        requestApplicantInfo,
        addInternalNote,
        cancelApplication,
        logApplicationAudit,
        getAllDistrictQuotas,
        getAllUpazilaQuotas,
        getOverallStats
      }}
    >
      {children}
    </RoleApplicationContext.Provider>
  );
};

export const useRoleApplications = () => {
  const context = useContext(RoleApplicationContext);
  if (!context) {
    throw new Error('useRoleApplications must be used within a RoleApplicationProvider');
  }
  return context;
};
