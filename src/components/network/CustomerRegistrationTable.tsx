/**
 * Customer Registration & Slot Reserved Table Component
 * Displays registered customers and binary tree slot reservations
 * Columns: Customer Name | User ID | Password | Mobile | Email | Refer ID | Position | Placement ID | Address
 * Project: AponBitan / TOMSHOPBD
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile } from '../../types';
import {
  Users,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  UserPlus,
  ShieldCheck,
  GitBranch,
  Clock,
  MapPin,
  Phone,
  Mail,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';

interface CustomerRegistrationTableProps {
  onOpenRegisterModal?: () => void;
  filterSource?: 'all' | 'Dashboard' | 'Binary Tree';
}

export const CustomerRegistrationTable: React.FC<CustomerRegistrationTableProps> = ({
  onOpenRegisterModal,
  filterSource = 'all'
}) => {
  const { allUsers, currentUser } = useAuth();
  const { members, reservedPlacements } = useNetworkMarketing();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Toggle password visibility per row
  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Copy text to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Combine user records with network member details and format rows
  const customerRecords = useMemo(() => {
    // Map members by id and customerId for quick lookup
    const memberMap = new Map<string, typeof members[0]>();
    members.forEach((m) => {
      if (m.userId) memberMap.set(m.userId, m);
      if (m.id) memberMap.set(m.id, m);
      if (m.customerId) memberMap.set(m.customerId, m);
    });

    return allUsers
      .filter((u) => {
        // Exclude system super admin or show all customer/member accounts
        if (filterSource === 'Dashboard') {
          return u.registrationSource !== 'Binary Tree';
        }
        if (filterSource === 'Binary Tree') {
          return u.registrationSource === 'Binary Tree';
        }
        return true;
      })
      .map((u) => {
        const memberInfo = memberMap.get(u.id) || memberMap.get(u.customerId || '') || memberMap.get(u.username || '');
        const position = memberInfo?.position || memberInfo?.placementLeg || u.placementLeg || (memberInfo?.id === 'GBD000001' ? 'Root' : 'left');
        const placementId = memberInfo?.parentId || u.placementId || (position === 'Root' ? '-' : 'GBD000001');
        const referId = memberInfo?.sponsorId || u.sponsorId || u.referralId || 'GBD000001';
        
        // Format address
        const address =
          u.mandatoryAddress?.fullServiceAddress ||
          u.mandatoryAddress?.area ||
          (u.mandatoryAddress?.district ? `${u.mandatoryAddress.district}, ${u.mandatoryAddress.division}` : '') ||
          memberInfo?.address ||
          'Dhaka, Bangladesh';

        return {
          id: u.id,
          customerName: u.fullName || u.name || 'Anonymous Customer',
          customerId: u.customerId || memberInfo?.customerId || memberInfo?.id || 'CUST-100001',
          userId: u.username || u.email?.split('@')[0] || u.id,
          password: u.password || '••••••••',
          mobile: u.mobileNumber || memberInfo?.mobile || 'N/A',
          email: u.email || memberInfo?.email || 'N/A',
          referId,
          position: position === 'left' ? 'Left' : position === 'right' ? 'Right' : position,
          placementId,
          address,
          registrationSource: u.registrationSource || memberInfo?.registrationSource || 'Dashboard',
          isNetworkActive: u.isNetworkActive ?? memberInfo?.active ?? true,
          isReserved: false
        };
      });
  }, [allUsers, members, filterSource]);

  // Filtered rows based on search
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customerRecords;

    return customerRecords.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.referId.toLowerCase().includes(q) ||
        c.placementId.toLowerCase().includes(q)
    );
  }, [customerRecords, searchQuery]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      
      {/* Section Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800/80">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-neutral-900 dark:text-white tracking-tight">
                Customer Registration & Slot Reserved
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isBn
                  ? 'ড্যাশবোর্ড ও বাইনারি ট্রি থেকে নিবন্ধিত সকল গ্রাহক ও সংরক্ষিত স্লটের ডাটাবেজ'
                  : 'Unified Customer Database & Binary Tree Slot Reservation Matrix'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (onOpenRegisterModal) {
                onOpenRegisterModal();
              } else {
                setIsRegisterOpen(true);
              }
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isBn ? 'নতুন কাস্টমার নিবন্ধন' : 'Register Customer'}</span>
          </button>
        </div>
      </div>

      {/* Reserved Slots Banner (if any pending) */}
      {reservedPlacements.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">
              {reservedPlacements.length} টি সক্রিয় স্লট বর্তমানে রিজার্ভেশন অবস্থায় রয়েছে (Pending Activation)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {reservedPlacements.map((slot) => (
              <span
                key={slot.id}
                className="px-2.5 py-1 bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 font-mono text-[11px] font-bold rounded-lg border border-amber-400/60"
              >
                {slot.parentMemberId} ({slot.leg === 'left' ? 'Left' : 'Right'}): {slot.customerName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'নাম, User ID, মোবাইল বা রেফার আইডি দিয়ে খুঁজুন...' : 'Search by Name, User ID, Mobile, or Refer ID...'}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium self-end sm:self-auto">
          <span>মোট রেকর্ড:</span>
          <span className="font-mono font-bold text-neutral-900 dark:text-white px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            {filteredCustomers.length}
          </span>
        </div>
      </div>

      {/* Registration Table */}
      <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-black uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3.5">Customer Name</th>
              <th className="py-3 px-3.5">User ID</th>
              <th className="py-3 px-3.5">Password</th>
              <th className="py-3 px-3.5">Mobile</th>
              <th className="py-3 px-3.5">Email</th>
              <th className="py-3 px-3.5">Refer ID</th>
              <th className="py-3 px-3.5 text-center">Position</th>
              <th className="py-3 px-3.5">Placement ID</th>
              <th className="py-3 px-3.5 min-w-[180px]">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-neutral-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p className="font-semibold text-xs">{isBn ? 'কোনো গ্রাহকের রেকর্ড পাওয়া যায়নি' : 'No customer records found'}</p>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((row) => {
                const isPasswordVisible = !!revealedPasswords[row.id];
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    {/* 1. Customer Name */}
                    <td className="py-3 px-3.5 font-bold text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {row.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white text-xs">{row.customerName}</p>
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                            {row.customerId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. User ID */}
                    <td className="py-3 px-3.5 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 text-[11px]">
                        {row.userId}
                      </span>
                    </td>

                    {/* 3. Password */}
                    <td className="py-3 px-3.5 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-700 dark:text-neutral-300 font-bold select-all">
                          {isPasswordVisible ? row.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(row.id)}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-0.5"
                          title={isPasswordVisible ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* 4. Mobile */}
                    <td className="py-3 px-3.5 font-mono text-neutral-800 dark:text-neutral-200">
                      {row.mobile}
                    </td>

                    {/* 5. Email */}
                    <td className="py-3 px-3.5 text-neutral-600 dark:text-neutral-400 text-[11px] truncate max-w-[150px]">
                      {row.email}
                    </td>

                    {/* 6. Refer ID */}
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {row.referId}
                    </td>

                    {/* 7. Position */}
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          row.position === 'Root'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : row.position.toLowerCase() === 'left'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                        }`}
                      >
                        {row.position}
                      </span>
                    </td>

                    {/* 8. Placement ID */}
                    <td className="py-3 px-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {row.placementId}
                    </td>

                    {/* 9. Address */}
                    <td className="py-3 px-3.5 text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                      {row.address}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Embedded Customer Registration Modal - EXACT SAME SHARED FORM */}
      {isRegisterOpen && (
        <CustomerRegistrationModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSwitchToLogin={() => setIsRegisterOpen(false)}
          source="dashboard"
          title="Customer Registration"
          initialReferralId={currentUser?.customerId || 'GBD000001'}
        />
      )}
    </div>
  );
};
