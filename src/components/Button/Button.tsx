import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'teal' | 'outline' | 'ghost' | 'danger' | 'amber' | 'inverse' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  fullWidth?: boolean;
  pill?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  fullWidth = false,
  pill = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-sm px-5 py-3 gap-2.5 min-h-[48px]',
  };

  const roundedStyles = pill ? 'rounded-full' : 'rounded-md';

  const variantStyles = {
    primary: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-2xs border border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-200/80 text-slate-800 border border-slate-200',
    teal: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-2xs border border-transparent',
    amber: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-2xs border border-transparent',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 shadow-2xs',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
    inverse: 'bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 shadow-sm border border-transparent',
    glass: 'bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/15',
    danger: 'bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-600 border border-rose-200',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${roundedStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  );
};
