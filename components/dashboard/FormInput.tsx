import React from 'react';
import type { Vehicle } from '../../types';
import { formatIndianNumberInput, parseIndianNumberDigits } from '../../utils/indianNumberInput.js';
import { HelpTooltip } from './HelpTooltip';

export const FormInput: React.FC<{ label: string; name: keyof Vehicle | 'summary'; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; error?: string; tooltip?: string; required?: boolean; children?: React.ReactNode; disabled?: boolean; placeholder?: string; rows?: number; prefix?: React.ReactNode; suffix?: React.ReactNode; indianNumberFormat?: boolean }> =
  ({ label, name, type = 'text', value, onChange, onBlur, error, tooltip, required = false, children, disabled = false, placeholder, rows, prefix, suffix, indianNumberFormat = false }) => {
  const baseInputClasses = `block w-full p-3 border rounded-lg focus:outline-none transition bg-white text-reride-text-dark disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${error ? 'border-reride-orange' : 'border-gray-200 dark:border-gray-300 hover:border-gray-300'}`;
  const focusOn = (e: React.FocusEvent<HTMLElement>) => !error && (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.15)');
  const focusOff = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget.style.boxShadow = '');
  const inputType = indianNumberFormat ? 'text' : type;
  const displayValue = indianNumberFormat ? formatIndianNumberInput(value) : value;
  const handleFormattedNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = parseIndianNumberDigits(e.target.value);
    onChange({
      ...e,
      target: { ...e.target, name: e.target.name, value: digits },
    } as React.ChangeEvent<HTMLInputElement>);
  };
  return (
  <div>
    <label htmlFor={String(name)} className="flex items-center text-sm font-medium text-reride-text-dark mb-1">
        {label}{required && <span className="text-reride-orange ml-0.5">*</span>}
        {tooltip && <HelpTooltip text={tooltip} />}
    </label>
    {type === 'select' ? (
        <select id={String(name)} name={String(name)} value={String(value)} onChange={onChange} required={required} disabled={disabled} className={baseInputClasses} onFocus={focusOn} onBlur={focusOff}>
            {children}
        </select>
    ) : type === 'textarea' ? (
        <textarea id={String(name)} name={String(name)} value={String(value)} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder} rows={rows} className={baseInputClasses} onFocus={focusOn} onBlur={focusOff} />
    ) : (
        <div className="relative">
            {prefix && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 text-sm font-semibold">
                    {prefix}
                </span>
            )}
            <input
                type={inputType}
                id={String(name)}
                name={String(name)}
                value={displayValue}
                onChange={indianNumberFormat ? handleFormattedNumberChange : onChange}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                inputMode={indianNumberFormat ? 'numeric' : undefined}
                className={`${baseInputClasses} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''}`}
                onFocus={focusOn}
                onBlur={(e) => { focusOff(e); if (onBlur) onBlur(e); }}
            />
            {suffix && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-xs">
                    {suffix}
                </span>
            )}
        </div>
    )}
    {error && (
        <p className="mt-1 text-xs text-reride-orange flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
        </p>
    )}
  </div>
  );
};
