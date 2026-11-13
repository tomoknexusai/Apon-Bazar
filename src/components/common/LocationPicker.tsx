/**
 * Bangladesh Administrative Location & Service Address Selector Wrapper Component
 * Integrates official 10-level cascading address hierarchy
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { BDAddressPicker, BDAddressFields } from './BDAddressPicker';
import { ServiceAddress } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, CheckCircle2 } from 'lucide-react';

interface LocationPickerProps {
  initialAddress?: Partial<ServiceAddress>;
  onSaveAddress: (address: Partial<ServiceAddress>) => void;
  title?: string;
  userType?: 'customer' | 'vendor' | 'operations_partner' | 'delivery_rider' | 'admin';
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ initialAddress, onSaveAddress, title, userType = 'customer' }) => {
  const { language, t } = useLanguage();
  const [addressData, setAddressData] = useState<BDAddressFields>({
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
    postalCode: initialAddress?.postalCode || '1209',
    fullServiceAddress: initialAddress?.fullServiceAddress || 'সোবহানবাগ রোড, ওয়ার্ড ০১, ধানমন্ডি আ/এ, ধানমন্ডি, ঢাকা, ঢাকা বিভাগ (১২০৯)',
    latitude: initialAddress?.latitude || 23.7461,
    longitude: initialAddress?.longitude || 90.3742
  });
  const [isValid, setIsValid] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSaveAddress({
      ...addressData,
      userType: userType || addressData.userType,
      isMandatoryServiceAddress: true
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <BDAddressPicker
        initialAddress={addressData}
        userType={userType}
        onChange={(data, valid) => {
          setAddressData(data);
          setIsValid(valid);
        }}
        lang={language}
        title={title}
      />

      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
        {savedSuccess ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
            <CheckCircle2 className="w-5 h-5" />
            <span>{language === 'bn' ? 'সার্ভিস ঠিকানা সফলভাবে হালনাগাদ ও সংরক্ষিত হয়েছে!' : 'Service address updated successfully!'}</span>
          </div>
        ) : (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            * {language === 'bn' ? 'বাংলাদেশ সরকারের প্রশাসনিক কাঠামো অনুযায়ী সঠিক তথ্য সংরক্ষিত হবে' : 'Address saved per BD Administrative Hierarchy'}
          </span>
        )}

        <button
          type="submit"
          disabled={!isValid}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all"
        >
          {t('save')}
        </button>
      </div>
    </form>
  );
};
