/**
 * Role-Based Multi-Method Authentication Modal Component
 * Project: Apon Bazar
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Phone,
  KeyRound,
  CheckCircle2,
  X,
  Lock,
  LogIn,
  UserPlus,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

interface PhoneOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

export const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister
}) => {
  const { loginWithPhoneOtp, loginWithEmailPassword, verifyUserByMobile, resetPasswordByMobile } = useAuth();
  const { language, t } = useLanguage();

  const [loginMode, setLoginMode] = useState<'credentials' | 'phone' | 'forgot_password'>('credentials');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // Phone state
  const [mobileNumber, setMobileNumber] = useState('01312480175');
  const [otp, setOtp] = useState('1234');

  // Credentials state (Username / Member ID / Mobile Number / Email)
  const [identifier, setIdentifier] = useState('khatibesdo@gmail.com');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<'verify_mobile' | 'verify_otp' | 'reset_password'>('verify_mobile');
  const [forgotInput, setForgotInput] = useState('');
  const [confirmMobileInput, setConfirmMobileInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [forgotOtp, setForgotOtp] = useState('1234');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!mobileNumber.startsWith('+880') && mobileNumber.length < 11) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 400);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const success = await loginWithPhoneOtp(mobileNumber, otp);
      setLoading(false);
      if (success) {
        onClose();
      } else {
        setError('অবৈধ ওটিপি কোড। নমুনা ওটিপি (যেমন ১২৩৪) লিখুন');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'ওটিপি যাচাইকরণে ত্রুটি ঘটেছে।');
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!identifier.trim()) {
      setError('ইউজারনেম, মেম্বার আইডি বা মোবাইল নম্বর প্রদান করুন');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const success = await loginWithEmailPassword(identifier, password);
      setLoading(false);
      if (success) {
        onClose();
      } else {
        setError('ইউজারনেম/মেম্বার আইডি বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'লগইন প্রক্রিয়ায় ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const handleVerifyMobile = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!forgotInput.trim()) {
      setError('অনুগ্রহ করে আপনার মেম্বার আইডি বা নিবন্ধিত মোবাইল নম্বর লিখুন।');
      return;
    }
    const result = verifyUserByMobile(forgotInput, confirmMobileInput);
    if (result.exists && result.user) {
      setVerifiedUser(result.user);
      setVerificationResult(result);
      setForgotStep('verify_otp');
      setSuccessMessage(`অ্যাকাউন্ট ভেরিফাইড! মেম্বার আইডি: ${result.memberId} (${result.user.fullName})। ওটিপি ভেরিফিকেশন কোডটি কেবল নিবন্ধিত মোবাইল নম্বর (${result.maskedMobile})-এ পাঠানো হয়েছে (টেস্টিং ডেমো কোড: 1234)।`);
    } else {
      setError(result.message || 'উক্ত মেম্বার আইডি বা মোবাইল নম্বরের কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
    }
  };

  const handleVerifyForgotOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (forgotOtp === '1234' || forgotOtp.length === 4) {
      setForgotStep('reset_password');
      setSuccessMessage('ওটিপি কোড সফলভাবে যাচাই করা হয়েছে! এবার আপনার নতুন পাসওয়ার্ড নির্ধারণ করুন।');
    } else {
      setError('ভুল ওটিপি কোড! অনুগ্রহ করে ৪-ডিজিটের ডেমো কোড (যেমন: ১২৩৪) প্রদান করুন।');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword.length < 4) {
      setError('পাসওয়ার্ড সর্বনিম্ন ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড ফিল্ড দুটি একই হতে হবে।');
      return;
    }

    setLoading(true);
    const result = await resetPasswordByMobile(forgotInput, newPassword, confirmMobileInput);
    setLoading(false);

    if (result.success) {
      setIdentifier(forgotInput);
      setPassword(newPassword);
      setLoginMode('credentials');
      setSuccessMessage('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
      // Reset forgot states
      setForgotStep('verify_mobile');
      setForgotInput('');
      setConfirmMobileInput('');
      setForgotOtp('1234');
      setNewPassword('');
      setConfirmPassword('');
      setVerifiedUser(null);
      setVerificationResult(null);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
            {language === 'bn' ? 'অ্যাকাউন্টে প্রবেশ করুন' : 'Sign In to Your Account'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {language === 'bn'
              ? 'ইউজারনেম, মেম্বার আইডি, মোবাইল নম্বর বা ওটিপি দিয়ে নিরাপদে লগইন করুন'
              : 'Securely sign in with Username, Member ID, Mobile Number or OTP'}
          </p>
        </div>

        {/* Login Method Toggle - 2 Options: ID & Password, Mobile OTP */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 bg-neutral-100 dark:bg-neutral-800/80 p-1.5 rounded-2xl mb-4 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginMode('credentials');
              setError('');
            }}
            className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px] ${
              loginMode === 'credentials'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">{language === 'bn' ? 'আইডি ও পাসওয়ার্ড' : 'ID & Password'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('phone');
              setError('');
            }}
            className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px] ${
              loginMode === 'phone'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span className="truncate">{language === 'bn' ? 'মোবাইল ওটিপি' : 'Mobile OTP'}</span>
          </button>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl text-xs sm:text-sm mb-4 font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 p-3.5 rounded-2xl text-xs sm:text-sm mb-4 font-medium flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            {onSwitchToRegister && (
              <div className="text-xs text-neutral-600 dark:text-neutral-300 pt-1.5 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                <span>{language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলতে চান?' : "Don't have an account yet?"}</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToRegister();
                  }}
                  className="font-black text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer py-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'bn' ? 'রেজিস্ট্রেশন করুন' : 'Register Here'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 1: CREDENTIALS (USERNAME / CUSTOMER ID / MEMBER ID / MOBILE NUMBER / EMAIL & PASSWORD) */}
        {loginMode === 'credentials' && (
          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div className="space-y-1.5 text-xs sm:text-sm">
              <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'bn' ? 'ইউজার আইডি / কাস্টমার আইডি / মোবাইল / মেম্বার আইডি' : 'User ID / Customer ID / Mobile / Member ID'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={language === 'bn' ? 'ইউজার আইডি, কাস্টমার আইডি (CUST-...), বা মোবাইল' : 'User ID, Customer ID (CUST-...), or Mobile'}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-3.5 pl-4 pr-3 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium min-h-[48px]"
                />
              </div>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                {language === 'bn' ? 'উদাহরণ: ' : 'e.g. '}
                <span className="font-mono text-neutral-600 dark:text-neutral-300">abdur_rahman</span>, <span className="font-mono text-neutral-600 dark:text-neutral-300">CUST-100001</span>, <span className="font-mono text-neutral-600 dark:text-neutral-300">TOM-1001</span>
              </span>
            </div>

            <div className="space-y-1.5 text-xs sm:text-sm">
              <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>পাসওয়ার্ড (Password)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-3.5 pl-4 pr-12 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium min-h-[48px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer p-2 min-w-[40px] flex items-center justify-center"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('forgot_password');
                    setForgotStep('verify_mobile');
                    setForgotInput(identifier || '');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer py-1"
                >
                  {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-colors text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[50px]"
            >
              {loading ? (
                <span>যাচাই করা হচ্ছে...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>লগইন করুন (Sign In)</span>
                </>
              )}
            </button>

            {/* Quick Super Admin 1-Click Login Card */}
            <div className="mt-3 pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setIdentifier('khatibesdo@gmail.com');
                  setPassword('Admin@2026');
                  setLoading(true);
                  setError('');
                  try {
                    const success = await loginWithEmailPassword('khatibesdo@gmail.com', 'Admin@2026');
                    setLoading(false);
                    if (success) {
                      onClose();
                    } else {
                      setError('সুপার এডমিন লগইন ব্যর্থ হয়েছে।');
                    }
                  } catch (err: any) {
                    setLoading(false);
                    setError(err?.message || 'লগইন প্রক্রিয়ায় ত্রুটি ঘটেছে।');
                  }
                }}
                className="w-full p-2.5 bg-gradient-to-r from-emerald-900 via-teal-900 to-neutral-900 hover:from-emerald-800 hover:to-neutral-800 text-white rounded-xl shadow-xs border border-emerald-500/40 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-300 block">⚡ সুপার এডমিন ১-ক্লিক লগইন</span>
                    <span className="text-[10px] text-neutral-300 font-mono">khatibesdo@gmail.com (01312480175)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-neutral-950 font-black text-[10px] uppercase tracking-wider group-hover:bg-emerald-400">
                  লগইন
                </span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 4: FORGOT PASSWORD FLOW */}
        {loginMode === 'forgot_password' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('credentials');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}</span>
              </button>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                Step {forgotStep === 'verify_mobile' ? '1/3' : forgotStep === 'verify_otp' ? '2/3' : '3/3'}
              </span>
            </div>

            {/* STEP 1: Verify Mobile / Account ID */}
            {forgotStep === 'verify_mobile' && (
              <form onSubmit={handleVerifyMobile} className="space-y-3">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>মেম্বার আইডি বা ইউজারনেম</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="যেমন: GBBD-1001 অথবা 01819000003"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 pl-3.5 text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    সঠিক মেম্বার আইডি লিখলে অ্যাকাউন্টে নিবন্ধিত মোবাইল নম্বরে ওটিপি পাঠানো হবে।
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>নিবন্ধিত মোবাইল নম্বর (ঐচ্ছিক / অতিরিক্ত সুরক্ষার জন্য)</span>
                  </label>
                  <input
                    type="text"
                    value={confirmMobileInput}
                    onChange={(e) => setConfirmMobileInput(e.target.value)}
                    placeholder="যেমন: 01819000003"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 pl-3.5 text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                  />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                    * মেম্বার আইডির সাথে মোবাইল নম্বর মেলানো হলে তবেই ওটিপি ডিসপ্যাচ করা হবে।
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>ওটিপি কোড পাঠান (Send OTP to Registered Mobile)</span>
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {forgotStep === 'verify_otp' && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-3">
                <div className="bg-emerald-50/90 dark:bg-emerald-950/50 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-neutral-800 dark:text-neutral-200 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-1.5">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{verifiedUser?.fullName || 'User'}</span>
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md font-bold">
                      ID: {verificationResult?.memberId || verifiedUser?.permanentMemberId || 'GBBD User'}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-600 dark:text-neutral-300 space-y-0.5">
                    <span className="block font-medium">
                      ওটিপি পাঠানোর গন্তব্য: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{verificationResult?.maskedMobile || 'Registered Mobile'}</strong>
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      নিরাপত্তা বিধানের জন্য কোডটি কেবলমাত্র এই মেম্বার আইডির নিবন্ধিত মোবাইল নম্বরেই ডিসপ্যাচ করা হয়েছে।
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>৪-ডিজিটের ওটিপি কোড (OTP Code)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-center font-mono font-black text-lg tracking-widest text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">
                    * ডেমো টেস্টিং কোড: <strong className="font-mono">1234</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>কোড যাচাই করুন (Verify OTP)</span>
                </button>
              </form>
            )}

            {/* STEP 3: Reset Password */}
            {forgotStep === 'reset_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>নতুন পাসওয়ার্ড (New Password)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড তৈরি করুন (সর্বনিম্ন ৪ অক্ষর)"
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 pl-3.5 pr-10 text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 pl-3.5 pr-10 text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>পাসওয়ার্ড আপডেট করুন (Update Password)</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: PHONE OTP */}
        {loginMode === 'phone' && (
          step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {t('mobileNumber')}
                </label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+8801819000003"
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-mono text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow transition-colors text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>ওটিপি পাঠানো হচ্ছে...</span>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>{t('sendOtp')}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {t('enterOtp')}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl py-2.5 pl-10 pr-3 font-mono font-bold text-center tracking-widest text-base text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-neutral-400 block text-center mt-1">
                  নমুনা ওটিপি: <strong className="text-emerald-600">1234</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow transition-colors text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>যাচাই করা হচ্ছে...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('verifyOtp')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-neutral-500 hover:underline block"
              >
                মোবাইল নম্বর পরিবর্তন করুন
              </button>
            </form>
          )
        )}

        {/* Bottom Switcher to Register Modal */}
        {onSwitchToRegister && (
          <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
            <span>নতুন অ্যাকাউন্ট তৈরি করতে চান?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
              className="font-black text-emerald-600 hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>রেজিস্টার করুন (Register)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
