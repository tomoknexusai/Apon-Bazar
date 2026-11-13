/**
 * AANO BAZAR Enterprise Profile Picture Uploader
 * Features:
 * - Two clear input modes with clean tab layout: [ Upload Image/Photo ] [ Image URL ]
 * - Upload Image/Photo: camera capture on supported mobile devices + gallery/computer file selection
 * - Image URL: direct URL input with live fetch & validation
 * - Automatic square center-cropping via HTML5 Canvas
 * - Real-time client-side image compression (~40-70KB) for lightning-fast loading
 * - Clear image preview with file optimization metrics before saving
 * - Prioritizes uploaded image as primary if both are provided
 * - Default profile icon fallback when no image exists
 * - Allows replacing, changing, or removing profile picture
 * - Large touch targets (>=48px) and fully responsive for Android mobile, tablet, and desktop
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  Check,
  X,
  User,
  Trash2,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders
} from 'lucide-react';

interface ProfilePictureUploaderProps {
  currentPhotoUrl?: string;
  onPhotoSaved?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
  className?: string;
}

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  currentPhotoUrl,
  onPhotoSaved,
  size = 'lg',
  showUploadButton = true,
  className = ''
}) => {
  const { currentUser, updateProfile } = useAuth();
  const { updateMemberProfile } = useNetworkMarketing();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Effective saved photo from props or auth context
  const savedPhoto = currentPhotoUrl || currentUser?.profilePhotoUrl || '';

  // Tab State: 'upload' | 'url'
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');

  // Input & Preview States
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [compressedFileSize, setCompressedFileSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Size mapping
  const sizeMap = {
    sm: {
      container: 'w-20 h-20 sm:w-24 sm:h-24',
      icon: 'w-8 h-8',
      badge: 'w-7 h-7 -bottom-1 -right-1',
      badgeIcon: 'w-3.5 h-3.5'
    },
    md: {
      container: 'w-24 h-24 sm:w-28 sm:h-28',
      icon: 'w-11 h-11',
      badge: 'w-8 h-8 -bottom-1 -right-1',
      badgeIcon: 'w-4 h-4'
    },
    lg: {
      container: 'w-28 h-28 sm:w-36 sm:h-36',
      icon: 'w-14 h-14 sm:w-16 sm:h-16',
      badge: 'w-10 h-10 -bottom-1 -right-1',
      badgeIcon: 'w-5 h-5'
    }
  };

  const currentSizeConfig = sizeMap[size];

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Automatically crops the image to a centered square and compresses it to JPEG
   */
  const processAndCompressImage = (dataUrl: string, origBytes: number, isDirectUpload: boolean = true) => {
    setIsProcessing(true);
    setOriginalFileSize(origBytes);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        const targetDimension = Math.min(512, Math.max(256, minDim));

        const canvas = document.createElement('canvas');
        canvas.width = targetDimension;
        canvas.height = targetDimension;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Canvas context unavailable');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetDimension, targetDimension);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        const base64Content = compressed.split(',')[1] || '';
        const approxBytes = Math.round((base64Content.length * 3) / 4);
        setCompressedFileSize(approxBytes);

        if (isDirectUpload) {
          setUploadedDataUrl(compressed);
          setPreviewImage(compressed);
        } else {
          // If uploaded image already exists, uploaded photo remains primary unless replaced
          if (!uploadedDataUrl) {
            setPreviewImage(compressed);
          }
        }

        setIsProcessing(false);
      } catch (err) {
        console.error('Image processing error:', err);
        setFeedbackMsg({
          type: 'error',
          text: isBn ? 'ছবি প্রসেস করতে ত্রুটি হয়েছে। অন্য ছবি নির্বাচন করুন।' : 'Error processing image. Please choose another.'
        });
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      setIsProcessing(false);
      setFeedbackMsg({
        type: 'error',
        text: isBn ? 'ছবি লোড করা সম্ভব হয়নি। সঠিক URL বা ফাইল দিন।' : 'Failed to load image. Please verify URL or file.'
      });
    };

    img.src = dataUrl;
  };

  // Handle file from device camera or gallery
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({
        type: 'error',
        text: isBn ? 'অনুগ্রহ করে ইমেজ ফাইল (.jpg, .png, .webp) নির্বাচন করুন।' : 'Please select an image file.'
      });
      return;
    }

    // Size limit check (10MB max initial)
    if (file.size > 10 * 1024 * 1024) {
      setFeedbackMsg({
        type: 'error',
        text: isBn ? 'ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে।' : 'File size cannot exceed 10MB.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        processAndCompressImage(dataUrl, file.size, true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle URL Load
  const handleUrlLoad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setFeedbackMsg({
        type: 'error',
        text: isBn ? 'অনুগ্রহ করে ছবির ওয়েব লিংক (URL) লিখুন।' : 'Please enter an image URL.'
      });
      return;
    }

    // If no uploaded photo, preview the URL
    processAndCompressImage(cleanUrl, 1024 * 150, false);
    if (!uploadedDataUrl) {
      setPreviewImage(cleanUrl);
    }
  };

  // Primary image decision logic:
  // "If both Upload Image/Photo and Image URL are provided, use the uploaded image as the primary image."
  const getActiveSelectedImage = (): string | null => {
    if (uploadedDataUrl) return uploadedDataUrl;
    if (previewImage) return previewImage;
    if (urlInput.trim()) return urlInput.trim();
    return null;
  };

  // Save picture to profile
  const handleSavePicture = () => {
    const finalImage = getActiveSelectedImage();
    if (!finalImage || !currentUser) {
      setFeedbackMsg({
        type: 'error',
        text: isBn ? 'অনুগ্রহ করে একটি ছবি নির্বাচন বা লিংক প্রদান করুন।' : 'Please select a photo or provide a URL.'
      });
      return;
    }

    setIsSaving(true);
    try {
      updateProfile({
        profilePhotoUrl: finalImage
      });

      if (currentUser.id) {
        updateMemberProfile(currentUser.id, {
          avatarUrl: finalImage
        });
      }

      if (onPhotoSaved) {
        onPhotoSaved(finalImage);
      }

      setFeedbackMsg({
        type: 'success',
        text: isBn ? '✅ প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!' : '✅ Profile picture updated successfully!'
      });

      // Close modal & reset temporary state
      setTimeout(() => {
        setIsModalOpen(false);
        setPreviewImage(null);
        setUploadedDataUrl(null);
        setUrlInput('');
        setImageError(false);
        setFeedbackMsg(null);
      }, 1000);
    } catch (err) {
      console.error('Failed to save profile picture:', err);
      setFeedbackMsg({
        type: 'error',
        text: isBn ? 'ছবি সংরক্ষণ করতে ব্যর্থ হয়েছে।' : 'Failed to save profile picture.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset / Remove Photo
  const handleRemovePhoto = () => {
    if (!currentUser) return;
    if (window.confirm(isBn ? 'আপনি কি প্রোফাইল ছবি মুছে ফেলে ডিফল্ট আইকন রাখতে চান?' : 'Remove profile picture and use default icon?')) {
      updateProfile({
        profilePhotoUrl: ''
      });
      if (currentUser.id) {
        updateMemberProfile(currentUser.id, {
          avatarUrl: ''
        });
      }
      if (onPhotoSaved) {
        onPhotoSaved('');
      }
      setPreviewImage(null);
      setUploadedDataUrl(null);
      setUrlInput('');
      setImageError(true);
      setIsModalOpen(false);
      setFeedbackMsg({
        type: 'success',
        text: isBn ? 'প্রোফাইল ছবি সরানো হয়েছে।' : 'Profile picture removed.'
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleOpenModal = () => {
    setPreviewImage(null);
    setUploadedDataUrl(null);
    setUrlInput('');
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const displayUrl = (!imageError && savedPhoto) ? savedPhoto : null;
  const currentModalPreview = getActiveSelectedImage() || displayUrl;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Hidden File Inputs for Native Camera & Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="user"
        onChange={handleFileSelection}
        className="hidden"
        id="profile-camera-input"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileSelection}
        className="hidden"
        id="profile-gallery-input"
      />

      {/* Main Avatar Touch Display */}
      <div className="relative group flex items-center justify-center">
        <button
          type="button"
          onClick={handleOpenModal}
          title={isBn ? 'প্রোফাইল ছবি পরিবর্তন করুন' : 'Change Profile Picture'}
          className={`${currentSizeConfig.container} rounded-3xl sm:rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-500 shadow-xl transition-all active:scale-95 hover:shadow-emerald-500/25 flex items-center justify-center cursor-pointer relative overflow-visible`}
        >
          <div className="w-full h-full rounded-2xl sm:rounded-full bg-white dark:bg-neutral-900 overflow-hidden flex items-center justify-center relative">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={currentUser?.fullName || 'User Profile'}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover rounded-2xl sm:rounded-full transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
                <User className={currentSizeConfig.icon} />
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {isBn ? 'ডিফল্ট ছবি' : 'Default'}
                </span>
              </div>
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">
                {isBn ? 'পরিবর্তন' : 'Change'}
              </span>
            </div>
          </div>
        </button>

        {/* Quick Camera Badge (Bottom Right) */}
        <button
          type="button"
          onClick={handleOpenModal}
          title={isBn ? 'ছবি আপলোড করুন' : 'Upload Photo'}
          className={`absolute ${currentSizeConfig.badge} bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full border-2 border-white dark:border-neutral-900 shadow-lg flex items-center justify-center transition-all cursor-pointer z-10`}
        >
          <Camera className={currentSizeConfig.badgeIcon} />
        </button>
      </div>

      {/* Prominent Android Touch-Friendly Upload Button */}
      {showUploadButton && (
        <div className="mt-3 w-full max-w-xs flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full min-h-[48px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/50"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
            <span>{isBn ? 'ছবি পরিবর্তন / আপলোড' : 'Change / Upload Photo'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium text-center">
            {isBn ? 'ক্যামেরা, গ্যালারি অথবা ওয়েব লিংক ব্যবহার করুন' : 'Camera, Device Gallery, or Image URL'}
          </span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FULL RESPONSIVE IMAGE UPLOAD MODAL (ANDROID / TABLET / DESKTOP) */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 animate-slide-up max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white">
                    {isBn ? 'প্রোফাইল ছবি নির্বাচন ও আপলোড' : 'Profile Picture Management'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {isBn ? 'সঠিক মাপ অনুযায়ী অটো-ক্রপ ও কম্প্রেশন' : 'Auto square-cropping & optimized fast loading'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification / Feedback Banner */}
            {feedbackMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* TAB / BUTTON LAYOUT: [ Upload Image/Photo ] [ Image URL ] */}
            <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`min-h-[48px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isBn ? 'Upload Image / Photo' : 'Upload Image/Photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`min-h-[48px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>{isBn ? 'Image URL' : 'Image URL'}</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD IMAGE / PHOTO (CAMERA & GALLERY) */}
            {activeTab === 'upload' && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Camera Option */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="min-h-[56px] p-3.5 bg-emerald-50/60 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-neutral-900 dark:text-white block">
                        {isBn ? '📸 ক্যামেরা দিয়ে তুলুন' : '📸 Take Photo (Camera)'}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">
                        {isBn ? 'মোবাইল ক্যামেরা চালু করুন' : 'Open device camera'}
                      </span>
                    </div>
                  </button>

                  {/* Gallery / File Option */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="min-h-[56px] p-3.5 bg-sky-50/60 hover:bg-sky-100/60 dark:bg-sky-950/30 dark:hover:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-neutral-900 dark:text-white block">
                        {isBn ? '🖼️ গ্যালারি থেকে বাছাই' : '🖼️ Device Gallery'}
                      </span>
                      <span className="text-[10px] text-sky-700 dark:text-sky-400 block font-medium">
                        {isBn ? 'ফোন বা কম্পিউটার ফাইল' : 'Select from storage'}
                      </span>
                    </div>
                  </button>

                </div>

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center font-medium">
                  {isBn ? '💡 ছবি স্বয়ংক্রিয়ভাবে স্কয়ার (১:১) ক্রপ ও অপ্টিমাইজ হবে।' : '💡 Photo will be automatically cropped to a clean square.'}
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE URL */}
            {activeTab === 'url' && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                    {isBn ? 'সরাসরি ছবির ওয়েব লিংক (Direct Image URL)' : 'Direct Image URL'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-3 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono min-h-[48px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleUrlLoad()}
                      className="min-h-[48px] px-4 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white dark:bg-neutral-700 dark:hover:bg-neutral-600 font-bold rounded-2xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isBn ? 'প্রিভিউ' : 'Preview'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-400">
                  {isBn ? 'টিপস: আনস্প্ল্যাশ বা অন্য যেকোনো উন্মুক্ত ইমেজ লিংক পেস্ট করুন।' : 'Paste any valid image URL (e.g. from Unsplash or public web).'}
                </p>
              </div>
            )}

            {/* DUAL-INPUT PRIORITY NOTICE */}
            {uploadedDataUrl && urlInput.trim() && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {isBn
                    ? 'নোট: আপলোডকৃত ফটো এবং ইমেজ URL উভয়েই প্রদান করা থাকলে আপলোডকৃত ফটোটি প্রধান (Primary) হিসেবে সেভ হবে।'
                    : 'Note: Uploaded photo takes priority as primary image when both options are provided.'}
                </span>
              </div>
            )}

            {/* LIVE PREVIEW CONTAINER */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-3xl border border-neutral-200 dark:border-neutral-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{isBn ? 'লাইভ প্রিভিউ (Image Preview)' : 'Live Image Preview'}</span>
                </span>

                {uploadedDataUrl ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Uploaded Photo (Primary)
                  </span>
                ) : urlInput.trim() ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                    Web URL Photo
                  </span>
                ) : displayUrl ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                    Current Saved Photo
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                    Default Icon
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Preview Box */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 border-2 border-emerald-500 shadow-md shrink-0 flex items-center justify-center relative">
                  {currentModalPreview ? (
                    <img
                      src={currentModalPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-neutral-400" />
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Details / Optimization info */}
                <div className="flex-1 space-y-1 text-xs">
                  <div className="text-neutral-900 dark:text-white font-bold">
                    {currentUser?.fullName || 'User Account'}
                  </div>
                  {compressedFileSize ? (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ কম্প্রেশন সম্পন্ন: {formatBytes(compressedFileSize)} (ফাস্ট লোডিং)
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {isBn ? 'ছবি নির্বাচন করলে অপ্টিমাইজড সাইজ প্রদর্শিত হবে।' : 'Select an image to preview optimization metrics.'}
                    </div>
                  )}
                  {savedPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'বর্তমান ছবি মুছে ফেলুন (Reset)' : 'Remove current picture'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: [ Cancel ] [ Save Profile Picture ] */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="min-h-[48px] py-3 px-4 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-black rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>{isBn ? 'বাতিল (Cancel)' : 'Cancel'}</span>
              </button>

              <button
                type="button"
                onClick={handleSavePicture}
                disabled={isSaving || isProcessing}
                className="min-h-[48px] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-emerald-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isBn ? 'ছবি সেভ করুন (Save)' : 'Save Picture'}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
