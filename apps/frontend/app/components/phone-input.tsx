import { useState, useRef, useEffect } from "react";

interface Country {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
  { code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "BR", dialCode: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", dialCode: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "JP", dialCode: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "CN", dialCode: "+86", name: "China", flag: "🇨🇳" },
  { code: "KR", dialCode: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "ZA", dialCode: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "NG", dialCode: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", dialCode: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "PK", dialCode: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "BD", dialCode: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "PH", dialCode: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", dialCode: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "VN", dialCode: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "TH", dialCode: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "MY", dialCode: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "NZ", dialCode: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", dialCode: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", dialCode: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "DK", dialCode: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", dialCode: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "PL", dialCode: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "TR", dialCode: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "EG", dialCode: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "AR", dialCode: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", dialCode: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "CO", dialCode: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", dialCode: "+51", name: "Peru", flag: "🇵🇪" },
].sort((a, b) => a.name.localeCompare(b.name));

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (dialCode: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  defaultCountry?: string;
}

export function PhoneInput({
  value,
  onChange,
  onCountryChange,
  id = "phone",
  className = "",
  placeholder = "+1234567890",
  autoComplete = "tel",
  inputRef,
  defaultCountry = "+91",
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    return COUNTRIES.find((c) => c.dialCode === defaultCountry) || COUNTRIES[0];
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract country code from value if it starts with +
  useEffect(() => {
    if (value.startsWith("+")) {
      const matchingCountry = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (matchingCountry && matchingCountry.code !== selectedCountry.code) {
        setSelectedCountry(matchingCountry);
        const number = value.slice(matchingCountry.dialCode.length).trim();
        onChange(number);
        onCountryChange?.(matchingCountry.dialCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    onCountryChange?.(country.dialCode);
    // Keep the number part, just update the dial code
    const number = value.replace(/^\+?\d+\s*/, "").trim();
    onChange(number);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, "");
    onChange(number);
  };

  const fullPhoneNumber = selectedCountry.dialCode + (value || "");

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-neutral-900 bg-white px-3 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Select country"
            aria-expanded={isOpen}
          >
            <span className="text-xl" aria-hidden>
              {selectedCountry.flag}
            </span>
            <span className="font-mono text-sm">{selectedCountry.dialCode}</span>
            <svg
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 font-['Satoshi'] text-sm hover:bg-purple-50 ${
                    selectedCountry.code === country.code ? "bg-purple-100 font-medium" : ""
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {country.flag}
                  </span>
                  <span className="flex-1 text-left">{country.name}</span>
                  <span className="font-mono text-neutral-600">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="tel"
          id={id}
          value={value}
          onChange={handleNumberChange}
          placeholder={placeholder.replace(/^\+?\d+/, "").trim() || "1234567890"}
          className={`flex-1 ${className}`}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}
