/**
 * Level 2 Live Local Address Search Dropdown Component
 * Project: Apon Somaj / Apon Bazar
 * 
 * Features:
 * - Debounced input handling
 * - Strict parent location hierarchy filtering (never leaks places from other unions)
 * - Badged suggestion items (Market, Village, Mall, Shop, Landmark)
 * - Keyboard navigation (Up/Down/Enter/Escape)
 * - Click-outside to close
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalAddressDatabase } from '../../context/LocalAddressDatabaseContext';
import { PlaceType, LocalAddressSuggestion, PLACE_TYPE_CONFIGS } from '../../types/local-address';
import {
  MapPin,
  Store,
  Building2,
  ShoppingBag,
  Compass,
  CheckCircle2,
  ChevronDown,
  Search,
  Sparkles,
  Layers,
  X
} from 'lucide-react';

interface LocalAddressSearchDropdownProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocalAddressSuggestion) => void;
  placeholder?: string;
  divisionName?: string;
  districtName?: string;
  upazilaName?: string;
  unionName?: string;
  wardId?: string;
  placeTypeFilter?: PlaceType;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  isRtlOrBn?: boolean;
  isBn?: boolean;
}

const getIconForType = (type: PlaceType) => {
  switch (type) {
    case 'market':
      return Store;
    case 'bazar':
      return Store;
    case 'shopping_mall':
      return Building2;
    case 'local_shop':
      return ShoppingBag;
    case 'landmark':
      return Compass;
    case 'village':
      return MapPin;
    default:
      return Layers;
  }
};

export const LocalAddressSearchDropdown: React.FC<LocalAddressSearchDropdownProps> = ({
  id = 'local-address-search-input',
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'যেমন: সিংগিয়া বাজার কাঁচাবাজার...',
  divisionName,
  districtName,
  upazilaName,
  unionName,
  wardId,
  placeTypeFilter,
  disabled = false,
  required = false,
  className = '',
  label,
  helperText,
  isBn = true
}) => {
  const { searchLiveSuggestions, places } = useLocalAddressDatabase();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocalAddressSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const results = searchLiveSuggestions(
        value,
        {
          divisionName,
          districtName,
          upazilaName,
          unionName,
          wardId,
          placeType: placeTypeFilter
        },
        8
      );
      setSuggestions(results);
      setSelectedIndex(-1);
    }, 150);

    return () => clearTimeout(timer);
  }, [value, isOpen, divisionName, districtName, upazilaName, unionName, wardId, placeTypeFilter, searchLiveSuggestions]);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LocalAddressSuggestion) => {
    onChange(item.placeName);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearInput = () => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
          {unionName && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {unionName}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-3.5 py-2.5 pl-9 pr-8 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400 disabled:opacity-60 disabled:cursor-not-allowed"
        />

        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
          <Search className="w-4 h-4 text-neutral-400" />
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
          {helperText}
        </p>
      )}

      {/* Suggestion Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/80 dark:bg-neutral-800/40 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>লেভেল ২ লোকাল এড্রেস সার্চ সাজেশন</span>
            </span>
            <span>
              {unionName ? `${unionName} ইউনিয়ন` : upazilaName ? `${upazilaName} উপজেলা` : 'সার্চ ফলাফল'}
            </span>
          </div>

          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((item, idx) => {
                const typeConfig = PLACE_TYPE_CONFIGS[item.placeType] || PLACE_TYPE_CONFIGS.other;
                const IconComponent = getIconForType(item.placeType);
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={item.placeId}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer border-b border-neutral-100/60 dark:border-neutral-800/40 last:border-0 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg border ${typeConfig.badgeBorder} ${typeConfig.bgLight} ${typeConfig.bgDark} ${typeConfig.color} shrink-0`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs truncate text-neutral-900 dark:text-white">
                          {item.placeName}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${typeConfig.badgeBorder} ${typeConfig.bgLight} ${typeConfig.bgDark} ${typeConfig.color} whitespace-nowrap`}>
                          {item.placeTypeLabelBn}
                        </span>
                      </div>

                      <div className="text-[10.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        {item.wardName && (
                          <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1 py-0.2 rounded font-medium">
                            {item.wardName}
                          </span>
                        )}
                        {item.villageArea && (
                          <span className="truncate">
                            {item.villageArea}
                          </span>
                        )}
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-400 font-mono text-[9.5px]">
                          {item.placeId}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
              {value ? (
                <>
                  <p className="font-medium text-neutral-700 dark:text-neutral-300">
                    '{value}' নামে ডাটাবেজে কোনো রেকর্ড পাওয়া যায়নি
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    সরাসরি টাইপ করে ব্যবহার করতে পারেন অথবা সুপার এডমিন থেকে এই ইউনিয়ন বা স্থান যুক্ত করুন।
                  </p>
                </>
              ) : (
                <p>টাইপ করুন বা তালিকা থেকে বাছাই করুন</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
