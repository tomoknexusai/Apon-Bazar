/**
 * Rank System & Achievement Certificate Generator Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { RankRequirement } from '../../types/networkMarketing';
import { Award, ShieldCheck, CheckCircle2, Crown, Sparkles, Printer, Download, Globe, Navigation, Briefcase, Zap, X } from 'lucide-react';

export const RankRewardsViewer: React.FC = () => {
  const { ranks, currentMember } = useNetworkMarketing();
  const [selectedCertRank, setSelectedCertRank] = useState<RankRequirement | null>(null);

  const currentRankObj = ranks.find((r) => r.rank === currentMember.rank) || ranks[0];

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-emerald-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-700/40">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-300" />
            <h3 className="font-black text-xl">র‍্যাঙ্ক ও মেম্বারশিপ ইনসেন্টিভ রিওয়ার্ডস</h3>
          </div>
          <p className="text-xs text-amber-100/80 mt-1">
            কাস্টমার থেকে শুরু করে ফাউন্ডার ক্লাব পর্যন্ত ১০টি বিশেষ র‍্যাঙ্ক, ক্যাশ বোনাস, ট্যুর, বাইক, কার ও হাউজ ফান্ড
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs shrink-0">
          <span className="text-amber-200 block text-[10px]">আপনার বর্তমান অর্জন:</span>
          <span className="font-black text-amber-300 text-sm">{currentRankObj.titleBn}</span>
        </div>
      </div>

      {/* Ranks 10-Level List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ranks.map((r) => {
          const isAchieved = r.level <= currentRankObj.level;
          const isCurrent = r.rank === currentRankObj.rank;

          return (
            <div
              key={r.rank}
              className={`p-5 rounded-3xl border transition-all space-y-3 relative ${
                isCurrent
                  ? 'border-2 border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 shadow-lg'
                  : isAchieved
                  ? 'border-emerald-500/40 bg-white dark:bg-neutral-900 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-sm shadow-xs ${
                    isAchieved
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}>
                    L{r.level}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-neutral-900 dark:text-white">
                        {r.titleBn}
                      </h4>
                      {isAchieved && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500 block">{r.titleEn}</span>
                  </div>
                </div>

                {r.certificateAvailable && isAchieved && (
                  <button
                    type="button"
                    onClick={() => setSelectedCertRank(r)}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-[10px] rounded-xl flex items-center gap-1 border border-amber-400/40"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>সার্টিফিকেট দেখুন</span>
                  </button>
                )}
              </div>

              {/* Requirements & Reward */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                <div className="bg-neutral-100 dark:bg-neutral-800/60 p-2 rounded-xl">
                  <span className="text-neutral-400 block text-[9px]">প্রয়োজনীয় শর্তসমূহ:</span>
                  <span className="font-bold block">{formatPV(r.requiredPV)} PV • {formatPV(r.requiredTeamPV)} Team PV</span>
                </div>
                <div className="bg-amber-100/60 dark:bg-amber-950/60 p-2 rounded-xl text-amber-900 dark:text-amber-200">
                  <span className="text-amber-600 dark:text-amber-400 block text-[9px]">র‍্যাঙ্ক প্রমোশন রিওয়ার্ড:</span>
                  <span className="font-bold block">{r.rewardTitleBn}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Certificate Modal */}
      {selectedCertRank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-neutral-900 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl relative border-8 border-amber-500/40 font-serif">
            
            <button
              type="button"
              onClick={() => setSelectedCertRank(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-black font-sans"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Certificate Header */}
            <div className="text-center space-y-2 border-b-2 border-amber-500/30 pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 font-black flex items-center justify-center mx-auto shadow-lg">
                <Crown className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-wider text-amber-900">
                CERTIFICATE OF ACHIEVEMENT
              </h2>
              <p className="text-xs uppercase tracking-widest text-neutral-500 font-sans">
                TOMSHOPBD Network Marketing Enterprise
              </p>
            </div>

            {/* Certificate Body */}
            <div className="text-center space-y-4 py-4">
              <p className="text-xs italic text-neutral-600 font-sans">
                This prestigious certificate is proudly presented to:
              </p>
              
              <h3 className="text-2xl font-black text-neutral-900 font-sans tracking-wide">
                {currentMember.fullName}
              </h3>

              <p className="text-xs text-neutral-700 max-w-md mx-auto leading-relaxed font-sans">
                In recognition of exceptional dedication, leadership, and outstanding performance in reaching the prestigious rank of:
              </p>

              <div className="py-2 px-6 bg-amber-50 border border-amber-300 rounded-2xl inline-block">
                <span className="text-lg font-black text-amber-900 font-sans">
                  {selectedCertRank.titleEn} ({selectedCertRank.titleBn})
                </span>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-300 text-xs font-sans">
              <div className="text-center space-y-1">
                <div className="h-10 border-b border-neutral-400 w-36 mx-auto flex items-end justify-center italic text-neutral-500">
                  Rofiqul Islam
                </div>
                <span className="font-bold block text-neutral-800">Founder & Managing Director</span>
                <span className="text-[10px] text-neutral-400 block">TOMSHOPBD</span>
              </div>

              <div className="text-center space-y-1">
                <div className="h-10 border-b border-neutral-400 w-36 mx-auto flex items-end justify-center italic text-neutral-500 font-mono">
                  {new Date().toISOString().substring(0, 10)}
                </div>
                <span className="font-bold block text-neutral-800">Issue Date & Seal</span>
                <span className="text-[10px] text-neutral-400 block">Verification ID: GBD-CERT-8849</span>
              </div>
            </div>

            {/* Print & Download Action Controls */}
            <div className="flex justify-end gap-2 pt-4 font-sans text-xs">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন (Print Certificate)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
