import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpTooltip } from './HelpTooltip';

// Combobox component for Make, Model, and Variant fields
export const ComboboxInput: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  tooltip?: string;
}> = ({ label, name, value, onChange, options, placeholder, error, required = false, disabled = false, tooltip }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filter options based on input
  useEffect(() => {
    if (!inputValue || inputValue.trim() === '') {
      setFilteredOptions(safeOptions);
    } else {
      const filtered = safeOptions.filter(opt => 
        opt && typeof opt === 'string' && opt.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, safeOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newValue = e.target.value || '';
      setInputValue(newValue);
      setIsOpen(true);
      onChange(e);
    } catch (error) {
      console.error('Error in handleInputChange:', error);
    }
  };

  const handleSelectOption = (option: string) => {
    if (!option || typeof option !== 'string') return;
    setInputValue(option);
    setIsOpen(false);
    // Create synthetic event for onChange
    try {
      // Create a minimal event object that handleChange expects
      const syntheticEvent = {
        target: {
          name,
          value: option
        } as HTMLInputElement,
        currentTarget: inputRef.current
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error in handleSelectOption:', error);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (e.key === 'ArrowDown' && Array.isArray(filteredOptions) && filteredOptions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'Enter' && isOpen && Array.isArray(filteredOptions) && filteredOptions.length > 0 && filteredOptions[0]) {
        e.preventDefault();
        handleSelectOption(filteredOptions[0]);
      }
    } catch (error) {
      console.error('Error in handleInputKeyDown:', error);
    }
  };

  // Safety check - ensure we have valid data before rendering
  if (typeof name !== 'string' || name.length === 0) {
    console.error('ComboboxInput: Invalid name prop');
    return null;
  }

  return (
    <div className="relative">
      <label htmlFor={name} className="flex items-center text-sm font-medium text-reride-text-dark mb-1">
        {label}{required && <span className="text-reride-orange ml-0.5">*</span>}
        {tooltip && <HelpTooltip text={tooltip} />}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={name}
          name={name}
          value={inputValue || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`block w-full p-3 pr-10 border rounded-lg focus:outline-none transition bg-white text-reride-text-dark disabled:bg-white dark:disabled:bg-white ${error ? 'border-reride-orange' : 'border-gray-200 dark:border-gray-300'}`}
          style={!error ? { boxShadow: 'none' } : {}}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isOpen && !disabled && Array.isArray(filteredOptions) && filteredOptions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {filteredOptions.slice(0, 10).map((option, index) => {
              if (!option || typeof option !== 'string') return null;
              return (
                <button
                  key={option || `option-${index}`}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                >
                  {option}
                </button>
              );
            })}
            {filteredOptions.length > 10 && (
              <div className="px-4 py-2 text-xs text-gray-500 text-center">
                {t('sellerDashboard.comboboxMoreOptions', {
                  count: filteredOptions.length - 10,
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-reride-orange">{error}</p>}
    </div>
  );
};
