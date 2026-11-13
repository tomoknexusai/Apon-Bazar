import React, { useState, useEffect, useMemo } from 'react';
import {
  LocalPlaceRecord,
  UnionRecord,
  WardRecord,
  PlaceType,
  RecordStatus,
  PLACE_TYPE_CONFIGS
} from '../../../types/local-address';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList
} from '../../../lib/bd-locations';
import { X, Store, AlertCircle, Building2, MapPin, ShoppingBag, Compass } from 'lucide-react';

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlace: LocalPlaceRecord | null;
  initialType?: PlaceType;
  unions: UnionRecord[];
  wards: WardRecord[];
  defaultDivision: string;
  defaultDistrict: string;
  defaultUpazila: string;
  defaultUnionId?: string;
  defaultWardId?: string;
  onSave: (data: {
    placeName: string;
    placeNameEn?: string;
    placeType: PlaceType;
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    unionId: string;
    wardId?: string;
    wardName?: string;
    villageArea?: string;
    postCode?: string;
    shopType?: string;
    status: RecordStatus;
  }) => { success: boolean; message: string };
}

export const PlaceFormModal: React.FC<PlaceFormModalProps> = ({
  isOpen,
  onClose,
  editingPlace,
  initialType = 'market',
  unions,
  wards,
  defaultDivision,
  defaultDistrict,
  defaultUpazila,
  defaultUnionId,
  defaultWardId,
  onSave
}) => {
  const [division, setDivision] = useState(defaultDivision);
  const [district, setDistrict] = useState(defaultDistrict);
  const [upazila, setUpazila] = useState(defaultUpazila);
  const [unionId, setUnionId] = useState(defaultUnionId || '');
  const [wardId, setWardId] = useState(defaultWardId || '');
  const [placeType, setPlaceType] = useState<PlaceType>(initialType);
  const [placeName, setPlaceName] = useState('');
  const [placeNameEn, setPlaceNameEn] = useState('');
  const [villageArea, setVillageArea] = useState('');
  const [postCode, setPostCode] = useState('');
  const [shopType, setShopType] = useState('');
  const [status, setStatus] = useState<RecordStatus>('active');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const divisions = BD_DIVISIONS.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
  const districts = getDistrictsList(division);
  const upazilas = getUpazilasList(division, district);

  // Available unions matching division, district, upazila
  const availableUnions = useMemo(() => {
    return unions.filter(
      (u) =>
        u.divisionName === division &&
        u.districtName === district &&
        u.upazilaName === upazila
    );
  }, [unions, division, district, upazila]);

  // Available wards matching selected union
  const availableWards = useMemo(() => {
    if (!unionId) return [];
    return wards.filter((w) => w.unionId === unionId);
  }, [wards, unionId]);

  useEffect(() => {
    if (editingPlace) {
      setDivision(editingPlace.divisionName);
      setDistrict(editingPlace.districtName);
      setUpazila(editingPlace.upazilaName);
      setUnionId(editingPlace.unionId);
      setWardId(editingPlace.wardId || '');
      setPlaceType(editingPlace.placeType);
      setPlaceName(editingPlace.placeName);
      setPlaceNameEn(editingPlace.placeNameEn || '');
      setVillageArea(editingPlace.villageArea || '');
      setPostCode(editingPlace.postCode || '');
      setShopType(editingPlace.shopType || '');
      setStatus(editingPlace.status);
      setErrorMessage(null);
    } else {
      setDivision(defaultDivision);
      setDistrict(defaultDistrict);
      setUpazila(defaultUpazila);
      const initialUnion = availableUnions[0];
      setUnionId(defaultUnionId || initialUnion?.id || '');
      setWardId(defaultWardId || '');
      setPlaceType(initialType);
      setPlaceName('');
      setPlaceNameEn('');
      setVillageArea('');
      setPostCode(initialType === 'post_office' ? '৫১০০' : '');
      setShopType(initialType === 'local_shop' ? 'Grocery' : '');
      setStatus('active');
      setErrorMessage(null);
    }
  }, [editingPlace, isOpen, initialType, defaultDivision, defaultDistrict, defaultUpazila, defaultUnionId, defaultWardId]);

  // When availableUnions change, keep unionId valid
  useEffect(() => {
    if (!editingPlace && availableUnions.length > 0 && (!unionId || !availableUnions.some((u) => u.id === unionId))) {
      setUnionId(availableUnions[0].id);
      setWardId('');
    }
  }, [availableUnions, unionId, editingPlace]);

  if (!isOpen) return null;

  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const dList = getDistrictsList(newDiv);
    const firstDist = dList[0]?.nameBn || '';
    setDistrict(firstDist);
    const uList = getUpazilasList(newDiv, firstDist);
    setUpazila(uList[0]?.nameBn || '');
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const uList = getUpazilasList(division, newDist);
    setUpazila(uList[0]?.nameBn || '');
  };

  const getSaveButtonText = () => {
    if (editingPlace) {
      switch (placeType) {
        case 'village':
          return 'UPDATE VILLAGE';
        case 'area':
          return 'UPDATE AREA';
        case 'market':
          return 'UPDATE MARKET';
        case 'bazar':
          return 'UPDATE BAZAR';
        case 'shopping_mall':
          return 'UPDATE SHOPPING MALL';
        case 'local_shop':
          return 'UPDATE LOCAL SHOP';
        case 'grocery':
          return 'UPDATE GROCERY';
        case 'landmark':
          return 'UPDATE LANDMARK';
        case 'post_office':
          return 'UPDATE POST OFFICE';
        default:
          return 'UPDATE PLACE';
      }
    } else {
      switch (placeType) {
        case 'village':
          return 'SAVE & ADD VILLAGE';
        case 'area':
          return 'SAVE & ADD AREA';
        case 'market':
          return 'SAVE & ADD MARKET';
        case 'bazar':
          return 'SAVE & ADD BAZAR';
        case 'shopping_mall':
          return 'SAVE & ADD SHOPPING MALL';
        case 'local_shop':
          return 'SAVE & ADD LOCAL SHOP';
        case 'grocery':
          return 'SAVE & ADD GROCERY';
        case 'landmark':
          return 'SAVE & ADD LANDMARK';
        case 'post_office':
          return 'SAVE & ADD POST OFFICE';
        default:
          return 'SAVE PLACE';
      }
    }
  };

  const getTitleAndSubtitle = () => {
    const config = PLACE_TYPE_CONFIGS[placeType] || PLACE_TYPE_CONFIGS.market;
    if (editingPlace) {
      return {
        title: `Edit ${config.labelEn} (${config.labelBn} সম্পাদনা)`,
        sub: 'Tier 6: লোকাল প্লেস রেকর্ড আপডেট'
      };
    }
    return {
      title: `+ Add New ${config.labelEn} (নতুন ${config.labelBn})`,
      sub: 'Tier 6: ইউনিয়ন ও ওয়ার্ড ভিত্তিক সুনির্দিষ্ট লোকাল সার্ভিস পয়েন্ট'
    };
  };

  const getNameLabel = () => {
    switch (placeType) {
      case 'village':
        return 'Village Name (গ্রামের নাম - বাংলা) *';
      case 'area':
        return 'Area Name (এলাকার নাম - বাংলা) *';
      case 'market':
        return 'Market Name (মার্কেটের নাম - বাংলা) *';
      case 'bazar':
        return 'Bazar Name (বাজারের নাম - বাংলা) *';
      case 'shopping_mall':
        return 'Shopping Mall Name (শপিং মলের নাম - বাংলা) *';
      case 'local_shop':
        return 'Local Shop Name (লোকাল দোকানের নাম - বাংলা) *';
      case 'grocery':
        return 'Grocery Name (মুদি দোকানের নাম - বাংলা) *';
      case 'landmark':
        return 'Landmark Name (ল্যান্ডমার্কের নাম - বাংলা) *';
      case 'post_office':
        return 'Post Office Name (পোস্ট অফিসের নাম - বাংলা) *';
      default:
        return 'Place Name (স্থানের নাম - বাংলা) *';
    }
  };

  const getNamePlaceholder = () => {
    switch (placeType) {
      case 'village':
        return 'যেমন: সিংগিয়া পশ্চিমপাড়া, বালাপুকুর, ইত্যাদি';
      case 'area':
        return 'যেমন: কলেজ পাড়া, সরকার পাড়া, মাস্টার কলোনি';
      case 'market':
        return 'যেমন: সিংগিয়া বাজার কাঁচাবাজার, হকার্স মার্কেট';
      case 'bazar':
        return 'যেমন: সিংগিয়া কেন্দ্রীয় বাজার, দৈনিক বাজার';
      case 'shopping_mall':
        return 'যেমন: সিংগিয়া শপিং কমপ্লেক্স, রাপা প্লাজা';
      case 'local_shop':
        return 'যেমন: সিংগিয়া সমবায় সুপার শপ, কাশেম হার্ডওয়্যার';
      case 'grocery':
        return 'যেমন: ভাই ভাই জেনারেল স্টোর, রফিক মুদি শপ';
      case 'landmark':
        return 'যেমন: নারগুন মোড়, কালীবাড়ী চত্বর';
      case 'post_office':
        return 'যেমন: সিংগিয়া সাব-পোস্ট অফিস';
      default:
        return 'নাম লিখুন...';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parentUnion = unions.find((u) => u.id === unionId);
    if (!parentUnion) {
      setErrorMessage('অনুগ্রহ করে প্যারেন্ট ইউনিয়ন বা পৌরসভা নির্বাচন করুন');
      return;
    }

    if (!placeName.trim()) {
      setErrorMessage('স্থানের নাম আবশ্যক');
      return;
    }

    const selectedWard = wards.find((w) => w.id === wardId);

    const res = onSave({
      placeName: placeName.trim(),
      placeNameEn: placeNameEn.trim() || undefined,
      placeType,
      divisionName: parentUnion.divisionName,
      districtName: parentUnion.districtName,
      upazilaName: parentUnion.upazilaName,
      unionName: parentUnion.unionName,
      unionId: parentUnion.id,
      wardId: selectedWard?.id,
      wardName: selectedWard?.wardName,
      villageArea: villageArea.trim() || undefined,
      postCode: postCode.trim() || undefined,
      shopType: shopType.trim() || undefined,
      status
    });

    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const { title, sub } = getTitleAndSubtitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-neutral-500">{sub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Place Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
                Place Type (স্থানের ধরণ) *
              </label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value as PlaceType)}
                className="w-full px-3 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-neutral-800 font-bold text-neutral-900 dark:text-white"
              >
                <option value="village">গ্রাম (Village)</option>
                <option value="area">এলাকা (Area)</option>
                <option value="bazar">বাজার (Bazar - Separate Database Type)</option>
                <option value="market">মার্কেট (Market - Separate Database Type)</option>
                <option value="shopping_mall">শপিং মল (Shopping Mall)</option>
                <option value="local_shop">লোকাল শপ (Local Shop)</option>
                <option value="grocery">মুদি দোকান / গ্রোসারী (Grocery - Separate Database Type)</option>
                <option value="landmark">ল্যান্ডমার্ক (Landmark)</option>
                <option value="post_office">পোস্ট অফিস (Post Office)</option>
                <option value="other">অন্যান্য (Other)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Status (স্ট্যাটাস) *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RecordStatus)}
                className="w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-semibold"
              >
                <option value="active">Active (সক্রিয় - লাইভ সার্চে দৃশ্যমান)</option>
                <option value="inactive">Inactive (নিষ্ক্রিয় - অপ্রকাশিত)</option>
              </select>
            </div>
          </div>

          {/* Cascading Location Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                বিভাগ (Division) *
              </label>
              <select
                disabled={Boolean(editingPlace)}
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full px-2.5 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 disabled:opacity-60 text-xs"
              >
                {divisions.map((d) => (
                  <option key={d.nameBn} value={d.nameBn}>
                    {d.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                জেলা (District) *
              </label>
              <select
                disabled={Boolean(editingPlace)}
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-2.5 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 disabled:opacity-60 text-xs"
              >
                {districts.map((d) => (
                  <option key={d.nameBn} value={d.nameBn}>
                    {d.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                উপজেলা / থানা *
              </label>
              <select
                disabled={Boolean(editingPlace)}
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                className="w-full px-2.5 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 disabled:opacity-60 text-xs"
              >
                {upazilas.map((u) => (
                  <option key={u.nameBn} value={u.nameBn}>
                    {u.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Parent Union & Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
                Union / Paurashava (ইউনিয়ন বা পৌরসভা) *
              </label>
              <select
                required
                disabled={Boolean(editingPlace)}
                value={unionId}
                onChange={(e) => {
                  setUnionId(e.target.value);
                  setWardId('');
                }}
                className="w-full px-3 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-neutral-800 font-semibold disabled:opacity-60"
              >
                <option value="">-- ইউনিয়ন নির্বাচন করুন --</option>
                {availableUnions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unionName} ({u.upazilaName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Ward (ওয়ার্ড - ঐচ্ছিক)
              </label>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
              >
                <option value="">-- কোনো নির্দিষ্ট ওয়ার্ড নেই (পুরো ইউনিয়ন) --</option>
                {availableWards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.wardName} ({w.wardNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Place Name (Bangla) */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
              {getNameLabel()}
            </label>
            <input
              type="text"
              required
              id="input-place-name"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder={getNamePlaceholder()}
              className="w-full px-3.5 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-neutral-800 text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Place Name (English) */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
              English Name (ইংরেজি নাম - ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={placeNameEn}
              onChange={(e) => setPlaceNameEn(e.target.value)}
              placeholder="e.g. Singia Kitchen Market"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
            />
          </div>

          {/* Conditional: Post Code for Post Office */}
          {placeType === 'post_office' && (
            <div>
              <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
                Post Code (পোস্ট কোড) *
              </label>
              <input
                type="text"
                required
                id="input-post-code"
                value={postCode}
                onChange={(e) => setPostCode(e.target.value)}
                placeholder="যেমন: ৫১০০ বা ১২০৭"
                className="w-full px-3.5 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-neutral-800 font-mono font-bold text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {/* Conditional: Shop Type for Local Shop / Grocery */}
          {placeType === 'local_shop' && (
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Shop Type (দোকানের ধরণ, যেমন: Grocery, General Store, Pharmacy)
              </label>
              <input
                type="text"
                id="input-shop-type"
                value={shopType}
                onChange={(e) => setShopType(e.target.value)}
                placeholder="যেমন: Grocery, General Store, ফার্মেসী, কনফেকশনারী"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
              />
            </div>
          )}

          {/* Village / Local Area description */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
              {placeType === 'shopping_mall'
                ? 'Address / Area (ঠিকানা / এলাকা বর্ণনা)'
                : placeType === 'landmark'
                ? 'Description / Location Note (ল্যান্ডমার্কের বিবরণ / বৈশিষ্ট্য)'
                : 'গ্রাম / লোকাল এরিয়া বা রোড বর্ণনা (Local Area / Road)'}
            </label>
            <input
              type="text"
              value={villageArea}
              onChange={(e) => setVillageArea(e.target.value)}
              placeholder={
                placeType === 'shopping_mall'
                  ? 'যেমন: মেইন রোড, সিংগিয়া বাজার সংলগ্ন'
                  : placeType === 'landmark'
                  ? 'যেমন: ৪ রাস্তার মোড়, পুরান পুলিশ ফাঁড়ির সামনে'
                  : 'যেমন: সিংগিয়া বাজার রোড, বটতলা মোড় সংলগ্ন'
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              id="btn-submit-place"
              className="px-5 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer ring-2 ring-emerald-400/40 active:scale-95 uppercase tracking-wide"
            >
              {getSaveButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
