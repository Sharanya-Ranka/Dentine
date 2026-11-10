import React, { useState, useRef, useEffect, useId } from 'react';

export interface SearchPickerOption<T = string> {
  value: T;
  label: React.ReactNode;
  searchStr: string;
}

interface SearchPickerProps<T = string> {
  options: SearchPickerOption<T>[];
  value?: T | null;
  onSelect: (value: T, option: SearchPickerOption<T>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchPicker<T = string>({
  options,
  value,
  onSelect,
  placeholder = 'Search...',
  className = '',
  disabled = false,
}: SearchPickerProps<T>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputId = useId();

  // Filter options based on search string
  const filteredOptions = query.trim()
    ? options.filter((opt) =>
        opt.searchStr.toLowerCase().includes(query.toLowerCase().trim())
      )
    : options;

  // Sync displayed query if an option is controlled and matches value
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const match = options.find((opt) => opt.value === value);
      if (match && typeof match.label === 'string') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuery(match.label);
      }
    }
  }, [value, options]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0 && isOpen) {
          const selected = filteredOptions[highlightedIndex];
          onSelect(selected.value, selected);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full text-xs px-3 py-2 pr-8 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg py-1 text-xs"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-slate-400 italic">No matches found</li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = idx === highlightedIndex;
              return (
                <li
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    onSelect(opt.value, opt);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}