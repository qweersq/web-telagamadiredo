import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

export const CUSTOM_COUNTRY = { flag: '🌐', name: 'Lainnya', dial: '', minLen: 5, maxLen: 15, isCustom: true };

export const COUNTRY_CODES = [
  { flag: '🇮🇩', name: 'Indonesia', dial: '+62', minLen: 7, maxLen: 12 },
  { flag: '🇲🇾', name: 'Malaysia', dial: '+60', minLen: 7, maxLen: 11 },
  { flag: '🇸🇬', name: 'Singapore', dial: '+65', minLen: 8, maxLen: 8 },
  { flag: '🇦🇺', name: 'Australia', dial: '+61', minLen: 9, maxLen: 9 },
  { flag: '🇸🇦', name: 'Arab Saudi', dial: '+966', minLen: 9, maxLen: 9 },
  { flag: '🇦🇪', name: 'UAE', dial: '+971', minLen: 9, maxLen: 9 },
  { flag: '🇺🇸', name: 'USA / Canada', dial: '+1', minLen: 10, maxLen: 10 },
  { flag: '🇬🇧', name: 'UK', dial: '+44', minLen: 10, maxLen: 10 },
  { flag: '🇯🇵', name: 'Japan', dial: '+81', minLen: 10, maxLen: 10 },
  { flag: '🇳🇱', name: 'Netherlands', dial: '+31', minLen: 9, maxLen: 9 },
];

export const parsePhoneValue = (rawPhone) => {
  if (!rawPhone) return { country: COUNTRY_CODES[0], local: '', customDial: '' };

  const normalized = rawPhone.trim();
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);

  if (normalized.startsWith('+')) {
    for (const c of sorted) {
      if (normalized.startsWith(c.dial)) {
        return { country: c, local: normalized.slice(c.dial.length), customDial: '' };
      }
    }
    // No match in list → treat as custom
    const match = normalized.match(/^(\+\d{1,4})(.*)/);
    if (match) {
      return { country: CUSTOM_COUNTRY, local: match[2].replace(/\D/g, ''), customDial: match[1] };
    }
  }

  for (const c of sorted) {
    const dialDigits = c.dial.replace('+', '');
    if (normalized.startsWith(dialDigits)) {
      return { country: c, local: normalized.slice(dialDigits.length), customDial: '' };
    }
  }

  if (normalized.startsWith('0')) {
    return { country: COUNTRY_CODES[0], local: normalized.slice(1), customDial: '' };
  }

  return { country: COUNTRY_CODES[0], local: normalized.replace(/\D/g, ''), customDial: '' };
};

export const validatePhoneInput = (localPhone, country, customDial = '') => {
  if (!localPhone || !localPhone.trim()) return 'Nomor telepon wajib diisi';
  if (country.isCustom && !customDial) return 'Kode negara wajib diisi';
  if (localPhone.length < country.minLen) return `Nomor terlalu pendek (min ${country.minLen} digit)`;
  if (localPhone.length > country.maxLen) return `Nomor terlalu panjang (maks ${country.maxLen} digit)`;
  return null;
};

/**
 * PhoneInputWithCountry
 *
 * Props:
 *   value      – full phone string e.g. "+628123456789" or "08123456789"
 *   onChange   – (fullPhone: string) => void  — called with "+628123456789"
 *   error      – string | null
 *   disabled   – bool
 *   label      – string (default "Nomor Telepon")
 *   required   – bool
 *   showLabel  – bool (default true)
 *   className  – extra class on wrapper div
 */
