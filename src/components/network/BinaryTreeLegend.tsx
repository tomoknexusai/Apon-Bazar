/**
 * Compact Binary Tree Status Legend Component
 * Explains all node and slot status indicators in the APON BAZAR Binary Network Tree.
 */

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  UserPlus,
  Building2,
  Crosshair
} from 'lucide-react';

interface BinaryTreeLegendProps {
  compact?: boolean;
  className?: string;
}

export const BinaryTreeLegend: React.FC<BinaryTreeLegendProps> = ({
  compact = true,
  className = ''
}) => {
  const items = [
    {
      id: 'root',
      label: 'Selected Root',
      subLabel: 'নির্বাচিত রুট',
      icon: Crosshair,
      badgeClass:
        'bg-emerald-600 text-white border-emerald-700',
      dotClass: 'bg-emerald-500 ring-2 ring-emerald-500/30'
    },
    {
      id: 'company',
      label: 'Company Account',
      subLabel: 'কোম্পানি অ্যাকাউন্ট',
      icon: Building2,
      badgeClass:
        'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      dotClass: 'bg-amber-500'
    },
    {
      id: 'active',
      label: 'Active Member',
      subLabel: 'সক্রিয় সদস্য',
      icon: CheckCircle2,
      badgeClass:
        'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
      dotClass: 'bg-emerald-500'
    },
    {
      id: 'inactive',
      label: 'Inactive Member',
      subLabel: 'নিষ্ক্রিয় সদস্য',
      icon: XCircle,
      badgeClass:
        'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800',
      dotClass: 'bg-rose-500'
    },
    {
      id: 'empty',
      label: 'Empty Slot (No ID Burn)',
      subLabel: 'ফাঁকা স্লট',
      icon: UserPlus,
      badgeClass:
        'bg-slate-50 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 border-dashed border-slate-300 dark:border-neutral-600',
      dotClass: 'bg-slate-400'
    }
  ];

  return (
    <div
      role="region"
      aria-label="Binary Tree Status Legend"
      className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl ${
        compact ? 'px-2.5 py-1.5' : 'px-4 py-2.5'
      } flex flex-wrap items-center gap-1.5 text-[10px] ${className}`}
    >
      <span className="font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[10px] mr-0.5 shrink-0">
        Legend:
      </span>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-semibold whitespace-nowrap ${item.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dotClass}`} />
            <Icon className="w-3 h-3 shrink-0" />
            <span>{item.label}</span>
            <span className="opacity-75 font-normal hidden xl:inline">
              ({item.subLabel})
            </span>
          </div>
        );
      })}
    </div>
  );
};
