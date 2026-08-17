'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  id: string | number;
  label: string;
  subLabel?: string;
  numericValue?: number;
}

export function formatVNDInput(value: string | number): string {
  const rawDigits = String(value).replace(/\D/g, '');
  if (!rawDigits) return '';
  return Number(rawDigits).toLocaleString('vi-VN').replace(/,/g, '.');
}

export function parseVNDInput(formattedValue: string | number): number {
  const rawDigits = String(formattedValue).replace(/\D/g, '');
  return Number(rawDigits) || 0;
}

interface SearchableSelectProps {
  label: string;
  options: SelectOption[];
  selectedId: string | number;
  onSelect: (option: SelectOption) => void;
  customValue?: string;
  onCustomValueChange?: (val: string) => void;
  placeholder?: string;
  customPlaceholder?: string;
  otherOptionId?: string | number;
  isCurrencyFormat?: boolean;
}

export function SearchableSelect({
  label,
  options,
  selectedId,
  onSelect,
  customValue = '',
  onCustomValueChange,
  placeholder = 'Tìm kiếm hoặc chọn...',
  customPlaceholder = 'Nhập thông tin tùy chỉnh...',
  otherOptionId = 'OTHER',
  isCurrencyFormat = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === selectedId) || options[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isOtherSelected = selectedId === otherOptionId;

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>

      {/* Select Display Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 transition-all text-left shadow-2xs cursor-pointer focus:outline-none focus:border-primary-600"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-primary-600' : ''
          }`}
        />
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1.5 animate-in fade-in duration-150 max-h-64 flex flex-col">
          {/* Search Box */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-600 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelect(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-[10px] text-slate-400 font-normal truncate">{opt.subLabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy kết quả phù hợp
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Input Field when "Khác" is selected */}
      {isOtherSelected && onCustomValueChange && (
        <div className="mt-2 animate-in fade-in duration-150">
          <input
            type="text"
            value={customValue}
            onChange={(e) => {
              if (isCurrencyFormat) {
                const formatted = formatVNDInput(e.target.value);
                onCustomValueChange(formatted);
              } else {
                onCustomValueChange(e.target.value);
              }
            }}
            placeholder={customPlaceholder}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-primary-600 focus:bg-white transition-all shadow-2xs"
          />
        </div>
      )}
    </div>
  );
}
