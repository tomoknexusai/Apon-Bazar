/**
 * Language Switcher Component (Bangla & English)
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-1.5" />
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === 'bn'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === 'en'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        English
      </button>
    </div>
  );
};
