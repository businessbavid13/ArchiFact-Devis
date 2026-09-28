import React from 'react';
import { Wifi, Signal, Battery } from 'lucide-react';

interface MobileStatusBarProps {
  dark?: boolean;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({ dark = false }) => {
  const textColor = dark ? 'text-white' : 'text-slate-800';

  return (
    <div className={`w-full px-5 pt-2 pb-1.5 flex items-center justify-between text-xs font-semibold tracking-tight ${textColor} select-none transition-colors lg:hidden`}>
      <span className="font-bold text-[13px] tracking-tight">09:20</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold tracking-widest mr-0.5">4G</span>
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-0.5">
          <Battery className="w-4 h-4" />
          <span className="text-[10px] font-bold">98%</span>
        </div>
      </div>
    </div>
  );
};
