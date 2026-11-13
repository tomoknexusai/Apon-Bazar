import React, { useState, useEffect } from 'react';
import { UnionRecord, RecordStatus } from '../../../types/local-address';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList
} from '../../../lib/bd-locations';
import { X, Building2, Check, AlertCircle } from 'lucide-react';

interface UnionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUnion: UnionRecord | null;
  defaultDivision: string;
  defaultDistrict: string;
  defaultUpazila: string;
  onSave: (data: {
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    unionNameEn?: string;
    officialName?: string;
    unionCode: string;
    postalCode?: string;
    status: RecordStatus;
    isMunicipality?: boolean;
    autoCreateWards?: boolean;
  }) => { success: boolean; message: string };
}

export const UnionFormModal: React.FC<UnionFormModalProps> = ({
  isOpen,
  onClose,
  editingUnion,
  defaultDivision,
  defaultDistrict,
  defaultUpazila,
  onSave
}) => {
  const [division, setDivision] = useState(defaultDivision);
  const [district, setDistrict] = useState(defaultDistrict);
  const [upazila, setUpazila] = useState(defaultUpazila);
  const [unionName, setUnionName] = useState('');
  const [unionNameEn, setUnionNameEn] = useState('');
  const [officialName, setOfficialName] = useState('');
  const [isMunicipality, setIsMunicipality] = useState(false);
  const [unionCode, setUnionCode] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [status, setStatus] = useState<RecordStatus>('active');
  const [autoCreateWards, setAutoCreateWards] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const divisions = BD_DIVISIONS.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
  const districts = getDistrictsList(division);
  const upazilas = getUpazilasList(division, district);

  useEffect(() => {
    if (editingUnion) {
      setDivision(editingUnion.divisionName);
      setDistrict(editingUnion.districtName);
      setUpazila(editingUnion.upazilaName);
      setUnionName(editingUnion.unionName);
      setUnionNameEn(editingUnion.unionNameEn || '');
      setOfficialName(editingUnion.officialName || '');
      setIsMunicipality(!!editingUnion.isMunicipality || editingUnion.unionName.includes('পৌরসভা'));
      setUnionCode(editingUnion.unionCode);
      setPostalCode(editingUnion.postalCode || '');
      setStatus(editingUnion.status);
      setAutoCreateWards(false);
      setErrorMessage(null);
    } else {
      setDivision(defaultDivision);
      setDistrict(defaultDistrict);
      setUpazila(defaultUpazila);
      setUnionName('');
      setUnionNameEn('');
      setOfficialName('');
      setIsMunicipality(false);
      setUnionCode(`UN-${Math.floor(1000 + Math.random() * 9000)}`);
      setPostalCode('১২০০');
      setStatus('active');
      setAutoCreateWards(true);
      setErrorMessage(null);
    }
  }, [editingUnion, isOpen, defaultDivision, defaultDistrict, defaultUpazila]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!unionName.trim()) {
      setErrorMessage('ইউনিয়ন / পৌরসভার নাম আবশ্যক');
      return;
    }

    const res = onSave({
      divisionName: division,
      districtName: district,
      upazilaName: upazila,
      unionName: unionName.trim(),
      unionNameEn: unionNameEn.trim() || undefined,
      officialName: officialName.trim() || undefined,
      unionCode: unionCode.trim() || `UN-${Date.now().toString().slice(-4)}`,
      postalCode: postalCode.trim() || undefined,
      status,
      isMunicipality,
      autoCreateWards
    });

    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#198754] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                {editingUnion ? 'Edit Union (ইউনিয়ন সম্পাদনা)' : '+ Add New Union (নতুন ইউনিয়ন)'}
              </h3>
              <p className="text-[11px] text-neutral-500">Tier 4: ইউনিয়ন বা পৌরসভা রেজিস্ট্রেশন</p>
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
          {/* Cascading Parent Location Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                বিভাগ (Division) *
              </label>
              <select
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-medium"
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
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-medium"
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
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-medium"
              >
                {upazilas.map((u) => (
                  <option key={u.nameBn} value={u.nameBn}>
                    {u.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* New Union Name */}
          {/* Union Name */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
              প্রকৃত নাম (Actual Union / Pourashava Name - বাংলা) *
            </label>
            <input
              type="text"
              required
              id="input-new-union-name"
              value={unionName}
              onChange={(e) => setUnionName(e.target.value)}
              placeholder="যেমন: আকচা, আখানগর, চিলারং, মোহাম্মদপুর..."
              className="w-full px-3.5 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-neutral-800 text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              সতর্কতা: নামের সাথে উপজেলা, জেলা বা ওয়ার্ডের সংখ্যা যোগ করবেন না। শুধুমাত্র প্রকৃত নাম দিন।
            </p>
          </div>

          {/* Municipality Toggle */}
          <label className="flex items-center gap-2.5 p-2.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={isMunicipality}
              onChange={(e) => setIsMunicipality(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              এটি একটি পৌরসভা (Municipality / Pourashava)
            </span>
          </label>

          {/* Official Name */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
              অফিসিয়াল নাম (Official Full Name - ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={officialName}
              onChange={(e) => setOfficialName(e.target.value)}
              placeholder={isMunicipality ? "যেমন: ঠাকুরগাঁও পৌরসভা" : "যেমন: আকচা ইউনিয়ন পরিষদ"}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Union Name (English)
              </label>
              <input
                type="text"
                value={unionNameEn}
                onChange={(e) => setUnionNameEn(e.target.value)}
                placeholder="e.g. Singia"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Union Code/ID *
              </label>
              <input
                type="text"
                required
                value={unionCode}
                onChange={(e) => setUnionCode(e.target.value)}
                placeholder="UN-1234"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                পোস্টাল কোড (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="যেমন: ১২০০"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Status (স্ট্যাটাস) *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RecordStatus)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-semibold"
              >
                <option value="active">Active (সক্রিয়)</option>
                <option value="inactive">Inactive (নিষ্ক্রিয়)</option>
              </select>
            </div>
          </div>

          {!editingUnion && (
            <label className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={autoCreateWards}
                onChange={(e) => setAutoCreateWards(e.target.checked)}
                className="rounded text-[#198754] focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                স্বয়ংক্রিয়ভাবে ৯টি আদর্শ ওয়ার্ড (ওয়ার্ড ০১ থেকে ০৯) তৈরি করুন
              </span>
            </label>
          )}

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
              id="btn-submit-union"
              className="px-5 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer ring-2 ring-emerald-400/40 active:scale-95"
            >
              {editingUnion ? 'UPDATE UNION' : 'SAVE NEW UNION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
