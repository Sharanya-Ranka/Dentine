// src/components/ComboboxSelector.tsx
import React, { useState, useRef, useEffect } from 'react';

interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface ComboboxSelectorProps {
  label: string;
  placeholder?: string;
  options: ComboboxOption[];
  valueId: string | null;
  onSelect: (option: ComboboxOption) => void;
  required?: boolean;
}

export const ComboboxSelector: React.FC<ComboboxSelectorProps> = ({
  label,
  placeholder = 'Type to search...',
  options,
  valueId,
  onSelect,
  required = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync display text with external selection
  useEffect(() => {
    const selected = options.find((opt) => opt.id === valueId);
    if (selected) {
      setSearchTerm(selected.label);
    } else if (!valueId) {
      setSearchTerm('');
    }
  }, [valueId, options]);

  // Substring matching (case-insensitive)
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={wrapperRef}>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="absolute top-[100%] z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">No matches found</div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                type="button"
                key={opt.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex justify-between items-center text-slate-700"
                onClick={() => {
                  onSelect(opt);
                  setSearchTerm(opt.label);
                  setIsOpen(false);
                }}
              >
                <span className="font-medium">{opt.label}</span>
                {opt.sublabel && (
                  <span className="text-xs text-slate-400 ml-2">{opt.sublabel}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};