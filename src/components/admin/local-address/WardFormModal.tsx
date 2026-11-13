import React, { useState, useEffect, useMemo } from 'react';
import { WardRecord, UnionRecord, RecordStatus } from '../../../types/local-address';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList
} from '../../../lib/bd-locations';
import { X, Layers, AlertCircle } from 'lucide-react';

interface WardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWard: WardRecord | null;
  unions: UnionRecord[];
  defaultDivision: string;
  defaultDistrict: string;
  defaultUpazila: string;
  defaultUnionId?: string;
  onSave: (data: {
    unionId: string;
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    wardNumber: string;
    wardName: string;
    wardNameEn?: string;
    status: RecordStatus;
  }) => { success: boolean; message: string };
}

export const WardFormModal: React.FC<WardFormModalProps> = ({
  isOpen,
  onClose,
  editingWard,
  unions,
  defaultDivision,
  defaultDistrict,
  defaultUpazila,
  defaultUnionId,
  onSave
}) => {
  const [division, setDivision] = useState(defaultDivision);
  const [district, setDistrict] = useState(defaultDistrict);
  const [upazila, setUpazila] = useState(defaultUpazila);
  const [unionId, setUnionId] = useState(defaultUnionId || '');
  const [wardNumber, setWardNumber] = useState('');
  const [wardName, setWardName] = useState('');
  const [wardNameEn, setWardNameEn] = useState('');
  const [status, setStatus] = useState<RecordStatus>('active');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const divisions = BD_DIVISIONS.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
  const districts = getDistrictsList(division);
  const upazilas = getUpazilasList(division, district);

  // Available unions matching current division, district, upazila
  const availableUnions = useMemo(() => {
    return unions.filter(
      (u) =>
        u.divisionName === division &&
        u.districtName === district &&
        u.upazilaName === upazila
    );
  }, [unions, division, district, upazila]);

  useEffect(() => {
    if (editingWard) {
      setDivision(editingWard.divisionName);
      setDistrict(editingWard.districtName);
      setUpazila(editingWard.upazilaName);
      setUnionId(editingWard.unionId);
      setWardNumber(editingWard.wardNumber);
      setWardName(editingWard.wardName);
      setWardNameEn(editingWard.wardNameEn || '');
      setStatus(editingWard.status);
      setErrorMessage(null);
    } else {
      setDivision(defaultDivision);
      setDistrict(defaultDistrict);
      setUpazila(defaultUpazila);
      const initialUnion = availableUnions[0];
      setUnionId(defaultUnionId || initialUnion?.id || '');
      setWardNumber('');
      setWardName('');
      setWardNameEn('');
      setStatus('active');
      setErrorMessage(null);
    }
  }, [editingWard, isOpen, defaultDivision, defaultDistrict, defaultUpazila, defaultUnionId]);

  // When availableUnions changes, ensure unionId is valid
  useEffect(() => {
    if (!editingWard && availableUnions.length > 0 && (!unionId || !availableUnions.some(u => u.id === unionId))) {
      setUnionId(availableUnions[0].id);
    }
  }, [availableUnions, unionId, editingWard]);

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

  const handleWardNumberChange = (num: string) => {
    setWardNumber(num);
    if (!editingWard && (!wardName || wardName.startsWith('ওয়ার্ড'))) {
      setWardName(num ? `ওয়ার্ড ${num}` : '');
    }
    if (!editingWard && (!wardNameEn || wardNameEn.startsWith('Ward'))) {
      setWardNameEn(num ? `Ward ${num}` : '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parentUnion = unions.find((u) => u.id === unionId);
    if (!parentUnion) {
      setErrorMessage('অনুগ্রহ করে প্যারেন্ট ইউনিয়ন নির্বাচন করুন');
      return;
    }

    if (!wardNumber.trim()) {
      setErrorMessage('ওয়ার্ড নম্বর আবশ্যক');
      return;
    }

    const finalWardName = wardName.trim() || `ওয়ার্ড ${wardNumber.trim()}`;

    const res = onSave({
      unionId: parentUnion.id,
      divisionName: parentUnion.divisionName,
      districtName: parentUnion.districtName,
      upazilaName: parentUnion.upazilaName,
      unionName: parentUnion.unionName,
      wardNumber: wardNumber.trim(),
      wardName: finalWardName,
      wardNameEn: wardNameEn.trim() || undefined,
      status
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                {editingWard ? 'Edit Ward (ওয়ার্ড সম্পাদনা)' : '+ Add New Ward (নতুন ওয়ার্ড)'}
              </h3>
              <p className="text-[11px] text-neutral-500">Tier 5: ইউনিয়ন/পৌরসভার অধীন ওয়ার্ড রেজিস্টার</p>
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
          {/* Cascading Location Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                বিভাগ (Division) *
              </label>
              <select
                disabled={Boolean(editingWard)}
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
                disabled={Boolean(editingWard)}
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
                disabled={Boolean(editingWard)}
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

          {/* Parent Union Select */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
              Union / Paurashava (প্যারেন্ট ইউনিয়ন বা পৌরসভা) *
            </label>
            <select
              required
              disabled={Boolean(editingWard)}
              value={unionId}
              onChange={(e) => setUnionId(e.target.value)}
              className="w-full px-3 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-neutral-800 font-semibold disabled:opacity-60"
            >
              <option value="">-- ইউনিয়ন নির্বাচন করুন --</option>
              {availableUnions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unionName} ({u.upazilaName}, {u.districtName})
                </option>
              ))}
            </select>
            {availableUnions.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                এই উপজেলায় কোনো ইউনিয়ন পাওয়া যায়নি। প্রথমে একটি ইউনিয়ন যোগ করুন।
              </p>
            )}
          </div>

          {/* New Ward Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
                New Ward Number (ওয়ার্ড নম্বর) *
              </label>
              <input
                type="text"
                required
                id="input-new-ward-number"
                value={wardNumber}
                onChange={(e) => handleWardNumberChange(e.target.value)}
                placeholder="যেমন: ০১ বা 01 বা 5"
                className="w-full px-3.5 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-neutral-800 text-sm font-bold text-neutral-900 dark:text-white"
              />
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
                <option value="active">Active (সক্রিয়)</option>
                <option value="inactive">Inactive (নিষ্ক্রিয়)</option>
              </select>
            </div>
          </div>

          {/* New Ward Name */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-800 dark:text-neutral-200">
              New Ward Name (ওয়ার্ডের নাম - বাংলা) *
            </label>
            <input
              type="text"
              required
              id="input-new-ward-name"
              value={wardName}
              onChange={(e) => setWardName(e.target.value)}
              placeholder="যেমন: ওয়ার্ড ০১ বা ১নং ওয়ার্ড"
              className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-bold text-neutral-900 dark:text-white"
            />
          </div>

          {/* Ward Name English */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
              Ward Name (English - Optional)
            </label>
            <input
              type="text"
              value={wardNameEn}
              onChange={(e) => setWardNameEn(e.target.value)}
              placeholder="e.g. Ward 01"
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
              id="btn-submit-ward"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer ring-2 ring-emerald-500/40 active:scale-95"
            >
              {editingWard ? 'UPDATE WARD' : 'SAVE NEW WARD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
