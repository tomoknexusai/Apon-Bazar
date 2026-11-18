/**
 * Bangladesh Administrative Location & Service Address Selector Wrapper Component
 * Integrates official 10-level cascading address hierarchy
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState, useEffect } from 'react';
import { BDAddressPicker, BDAddressFields } from './BDAddressPicker';
import { ServiceAddress } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  initialAddress?: Partial<ServiceAddress>;
  onSaveAddress: (
    address: Partial<ServiceAddress>
  ) => Promise<{ success?: boolean; message?: string } | void> | void;
  onAddressChange?: (address: Partial<ServiceAddress>, isValid: boolean) => void;
  title?: string;
  userType?: 'customer' | 'vendor' | 'operations_partner' | 'delivery_rider' | 'admin';
}

const buildAddressFields = (
  initialAddress: Partial<ServiceAddress> | undefined,
  userType: 'customer' | 'vendor' | 'operations_partner' | 'delivery_rider' | 'admin'
): BDAddressFields => ({
  division: initialAddress?.division || 'ঢাকা',
  district: initialAddress?.district || 'ঢাকা',
  upazila: initialAddress?.upazila || 'ধানমন্ডি',
  unionName: initialAddress?.unionName || 'ধানমন্ডি আ/এ',
  ward: initialAddress?.ward || 'ওয়ার্ড ০১',
  userType: userType || initialAddress?.userType || 'customer',
  houseNo: initialAddress?.houseNo || '',
  area: initialAddress?.area || 'সোবহানবাগ রোড',
  roadNo: initialAddress?.roadNo || '',
  landmark: initialAddress?.landmark || '',
  shopName: initialAddress?.shopName || '',
  shopNo: initialAddress?.shopNo || '',
  marketName: initialAddress?.marketName || initialAddress?.marketBazar || '',
  marketBazar: initialAddress?.marketBazar || initialAddress?.marketName || 'রাপা প্লাজা',
  businessOfficeName: initialAddress?.businessOfficeName || '',
  shopOfficeName: initialAddress?.shopOfficeName || '',
  motorcycleModel: initialAddress?.motorcycleModel || '',
  vehicleRegNumber: initialAddress?.vehicleRegNumber || '',
  drivingLicenseNumber: initialAddress?.drivingLicenseNumber || '',
  postOffice: initialAddress?.postOffice || '',
  postalCode: initialAddress?.postalCode || '1209',
  fullServiceAddress:
    initialAddress?.fullServiceAddress ||
    'সোবহানবাগ রোড, ওয়ার্ড ০১, ধানমন্ডি আ/এ, ধানমন্ডি, ঢাকা, ঢাকা বিভাগ (১২০৯)',
  latitude: initialAddress?.latitude || 23.7461,
  longitude: initialAddress?.longitude || 90.3742
});

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialAddress,
  onSaveAddress,
  onAddressChange,
  title,
  userType = 'customer'
}) => {
  const { language, t } = useLanguage();
  const [addressData, setAddressData] = useState<BDAddressFields>(() =>
    buildAddressFields(initialAddress, userType)
  );
  const [pickerSyncKey, setPickerSyncKey] = useState(0);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  // Re-hydrate cascading address picker whenever DB-backed initialAddress changes
  useEffect(() => {
    if (!initialAddress) return;
    const next = buildAddressFields(initialAddress, userType);
    setAddressData(next);
    setPickerSyncKey((prev) => prev + 1);
  }, [
    initialAddress?.division,
    initialAddress?.district,
    initialAddress?.upazila,
    initialAddress?.unionName,
    initialAddress?.ward,
    initialAddress?.houseNo,
    initialAddress?.area,
    initialAddress?.roadNo,
    initialAddress?.landmark,
    initialAddress?.postOffice,
    initialAddress?.postalCode,
    initialAddress?.fullServiceAddress,
    initialAddress?.latitude,
    initialAddress?.longitude,
    userType
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setSaveError('');
    setSavedSuccess(false);

    try {
      const result = await onSaveAddress({
        ...addressData,
        userType: userType || addressData.userType,
        isMandatoryServiceAddress: true
      });

      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        setSaveError(
          result.message ||
            (language === 'bn' ? 'ঠিকানা সংরক্ষণ করতে ব্যর্থ হয়েছে।' : 'Failed to save service address.')
        );
        return;
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('LocationPicker save failed:', err);
      setSaveError(
        language === 'bn' ? 'ঠিকানা সংরক্ষণ করতে ব্যর্থ হয়েছে।' : 'Failed to save service address.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <BDAddressPicker
        key={pickerSyncKey}
        initialAddress={addressData}
        userType={userType}
        onChange={(data, valid) => {
          setAddressData(data);
          setIsValid(valid);
          onAddressChange?.(
            {
              ...data,
              userType: userType || data.userType,
              isMandatoryServiceAddress: true
            },
            valid
          );
        }}
        lang={language}
        title={title}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
        {saveError ? (
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{saveError}</span>
          </div>
        ) : savedSuccess ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {language === 'bn'
                ? 'সার্ভিস ঠিকানা সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!'
                : 'Service address saved to database!'}
            </span>
          </div>
        ) : (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            *{' '}
            {language === 'bn'
              ? 'বাংলাদেশ সরকারের প্রশাসনিক কাঠামো অনুযায়ী সঠিক তথ্য সংরক্ষিত হবে'
              : 'Address saved per BD Administrative Hierarchy'}
          </span>
        )}

        <button
          type="submit"
          disabled={!isValid || isSaving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : t('save')}</span>
        </button>
      </div>
    </form>
  );
};