const PhoneInputWithCountry = ({
  value = '',
  onChange,
  error,
  disabled = false,
  label = 'Nomor Telepon',
  required = false,
  showLabel = true,
  className = '',
}) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [customDial, setCustomDial] = useState('');
  const dropdownRef = useRef(null);
  const customDialRef = useRef(null);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const { country, local, customDial: cd } = parsePhoneValue(value);
    setSelectedCountry(country);
    setLocalPhone(local);
    setCustomDial(cd || '');
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const effectiveDial = selectedCountry.isCustom ? customDial : selectedCountry.dial;

  const handlePhoneChange = (raw) => {
    let digits = raw.replace(/\D/g, '');
    if (!selectedCountry.isCustom) {
      const dialDigits = selectedCountry.dial.replace('+', '');
      if (digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length);
      if (selectedCountry.dial === '+62' && digits.startsWith('0')) digits = digits.slice(1);
    }
    setLocalPhone(digits);
    if (onChange) onChange(`${effectiveDial}${digits}`);
  };

  const handleCountryChange = (country) => {
    skipSyncRef.current = true;
    setSelectedCountry(country);
    setShowDropdown(false);
    if (country.isCustom) {
      setCustomDial('+');
      if (onChange) onChange(`+${localPhone}`);
      setTimeout(() => customDialRef.current?.focus(), 50);
    } else {
      let digits = localPhone;
      if (country.dial === '+62' && digits.startsWith('0')) digits = digits.slice(1);
      if (onChange) onChange(`${country.dial}${digits}`);
    }
  };

  const handleCustomDialChange = (raw) => {
    let val = raw.replace(/[^\d+]/g, '');
    if (val && !val.startsWith('+')) val = '+' + val;
    setCustomDial(val);
    if (onChange) onChange(`${val}${localPhone}`);
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 font-montserrat">
          <Phone className="w-4 h-4" />
          {label}{required && ' *'}
        </label>
      )}

      <div className={`flex border rounded-xl overflow-visible bg-white transition-all ${error ? 'border-red-300' : 'border-gray-200 focus-within:border-blue-400'}`}>
        {/* Country selector */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          {selectedCountry.isCustom ? (
            <div className="flex items-center border-r border-gray-200 h-full">
              <span className="pl-3 text-base">{CUSTOM_COUNTRY.flag}</span>
              <input
                ref={customDialRef}
                type="text"
                value={customDial}
                onChange={(e) => handleCustomDialChange(e.target.value)}
                placeholder="+xx"
                disabled={disabled}
                className="w-14 px-2 py-3 text-sm font-semibold font-montserrat text-gray-700 bg-transparent focus:outline-none"
                maxLength={5}
              />
              <button
                type="button"
                onClick={() => setShowDropdown(v => !v)}
                disabled={disabled}
                className="pr-2 hover:bg-gray-50 rounded transition-colors disabled:opacity-60"
              >
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDropdown(v => !v)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-3 text-sm font-montserrat border-r border-gray-200 hover:bg-gray-50 rounded-l-xl transition-colors h-full disabled:opacity-60"
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="text-gray-700 font-semibold text-sm">{selectedCountry.dial}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] min-w-[220px] max-h-60 overflow-y-auto">
              {COUNTRY_CODES.map((c) => (
                <button
                  key={c.dial}
                  type="button"
                  onClick={() => handleCountryChange(c)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors font-montserrat ${!selectedCountry.isCustom && selectedCountry.dial === c.dial ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-gray-400 text-xs">{c.dial}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => handleCountryChange(CUSTOM_COUNTRY)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors font-montserrat ${selectedCountry.isCustom ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
              >
                <span className="text-base">{CUSTOM_COUNTRY.flag}</span>
                <span className="flex-1">{CUSTOM_COUNTRY.name}</span>
                <span className="text-gray-400 text-xs">+...</span>
              </button>
            </div>
          )}
        </div>

        {/* Phone number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={localPhone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            handlePhoneChange(e.clipboardData.getData('text'));
          }}
          className="flex-1 px-3 py-3 bg-transparent focus:outline-none text-sm font-montserrat placeholder-gray-400 disabled:opacity-60"
          placeholder="Contoh: 8123456789"
          disabled={disabled}
          maxLength={selectedCountry.maxLen}
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 font-montserrat">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-400 font-montserrat">
        {selectedCountry.isCustom && customDial === '+'
          ? 'Masukkan kode negara terlebih dahulu'
          : `Disimpan sebagai: ${effectiveDial}${localPhone || 'xxxxxxx'}`}
      </p>
    </div>
  );
};

export default PhoneInputWithCountry;
