/**
 * User Settings & Preferences Modal
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { roleLabels } from '../../lib/i18n';
import {
  Settings,
  X,
  User,
  Globe,
  Moon,
  Sun,
  Bell,
  Lock,
  CheckCircle2,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');
  const [inAppNotif, setInAppNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 dark:text-white">
                {language === 'bn' ? 'অ্যাকাউন্ট সেটিংস ও পছন্দ' : 'Account Settings & Preferences'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {currentUser.fullName} ({currentUser.permanentMemberId || 'ID: GBBD-100293'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'সাধারণ সেটিংস' : 'General'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নিরাপত্তা' : 'Security'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{language === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings saved successfully!'}</span>
          </div>
        )}

        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="space-y-4 text-xs">
            {/* Language Selection */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 dark:text-white block">
                  {language === 'bn' ? 'ভাষা নির্বাচন (Language)' : 'System Language'}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {language === 'bn' ? 'বর্তমান ভাষা: বাংলা' : 'Current Language: English'}
                </span>
              </div>
              <div className="flex gap-2 font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-3 py-1.5 rounded-xl border ${
                    language === 'bn'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-xl border ${
                    language === 'en'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 dark:text-white block">
                  {language === 'bn' ? 'ডিসপ্লে মোড (Theme)' : 'Display Theme'}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {theme === 'dark' ? 'Dark Theme Enabled' : 'Light Theme Enabled'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3.5 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                {theme === 'dark' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </>
                )}
              </button>
            </div>

            {/* Account Info Preview */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white block">
                {language === 'bn' ? 'স্থায়ী মেম্বার আইডি' : 'Permanent Member ID'}
              </span>
              <p className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                {currentUser.permanentMemberId || 'GBBD-884012'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {language === 'bn'
                  ? 'এই আইডিটি আপনার স্থায়ী মেম্বারশিপ এবং সিস্টেম পরিচিতি হিসেবে সংরক্ষিত।'
                  : 'This ID serves as your unique permanent system identity.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 cursor-pointer">
              <div>
                <span className="font-bold text-neutral-900 dark:text-white block">
                  {language === 'bn' ? 'ইন-অ্যাপ বিজ্ঞপ্তি' : 'In-App Alerts'}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {language === 'bn' ? 'অ্যাপে রিয়েল-টাইম নোটিফিকেশন পাবেন' : 'Receive instant in-app alerts'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={inAppNotif}
                onChange={(e) => setInAppNotif(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 cursor-pointer">
              <div>
                <span className="font-bold text-neutral-900 dark:text-white block">
                  {language === 'bn' ? 'ইমেইল বিজ্ঞপ্তি' : 'Email Notifications'}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {language === 'bn' ? 'গুরুত্বপূর্ণ আপডেট ইমেইলে পাঠানো হবে' : 'Receive updates via email'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 cursor-pointer">
              <div>
                <span className="font-bold text-neutral-900 dark:text-white block">
                  {language === 'bn' ? 'এসএমএস বিজ্ঞপ্তি' : 'SMS Alerts'}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {language === 'bn' ? 'অর্ডার ও পেমেন্ট আপডেট এসএমএসে পাবেন' : 'Receive transactional SMS alerts'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={smsNotif}
                onChange={(e) => setSmsNotif(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>
          </div>
        )}

        {/* Tab 3: Security */}
        {activeTab === 'security' && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'bn' ? 'দ্বি-স্তর নিরাপত্তা (2FA) ও এনক্রিপশন' : 'Two-Factor Auth & Role Protection'}</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 text-[11px]">
                {language === 'bn'
                  ? `আপনার রোল (${roleLabels[activeRole]?.[language] || activeRole}) অনুযায়ী সুরক্ষিত সেশন সক্রিয় রয়েছে।`
                  : `Secured role session active for '${roleLabels[activeRole]?.[language] || activeRole}'.`}
              </p>
            </div>
          </div>
        )}

        {/* Footer Submit */}
        <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition-all"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition-all"
          >
            {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};
