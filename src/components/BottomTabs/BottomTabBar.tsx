import React from 'react';
import { FileText, FileSpreadsheet, Users, Package, Settings } from 'lucide-react';

export type TabType = 'invoices' | 'quotes' | 'clients' | 'articles' | 'settings';

interface BottomTabBarProps {
  activeTab?: TabType;
  currentTab?: TabType;
  onTabChange: (tab: TabType) => void;
  invoicesCount?: number;
  quotesCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  currentTab,
  onTabChange,
}) => {
  const current = activeTab || currentTab || 'invoices';

  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    {
      id: 'invoices',
      label: 'Factures',
      icon: FileText,
    },
    {
      id: 'quotes',
      label: 'Devis',
      icon: FileSpreadsheet,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
    },
    {
      id: 'articles',
      label: 'Articles',
      icon: Package,
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
    },
  ];

  return (
    <nav className="w-full shrink-0 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around z-30 select-none pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all duration-150 ease-out active:scale-95 relative cursor-pointer ${
              isActive ? 'text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Icon className={`w-4 h-4 mb-1 transition-transform duration-150 ${isActive ? 'stroke-[2.2px] text-slate-900 scale-105' : 'stroke-[1.75px]'}`} />
            <span className={`text-[11px] leading-tight tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5 animate-fade-in-fast" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
