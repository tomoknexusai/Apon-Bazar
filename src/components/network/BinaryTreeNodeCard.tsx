import React from 'react';
import { NetworkMember } from '../../types/networkMarketing';
import { getNodeDisplayData } from '../../lib/binaryNetworkEngine';
import { User, ArrowRightLeft, UserPlus, Calendar, Award, CheckCircle2, XCircle } from 'lucide-react';

interface BinaryTreeNodeCardProps {
  member: NetworkMember;
  allMembers: NetworkMember[];
  allUsers?: any[];
  onFocus?: (id: string) => void;
  onDetails?: (member: NetworkMember) => void;
  onReassign?: (member: NetworkMember) => void;
  isSuperAdmin?: boolean;
  isRoot?: boolean;
  legLabel?: string;
  isCompact?: boolean;
}

export const BinaryTreeNodeCard: React.FC<BinaryTreeNodeCardProps> = ({
  member,
  allMembers,
  allUsers,
  onFocus,
  onDetails,
  onReassign,
  isSuperAdmin,
  isRoot,
  legLabel,
  isCompact = false
}) => {
  const display = getNodeDisplayData(member, allMembers, allUsers);
  const isActive = display.status === 'ACTIVE';

  if (isCompact) {
    return (
      <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs hover:shadow-md transition-all text-left space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-neutral-500 uppercase truncate max-w-[80px]">
            {legLabel || 'Sub-node'}
          </span>
          <span
            className={`px-1.5 py-0.2 text-[8px] font-bold rounded-full ${
              isActive ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            }`}
          >
            {display.status}
          </span>
        </div>

        <div onClick={() => onFocus && onFocus(member.id)} className="cursor-pointer group">
          <p className="font-bold text-xs text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
            {display.name}
          </p>
          <p className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 truncate">
            {display.customerId}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-1 text-[9px] font-mono border-t border-neutral-100 dark:border-neutral-700/60 text-center">
          <div>
            <span className="text-[8px] text-neutral-400 block">PPV</span>
            <span className="font-bold text-emerald-600">{display.personalPV}</span>
          </div>
          <div>
            <span className="text-[8px] text-neutral-400 block">LPV</span>
            <span className="font-bold text-blue-600">{display.leftPV.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[8px] text-neutral-400 block">RPV</span>
            <span className="font-bold text-purple-600">{display.rightPV.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-68 sm:w-72 p-4 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md hover:shadow-lg transition-all text-left space-y-2.5 relative">
      {/* Top Header: Leg/Role Badge & Status */}
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
            isRoot
              ? 'bg-emerald-600 text-white'
              : legLabel?.includes('LEFT')
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
          }`}
        >
          {legLabel || (isRoot ? 'ROOT NODE' : 'MEMBER')}
        </span>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1 ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
          }`}
        >
          {isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
          <span>{display.status}</span>
        </span>
      </div>

      {/* 1. Name & 2. Customer ID */}
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-black text-sm text-neutral-900 dark:text-white truncate leading-tight">
            {display.name}
          </h4>
          <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            Customer ID: {display.customerId}
          </p>
        </div>
      </div>

      {/* 3. Joining Date & 5. ID Grade */}
      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800">
        <div>
          <span className="text-[10px] text-neutral-400 block flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Joining</span>
          </span>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {display.joiningDate}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 block flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            <span>ID Grade</span>
          </span>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {display.idGrade}
          </span>
        </div>
      </div>

      {/* 6. Personal PV, 7. Left PV, 8. Right PV */}
      <div className="grid grid-cols-3 gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl text-center text-[10px] font-mono border border-neutral-200/70 dark:border-neutral-700/60">
        <div>
          <span className="text-neutral-400 block text-[9px]">Personal PV</span>
          <span className="font-black text-emerald-600 dark:text-emerald-400">
            {display.personalPV.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-neutral-400 block text-[9px]">Left PV</span>
          <span className="font-black text-blue-600 dark:text-blue-400">
            {display.leftPV.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-neutral-400 block text-[9px]">Right PV</span>
          <span className="font-black text-purple-600 dark:text-purple-400">
            {display.rightPV.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Node Action Buttons */}
      <div className="flex items-center justify-between gap-1.5 pt-1">
        {onFocus && (
          <button
            type="button"
            onClick={() => onFocus(member.id)}
            className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
          >
            ট্রি ফোকাস
          </button>
        )}
        {onDetails && (
          <button
            type="button"
            onClick={() => onDetails(member)}
            className="flex-1 py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
          >
            বিস্তারিত
          </button>
        )}
        {isSuperAdmin && onReassign && !isRoot && (
          <button
            type="button"
            onClick={() => onReassign(member)}
            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            title="প্লেসমেন্ট পরিবর্তন (Super Admin)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

interface EmptySlotCardProps {
  parentMember: NetworkMember;
  leg: 'left' | 'right';
  onRegister: (sponsorId: string, placementId: string, leg: 'left' | 'right') => void;
}

export const EmptySlotCard: React.FC<EmptySlotCardProps> = ({
  parentMember,
  leg,
  onRegister
}) => {
  const isLeft = leg === 'left';
  const effectiveId = parentMember.customerId || parentMember.permanentMemberId || parentMember.id;

  return (
    <div
      className={`w-68 sm:w-72 p-4 border-2 border-dashed rounded-2xl text-center space-y-2.5 transition-all ${
        isLeft
          ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20'
          : 'border-teal-400 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isLeft
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
          }`}
        >
          {isLeft ? 'LEFT LEG (বাম শাখা)' : 'RIGHT LEG (ডান শাখা)'}
        </span>
        <span className="text-[10px] font-bold text-neutral-400">খালি স্লট</span>
      </div>

      <div className="py-1">
        <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
          {isLeft ? 'খালি বাম স্লট (Empty Left Slot)' : 'খালি ডান স্লট (Empty Right Slot)'}
        </p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
          প্যারেন্ট: <span className="font-mono font-bold text-emerald-600">{effectiveId}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onRegister(effectiveId, effectiveId, leg)}
          className="px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs transition-transform hover:scale-102 cursor-pointer"
        >
          <UserPlus className="w-3 h-3" />
          <span>নিবন্ধন</span>
        </button>
        <button
          type="button"
          onClick={() => onRegister(effectiveId, effectiveId, leg)}
          className="px-2 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-transform hover:scale-102 cursor-pointer border border-neutral-300 dark:border-neutral-700"
        >
          <span>স্লট রিজার্ভ</span>
        </button>
      </div>
    </div>
  );
};
