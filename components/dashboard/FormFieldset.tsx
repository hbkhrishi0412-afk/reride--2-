import React, { useState } from 'react';

export const FormFieldset: React.FC<{
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    description?: string;
    step?: number;
    defaultOpen?: boolean;
    actions?: React.ReactNode;
}> = ({ title, children, icon, description, step, defaultOpen = true, actions }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <header
                className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isOpen}
            >
                {step !== undefined && (
                    <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8456 100%)' }}
                    >
                        {step}
                    </span>
                )}
                {icon && step === undefined && (
                    <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-reride-orange-light text-reride-orange">
                        {icon}
                    </span>
                )}
                <div className="flex-grow min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-reride-text-dark leading-tight">{title}</h3>
                    {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>}
                </div>
                {actions && (
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        {actions}
                    </div>
                )}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </header>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 border-t border-gray-100">{children}</div>
                </div>
            </div>
        </section>
    );
};
