/**
 * Standard Bangladesh Cascading Administrative Address Selector
 * Supports Official Government of Bangladesh Administrative Structure:
 * Level 1:
 * 1. Division (Dropdown)
 * 2. District (Filtered by Division)
 * 3. Upazila (Filtered by District)
 * 4. Union / Municipality (Filtered by Upazila)
 * 5. Ward Number (Filtered by Union)
 * Level 2 (Local Service Database):
 * Custom Level 2 fields presented dynamically based on Selected User Type:
 * - Customer: House No./Name, Area/Mohalla, Road No./Name, Landmark/Mor
 * - Dealer / Shop: Shop Name, Shop No., Market Name, Landmark/Mor
 * - Business / Office: Business/Office Name, House No., Road No./Name, Landmark/Mor
 * - Delivery Man: Shop/Office Name, Road No./Name, Landmark/Mor, Motorcycle Model, Reg No, Driving License No
 * Plus Post Office & Postal Code, Full Service Address Textarea, and Google Maps Location Positioning.
 *
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList,
  getUnionsList,
  getUnionPostalCode,
  buildFullServiceAddressString,
  createUnion
} from '../../lib/bd-locations';
import { useBDLocalDatabase } from '../../context/BDLocalDatabaseContext';
import { useLocalAddressDatabase } from '../../context/LocalAddressDatabaseContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import {
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Search,
  Store,
  Building2,
  ShoppingBag,
  Layers,
  Map,
  Sparkles,
  Truck
} from 'lucide-react';

export type UserTypeCategory = 'customer' | 'vendor' | 'operations_partner' | 'delivery_rider' | 'admin';

export interface BDAddressFields {
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  ward?: string;
  userType?: UserTypeCategory;
  houseNo?: string;
  area: string;
  roadNo?: string;
  landmark?: string;
  shopName?: string;
  shopNo?: string;
  marketName?: string;
  marketBazar?: string;
  businessOfficeName?: string;
  shopOfficeName?: string;
  motorcycleModel?: string;
  vehicleRegNumber?: string;
  drivingLicenseNumber?: string;
  shoppingMall?: string;
  localShop?: string;
  postOffice?: string;
  postalCode: string;
  fullServiceAddress: string;
  latitude: number;
  longitude: number;
}

interface BDAddressPickerProps {
  initialAddress?: Partial<BDAddressFields>;
  onChange: (address: BDAddressFields, isValid: boolean) => void;
  userType?: UserTypeCategory;
  lang?: 'bn' | 'en';
  title?: string;
  subtitle?: string;
  className?: string;
  required?: boolean;
}

export const BDAddressPicker: React.FC<BDAddressPickerProps> = ({
  initialAddress,
  onChange,
  userType: rawUserType = 'customer',
  lang = 'bn',
  title,
  subtitle,
  className = '',
  required = true
}) => {
  const userType: UserTypeCategory =
    rawUserType === 'vendor' ||
    rawUserType === 'operations_partner' ||
    rawUserType === 'delivery_rider'
      ? rawUserType
      : 'customer';
  const isBn = lang === 'bn';
  const {
    getMergedWards,
    getMergedVillages,
    getMergedShoppingMalls,
    getMergedLocalShops,
    getMergedLandmarks,
    getMergedPostOffices,
    getMarketsForWard
  } = useBDLocalDatabase();
  const {
    unions: dbUnions,
    wards: dbWards,
    places: dbPlaces,
    ensureUnionsForUpazila
  } = useLocalAddressDatabase();
  const { isPilotMode, pilotArea } = useSystemSettings();

  // Division selection - Full Nationwide Bangladesh Support
  const defaultDiv = initialAddress?.division || BD_DIVISIONS[0].nameBn;
  const [division, setDivision] = useState<string>(defaultDiv);

  // District list & selection
  const rawDistricts = getDistrictsList(division);
  const defaultDist = initialAddress?.district || rawDistricts[0]?.nameBn || 'ঢাকা';
  const [district, setDistrict] = useState<string>(defaultDist);

  // Upazila list & selection
  const rawUpazilas = getUpazilasList(division, district);
  const defaultUpazila = initialAddress?.upazila || rawUpazilas[0]?.nameBn || 'ধানমন্ডি';
  const [upazila, setUpazila] = useState<string>(defaultUpazila);

  // Available options calculation across all of Bangladesh
  const divisionsToDisplay = BD_DIVISIONS;
  const availableDistricts = rawDistricts;
  const availableUpazilas = rawUpazilas;

  // Auto-populate unions from official registry if not yet loaded in Level 2 DB
  useEffect(() => {
    if (division && district && upazila) {
      ensureUnionsForUpazila(division, district, upazila);
    }
  }, [division, district, upazila, ensureUnionsForUpazila]);

  // Dynamic Unions from Level 2 Database (preferred for accurate official naming)
  const dynamicUnions = useMemo(() => {
    return dbUnions
      .filter((u) => u.divisionName === division && u.districtName === district && u.upazilaName === upazila && u.status === 'active')
      .map((u) => createUnion(u.unionName, u.unionNameEn || u.unionName, u.postalCode || '1200'));
  }, [dbUnions, division, district, upazila]);

  const rawAvailableUnions = getUnionsList(division, district, upazila);
  const availableUnions = useMemo(() => {
    if (dynamicUnions.length > 0) {
      return dynamicUnions;
    }
    return rawAvailableUnions;
  }, [rawAvailableUnions, dynamicUnions]);

  const defaultUnion = initialAddress?.unionName || availableUnions[0]?.nameBn || (availableUnions.length > 0 ? availableUnions[0].nameBn : 'সদর');
  const [unionName, setUnionName] = useState<string>(defaultUnion);

  // Dynamic Wards from Level 2 Database
  const dynamicWards = useMemo(() => {
    return dbWards
      .filter((w) => w.divisionName === division && w.districtName === district && w.upazilaName === upazila && w.unionName === unionName && w.status === 'active')
      .map((w) => ({
        wardNo: w.wardNumber,
        wardNoBn: w.wardName,
        wardNoEn: w.wardNameEn || w.wardName,
        wardName: w.wardName
      }));
  }, [dbWards, division, district, upazila, unionName]);

  const rawAvailableWards = getMergedWards(division, district, upazila, unionName);
  const availableWards = useMemo(() => {
    const list = [...rawAvailableWards];
    dynamicWards.forEach((dw) => {
      if (!list.some((w) => w.wardNoBn === dw.wardNoBn)) {
        list.push(dw);
      }
    });
    return list;
  }, [rawAvailableWards, dynamicWards]);

  const defaultWard = initialAddress?.ward || availableWards[0]?.wardNoBn || 'ওয়ার্ড ০১';
  const [ward, setWard] = useState<string>(defaultWard);

  // LEVEL 2 FIELDS
  const dynamicPlaces = useMemo(() => {
    return dbPlaces.filter(
      (p) =>
        p.divisionName === division &&
        p.districtName === district &&
        p.upazilaName === upazila &&
        p.unionName === unionName &&
        p.status === 'active'
    );
  }, [dbPlaces, division, district, upazila, unionName]);

  const rawVillageSuggestions = getMergedVillages(division, district, upazila, unionName, isBn ? 'bn' : 'en');
  const villageSuggestions = useMemo(() => {
    const list = [...rawVillageSuggestions];
    dynamicPlaces
      .filter((p) => p.placeType === 'village' || Boolean(p.villageArea))
      .forEach((p) => {
        const val = p.villageArea || p.placeName;
        if (val && !list.includes(val)) {
          list.push(val);
        }
      });
    return list;
  }, [rawVillageSuggestions, dynamicPlaces]);

  const rawLandmarkSuggestions = getMergedLandmarks(division, district, upazila, unionName, isBn ? 'bn' : 'en');
  const landmarkSuggestions = useMemo(() => {
    const list = [...rawLandmarkSuggestions];
    dynamicPlaces
      .filter((p) => p.placeType === 'landmark')
      .forEach((p) => {
        if (p.placeName && !list.includes(p.placeName)) {
          list.push(p.placeName);
        }
      });
    return list;
  }, [rawLandmarkSuggestions, dynamicPlaces]);

  const poSuggestions = getMergedPostOffices(division, district, upazila, unionName, isBn ? 'bn' : 'en');

  const rawWardMarketItems = ward
    ? getMarketsForWard(division, district, upazila, unionName, ward)
    : [];

  const wardMarketItems = useMemo(() => {
    const items = [...rawWardMarketItems];
    dynamicPlaces
      .filter((p) => p.placeType === 'market' || p.placeType === 'shopping_mall')
      .forEach((p) => {
        if (!items.some((m) => m.nameBn === p.placeName)) {
          items.push({
            id: p.id,
            nameBn: p.placeName,
            nameEn: p.placeNameEn || p.placeName,
            marketType: p.placeType === 'shopping_mall' ? 'Shopping Mall' : 'Local Market',
            division,
            district,
            upazila,
            unionName,
            ward: ward || '',
            googleMapsUrl: '',
            status: 'Active',
            addedByRole: 'super_admin',
            createdAt: p.createdAt,
            updatedAt: p.updatedAt || p.createdAt
          });
        }
      });
    return items;
  }, [rawWardMarketItems, dynamicPlaces, division, district, upazila, unionName, ward]);

  // Level 2 Local State
  const [houseNo, setHouseNo] = useState<string>(initialAddress?.houseNo || '');
  const [area, setArea] = useState<string>(initialAddress?.area || villageSuggestions[0] || 'সোবহানবাগ রোড');
  const [showAreaDropdown, setShowAreaDropdown] = useState<boolean>(false);
  const [roadNo, setRoadNo] = useState<string>(initialAddress?.roadNo || '');
  const [landmark, setLandmark] = useState<string>(initialAddress?.landmark || landmarkSuggestions[0] || '');
  const [showLandmarkDropdown, setShowLandmarkDropdown] = useState<boolean>(false);

  const [shopName, setShopName] = useState<string>(
    initialAddress?.shopName || initialAddress?.businessOfficeName || initialAddress?.shopOfficeName || ''
  );
  const [shopNo, setShopNo] = useState<string>(initialAddress?.shopNo || '');
  const [marketName, setMarketName] = useState<string>(
    initialAddress?.marketName || initialAddress?.marketBazar || ''
  );
  const [showMarketDropdown, setShowMarketDropdown] = useState<boolean>(false);

  const [businessOfficeName, setBusinessOfficeName] = useState<string>(
    initialAddress?.businessOfficeName || initialAddress?.shopName || ''
  );
  const [shopOfficeName, setShopOfficeName] = useState<string>(
    initialAddress?.shopOfficeName || initialAddress?.shopName || ''
  );

  const [motorcycleModel, setMotorcycleModel] = useState<string>(initialAddress?.motorcycleModel || '');
  const [vehicleRegNumber, setVehicleRegNumber] = useState<string>(initialAddress?.vehicleRegNumber || '');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState<string>(initialAddress?.drivingLicenseNumber || '');

  // Post Office & Postal Code
  const [postOffice, setPostOffice] = useState<string>(initialAddress?.postOffice || poSuggestions[0] || '');
  const autoPostal = getUnionPostalCode(division, district, upazila, unionName);
  const [postalCode, setPostalCode] = useState<string>(initialAddress?.postalCode || autoPostal);

  // Full Service Address auto-generated and editable
  const autoFullAddress = buildFullServiceAddressString(
    area,
    marketName || initialAddress?.marketBazar,
    ward,
    unionName,
    upazila,
    district,
    division,
    postalCode,
    initialAddress?.shoppingMall,
    initialAddress?.localShop,
    landmark,
    postOffice,
    {
      userType,
      houseNo,
      roadNo,
      shopName: shopName || businessOfficeName || shopOfficeName,
      shopNo,
      marketName,
      motorcycleModel,
      vehicleRegNumber
    }
  );

  const [fullServiceAddress, setFullServiceAddress] = useState<string>(
    initialAddress?.fullServiceAddress || autoFullAddress
  );
  const [isFullAddressCustomized, setIsFullAddressCustomized] = useState<boolean>(
    Boolean(initialAddress?.fullServiceAddress)
  );

  // Google Maps Location (Lat & Long)
  const [latitude, setLatitude] = useState<number>(initialAddress?.latitude || 23.7461);
  const [longitude, setLongitude] = useState<number>(initialAddress?.longitude || 90.3742);
  const [isGpsDetected, setIsGpsDetected] = useState<boolean>(false);

  // When division changes
  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const districts = getDistrictsList(newDiv);
    const newDist = districts[0]?.nameBn || '';
    setDistrict(newDist);

    const upazilas = getUpazilasList(newDiv, newDist);
    const newUpa = upazilas[0]?.nameBn || '';
    setUpazila(newUpa);

    const unions = getUnionsList(newDiv, newDist, newUpa);
    const newUnion = unions[0]?.nameBn || '';
    setUnionName(newUnion);

    const wards = getMergedWards(newDiv, newDist, newUpa, newUnion);
    setWard(wards[0]?.wardNoBn || 'ওয়ার্ড ০১');

    const po = getUnionPostalCode(newDiv, newDist, newUpa, newUnion);
    setPostalCode(po);
  };

  // When district changes
  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const upazilas = getUpazilasList(division, newDist);
    const newUpa = upazilas[0]?.nameBn || '';
    setUpazila(newUpa);

    const unions = getUnionsList(division, newDist, newUpa);
    const newUnion = unions[0]?.nameBn || '';
    setUnionName(newUnion);

    const wards = getMergedWards(division, newDist, newUpa, newUnion);
    setWard(wards[0]?.wardNoBn || 'ওয়ার্ড ০১');

    const po = getUnionPostalCode(division, newDist, newUpa, newUnion);
    setPostalCode(po);
  };

  // When upazila changes
  const handleUpazilaChange = (newUpa: string) => {
    setUpazila(newUpa);
    const unions = getUnionsList(division, district, newUpa);
    const newUnion = unions[0]?.nameBn || '';
    setUnionName(newUnion);

    const wards = getMergedWards(division, district, newUpa, newUnion);
    setWard(wards[0]?.wardNoBn || 'ওয়ার্ড ০১');

    const po = getUnionPostalCode(division, district, newUpa, newUnion);
    setPostalCode(po);
  };

  // When union changes
  const handleUnionChange = (newUnion: string) => {
    setUnionName(newUnion);
    const wards = getMergedWards(division, district, upazila, newUnion);
    setWard(wards[0]?.wardNoBn || 'ওয়ার্ড ০১');

    const po = getUnionPostalCode(division, district, upazila, newUnion);
    setPostalCode(po);
  };

  // Re-sync full address when base elements change (unless user manually customized textarea)
  useEffect(() => {
    if (!isFullAddressCustomized) {
      const generated = buildFullServiceAddressString(
        area,
        marketName,
        ward,
        unionName,
        upazila,
        district,
        division,
        postalCode,
        undefined,
        undefined,
        landmark,
        postOffice,
        {
          userType,
          houseNo,
          roadNo,
          shopName: shopName || businessOfficeName || shopOfficeName,
          shopNo,
          marketName,
          motorcycleModel,
          vehicleRegNumber
        }
      );
      setFullServiceAddress(generated);
    }
  }, [
    userType,
    houseNo,
    area,
    roadNo,
    landmark,
    shopName,
    shopNo,
    marketName,
    businessOfficeName,
    shopOfficeName,
    motorcycleModel,
    vehicleRegNumber,
    ward,
    unionName,
    upazila,
    district,
    division,
    postalCode,
    isFullAddressCustomized
  ]);

  // GPS Auto Detection
  const handleDetectGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
          setIsGpsDetected(true);
        },
        (err) => {
          console.warn('GPS detection unavailable:', err.message);
          setLatitude(23.7461);
          setLongitude(90.3742);
        }
      );
    }
  };

  // Notify parent component of changes
  useEffect(() => {
    const activeShopName = shopName || businessOfficeName || shopOfficeName;
    const currentAddress: BDAddressFields = {
      division,
      district,
      upazila,
      unionName,
      ward,
      userType,
      houseNo,
      area: area || 'সোবহানবাগ',
      roadNo,
      landmark,
      shopName: activeShopName,
      shopNo,
      marketName: marketName,
      marketBazar: marketName,
      businessOfficeName: userType === 'operations_partner' ? activeShopName : businessOfficeName,
      shopOfficeName: userType === 'delivery_rider' ? activeShopName : shopOfficeName,
      motorcycleModel,
      vehicleRegNumber,
      drivingLicenseNumber,
      postOffice,
      postalCode,
      fullServiceAddress,
      latitude,
      longitude
    };

    const isValid = Boolean(
      division &&
      district &&
      upazila &&
      unionName &&
      ward &&
      postalCode &&
      fullServiceAddress &&
      latitude &&
      longitude
    );

    onChange(currentAddress, isValid);
  }, [
    division,
    district,
    upazila,
    unionName,
    ward,
    userType,
    houseNo,
    area,
    roadNo,
    landmark,
    shopName,
    shopNo,
    marketName,
    businessOfficeName,
    shopOfficeName,
    motorcycleModel,
    vehicleRegNumber,
    drivingLicenseNumber,
    postOffice,
    postalCode,
    fullServiceAddress,
    latitude,
    longitude
  ]);

  return (
    <div className={`space-y-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-xs ${className}`}>
      {/* Header Title */}
      {(title || subtitle) && (
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
          {title && (
            <h3 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{title}</span>
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* LEVEL 1: Official Administrative Structure (Unchanged) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 block uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? '১. লেভেল ১: অফিশিয়াল প্রশাসনিক কাঠামো' : '1. Level 1: Official Administrative Structure'}</span>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            {isBn ? 'সরকারি ক্যাস্কেডিং কাঠামো' : 'BD Official Hierarchy'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* 1. Division */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? '১. বিভাগ (Division) *' : '1. Division *'}
            </label>
            <select
              value={division}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              required
            >
              {divisionsToDisplay.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {isBn ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* 2. District */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? '২. জেলা (District) *' : '2. District *'}
            </label>
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              required
            >
              {availableDistricts.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {isBn ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Upazila */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? '৩. উপজেলা (Upazila) *' : '3. Upazila *'}
            </label>
            <select
              value={upazila}
              onChange={(e) => handleUpazilaChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              required
            >
              {availableUpazilas.map((u) => (
                <option key={u.nameBn} value={u.nameBn}>
                  {isBn ? u.nameBn : u.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Union / Municipality */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? '৪. ইউনিয়ন / পৌরসভা *' : '4. Union / Municipality *'}
            </label>
            <select
              value={unionName}
              onChange={(e) => handleUnionChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              required
            >
              {availableUnions.map((u) => {
                const isMuni = u.nameBn.includes('পৌরসভা');
                const displayLabel = isBn
                  ? (isMuni ? `${u.nameBn} [পৌরসভা]` : `${u.nameBn} ইউনিয়ন`)
                  : (isMuni ? `${u.nameEn} [Municipality]` : `${u.nameEn} Union`);
                return (
                  <option key={u.nameBn} value={u.nameBn}>
                    {displayLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 5. Ward Number */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? '৫. ওয়ার্ড নম্বর (Ward) *' : '5. Ward Number *'}
            </label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full text-xs font-black bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 rounded-xl p-2.5 text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 shadow-xs"
              required
            >
              {availableWards.map((w) => (
                <option key={w.wardNoBn} value={w.wardNoBn}>
                  {isBn ? w.wardNoBn : w.wardNoEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LEVEL 2: Local Service Database Fields (Conditional per User Type) */}
      <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {userType === 'vendor'
                ? (isBn ? '২. লেভেল ২: স্থানীয় সার্ভিস ডাটাবেজ (ডিলার ও শপ)' : '2. Level 2: Local Service Database (Dealer / Shop)')
                : userType === 'operations_partner'
                ? (isBn ? '২. লেভেল ২: স্থানীয় সার্ভিস ডাটাবেজ (বিজনেস ও অফিস)' : '2. Level 2: Local Service Database (Business / Office)')
                : userType === 'delivery_rider'
                ? (isBn ? '২. লেভেল ২: স্থানীয় সার্ভিস ডাটাবেজ (ডেলিভারিম্যান)' : '2. Level 2: Local Service Database (Delivery Man)')
                : (isBn ? '২. লেভেল ২: স্থানীয় সার্ভিস ডাটাবেজ (কাস্টমার)' : '2. Level 2: Local Service Database (Customer)')}
            </span>
          </span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 italic font-medium">
            {isBn ? '* ব্যবহারকারীর ধরন অনুযায়ী সার্ভিস ঠিকানা ফিল্ডস' : '* Level 2 Local Service Address Fields'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* CUSTOMER USER TYPE */}
          {userType === 'customer' && (
            <>
              {/* House No. / House Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'বাড়ি নম্বর / বাড়ির নাম' : 'House No. / House Name'}
                </label>
                <input
                  type="text"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder={isBn ? 'যেমন: বাড়ি ২৭ / খন্দকার ম্যানশন' : 'e.g. House 27 / Mansion'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Area / Mohalla */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'পাড়া / মহল্লা *' : 'Area / Mohalla *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      setShowAreaDropdown(true);
                    }}
                    onFocus={() => setShowAreaDropdown(true)}
                    placeholder={isBn ? 'যেমন: সোবহানবাগ / উত্তরপাড়া' : 'e.g. Sobhanbag / North Area'}
                    className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 pr-8 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {showAreaDropdown && villageSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1 text-xs">
                    {villageSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setArea(item);
                          setShowAreaDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 font-bold hover:bg-emerald-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Road No. / Road Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'রোড নম্বর / নাম' : 'Road No. / Road Name'}
                </label>
                <input
                  type="text"
                  value={roadNo}
                  onChange={(e) => setRoadNo(e.target.value)}
                  placeholder={isBn ? 'যেমন: রোড ০৪ / কে বি রোড' : 'e.g. Road 04 / KB Road'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Landmark / Mor */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'পরিচিত ল্যান্ডমার্ক / মোড়' : 'Landmark / Mor'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => {
                      setLandmark(e.target.value);
                      setShowLandmarkDropdown(true);
                    }}
                    onFocus={() => setShowLandmarkDropdown(true)}
                    placeholder={isBn ? 'যেমন: রাপা প্লাজা মোড় / মসজিদের পাশে' : 'e.g. Near Rapa Plaza'}
                    className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 pr-8 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <Compass className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {showLandmarkDropdown && landmarkSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1 text-xs">
                    {landmarkSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setLandmark(item);
                          setShowLandmarkDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 font-bold hover:bg-emerald-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* DEALER / SHOP USER TYPE */}
          {userType === 'vendor' && (
            <>
              {/* Shop Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'দোকানের নাম *' : 'Shop Name *'}
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={isBn ? 'যেমন: গ্রীন সুপার স্টোর' : 'e.g. Green Super Store'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Shop No. */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'দোকান নম্বর' : 'Shop No.'}
                </label>
                <input
                  type="text"
                  value={shopNo}
                  onChange={(e) => setShopNo(e.target.value)}
                  placeholder={isBn ? 'যেমন: দোকান ১২/এ' : 'e.g. Shop 12/A'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Market Name */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'বাজারের নাম' : 'Market Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={marketName}
                    onChange={(e) => {
                      setMarketName(e.target.value);
                      setShowMarketDropdown(true);
                    }}
                    onFocus={() => setShowMarketDropdown(true)}
                    placeholder={isBn ? 'যেমন: রাপা প্লাজা বাজার' : 'e.g. Rapa Plaza Market'}
                    className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 pr-8 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <Store className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {ward && showMarketDropdown && wardMarketItems.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1 text-xs">
                    {wardMarketItems.map((item) => {
                      const name = isBn ? item.nameBn : item.nameEn;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMarketName(name);
                            setShowMarketDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 font-bold hover:bg-emerald-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg flex items-center justify-between gap-2"
                        >
                          <span>{name}</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                            {item.marketType}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Landmark / Mor */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'পরিচিত ল্যান্ডমার্ক / মোড়' : 'Landmark / Mor'}
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder={isBn ? 'যেমন: পুবালী ব্যাংক মোড়' : 'e.g. Near Pubali Bank'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* BUSINESS / OFFICE USER TYPE */}
          {userType === 'operations_partner' && (
            <>
              {/* Business / Office Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'দোকান / অফিসের নাম *' : 'Business / Office Name *'}
                </label>
                <input
                  type="text"
                  value={businessOfficeName || shopName}
                  onChange={(e) => {
                    setBusinessOfficeName(e.target.value);
                    setShopName(e.target.value);
                  }}
                  placeholder={isBn ? 'যেমন: সততা কমার্শিয়াল লিমিটেড' : 'e.g. Satata Commercial Ltd'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* House No. */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'বাড়ি নম্বর' : 'House No.'}
                </label>
                <input
                  type="text"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder={isBn ? 'যেমন: বাড়ি ৮৮ / টাওয়ার ৩' : 'e.g. House 88 / Tower 3'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Road No. / Road Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'রোড নম্বর / নাম' : 'Road No. / Road Name'}
                </label>
                <input
                  type="text"
                  value={roadNo}
                  onChange={(e) => setRoadNo(e.target.value)}
                  placeholder={isBn ? 'যেমন: রোড ১২ / বিমানবন্দর রোড' : 'e.g. Road 12 / Airport Road'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Landmark / Mor */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'পরিচিত ল্যান্ডমার্ক / মোড়' : 'Landmark / Mor'}
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder={isBn ? 'যেমন: বাস স্ট্যান্ড সংলগ্ন' : 'e.g. Near Bus Stand'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* DELIVERY MAN USER TYPE */}
          {userType === 'delivery_rider' && (
            <>
              {/* Shop / Office Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'দোকান / অফিসের নাম *' : 'Shop / Office Name *'}
                </label>
                <input
                  type="text"
                  value={shopOfficeName || shopName}
                  onChange={(e) => {
                    setShopOfficeName(e.target.value);
                    setShopName(e.target.value);
                  }}
                  placeholder={isBn ? 'যেমন: এক্সপ্রেস রাইডার হাব' : 'e.g. Express Rider Hub'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Road No. / Road Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'রোড নম্বর / নাম' : 'Road No. / Road Name'}
                </label>
                <input
                  type="text"
                  value={roadNo}
                  onChange={(e) => setRoadNo(e.target.value)}
                  placeholder={isBn ? 'যেমন: বাইপাস রোড' : 'e.g. Bypass Road'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Landmark / Mor */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'পরিচিত মোড় / ল্যান্ডমার্ক' : 'Landmark / Mor'}
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder={isBn ? 'যেমন: চৌরাস্তা মোড়' : 'e.g. Chourasta Mor'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Motorcycle Name / Model */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'মোটরসাইকেলের নাম / মডেল *' : 'Motorcycle Name / Model *'}
                </label>
                <input
                  type="text"
                  value={motorcycleModel}
                  onChange={(e) => setMotorcycleModel(e.target.value)}
                  placeholder={isBn ? 'যেমন: TVS Apache RTR 160' : 'e.g. TVS Apache RTR 160'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Registration No. */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'রেজিস্ট্রেশন নম্বর *' : 'Registration No. *'}
                </label>
                <input
                  type="text"
                  value={vehicleRegNumber}
                  onChange={(e) => setVehicleRegNumber(e.target.value)}
                  placeholder={isBn ? 'যেমন: ঢাকা মেট্রো-হ-১২৩৪' : 'e.g. DHAKA-METRO-H-1234'}
                  className="w-full text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Driving License No. */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'ড্রাইভিং লাইসেন্স নম্বর *' : 'Driving License No. *'}
                </label>
                <input
                  type="text"
                  value={drivingLicenseNumber}
                  onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                  placeholder={isBn ? 'যেমন: DL-8839201' : 'e.g. DL-8839201'}
                  className="w-full text-xs font-mono bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </>
          )}

          {/* Post Office & Postal Code */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? 'ডাকঘর ও পোস্টাল কোড *' : 'Post Office & Postal Code *'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={postOffice}
                onChange={(e) => setPostOffice(e.target.value)}
                placeholder={isBn ? 'ডাকঘর' : 'Post Office'}
                className="w-2/3 text-xs font-bold bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
              />
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder={isBn ? 'পোস্ট কোড' : 'Post Code'}
                className="w-1/3 text-xs font-black bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-emerald-600 dark:text-emerald-400 text-center"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* FULL SERVICE ADDRESS INPUT */}
      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            {isBn ? 'পূর্ণাঙ্গ ডেলিভারি ও সার্ভিস ঠিকানা (Full Service Address) *' : 'Full Service Address *'}
          </label>
          <button
            type="button"
            onClick={() => {
              const generated = buildFullServiceAddressString(
                area,
                marketName,
                ward,
                unionName,
                upazila,
                district,
                division,
                postalCode,
                undefined,
                undefined,
                landmark,
                postOffice,
                {
                  userType,
                  houseNo,
                  roadNo,
                  shopName: shopName || businessOfficeName || shopOfficeName,
                  shopNo,
                  marketName,
                  motorcycleModel,
                  vehicleRegNumber
                }
              );
              setFullServiceAddress(generated);
              setIsFullAddressCustomized(false);
            }}
            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            {isBn ? 'অটো-জেনারেট রিসেট করুন' : 'Reset Auto-Generated Address'}
          </button>
        </div>

        <textarea
          rows={2}
          value={fullServiceAddress}
          onChange={(e) => {
            setFullServiceAddress(e.target.value);
            setIsFullAddressCustomized(true);
          }}
          className="w-full text-xs font-medium bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-3 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-xs leading-relaxed"
          required
        />
      </div>

      {/* GOOGLE MAPS LOCATION (Lat & Long) */}
      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'গুগল ম্যাপস লোকেশন পজিশনিং (অক্ষাংশ ও দ্রাঘিমাংশ) *' : 'Google Maps Location (Lat & Long) *'}</span>
          </span>

          <button
            type="button"
            onClick={handleDetectGps}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isBn ? 'GPS লোকেশন অটো ডিটেক্ট করুন' : 'Detect My GPS Location'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5">
              {isBn ? 'অক্ষাংশ (Latitude)' : 'Latitude'}
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 text-neutral-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5">
              {isBn ? 'দ্রাঘিমাংশ (Longitude)' : 'Longitude'}
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 text-neutral-900 dark:text-white"
              required
            />
          </div>
        </div>

        {isGpsDetected && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isBn ? 'ডিভাইস জিপিএস থেকে লোকেশন কোঅর্ডিনেট সফলভাবে শনাক্ত করা হয়েছে' : 'GPS location coordinates acquired from device'}</span>
          </p>
        )}
      </div>
    </div>
  );
};
