import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  suffix?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon: Icon,
  error,
  suffix,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold tracking-tight text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full min-h-[44px] bg-white border border-slate-200 rounded-md py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all duration-150 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${suffix ? 'pr-12' : 'pr-3.5'} ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
