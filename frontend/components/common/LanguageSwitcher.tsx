'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface LanguageOption {
  code: Locale;
  label: string;
  shortLabel: string;
  flagSrc: string;
}

const languages: LanguageOption[] = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    shortLabel: 'VIE',
    flagSrc: '/vietnam.webp',
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'ENG',
    flagSrc: '/english.svg',
  },
  {
    code: 'zh',
    label: '中文 (简体)',
    shortLabel: 'CHS',
    flagSrc: '/china.jpg',
  },
];

// Pure browser cookie set — no js-cookie dependency
function setLocaleCookie(locale: string) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
  document.cookie = `NEXT_LOCALE=${locale}; expires=${expires}; path=/; SameSite=Lax`;
}

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((lang) => lang.code === currentLocale) || languages[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    setIsOpen(false);
    if (newLocale === currentLocale) return;

    setLocaleCookie(newLocale);

    if (typeof window !== 'undefined' && window.__changeGoogleLanguage) {
      window.__changeGoogleLanguage(newLocale);
    }

    const segments = pathname.split('/');
    if (['en', 'vi', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.unshift('', newLocale);
    }
    const newPath = segments.join('/') || `/${newLocale}`;
    window.location.href = newPath;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-800 transition-all shadow-2xs"
      >
        <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-300">
          <Image
            src={currentLang.flagSrc}
            alt={currentLang.label}
            fill
            className="object-cover"
          />
        </div>
        <span>{currentLang.shortLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Chọn ngôn ngữ
          </div>

          <div className="p-1 space-y-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === currentLocale;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-primary-50 text-primary-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                      <Image
                        src={lang.flagSrc}
                        alt={lang.label}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
