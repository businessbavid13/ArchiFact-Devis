import React from 'react';
import { FileText, FileSpreadsheet, Home, Package, Settings, ShieldCheck, Users } from 'lucide-react';
import { TabType } from '../BottomTabs/BottomTabBar';

interface SidebarNavProps {
  activeTab: TabType;
  onNavigate: (path: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onNavigate }) => {
  const items: Array<{ path: string; label: string; id: TabType; icon: React.ComponentType<{ className?: string }> }> = [
    { path: '/', label: 'Accueil', id: 'home', icon: Home },
    { path: '/invoices', label: 'Factures', id: 'invoices', icon: FileText },
    { path: '/quotes', label: 'Devis', id: 'quotes', icon: FileSpreadsheet },
    { path: '/clients', label: 'Clients', id: 'clients', icon: Users },
    { path: '/articles', label: 'Articles & Services', id: 'articles', icon: Package },
    { path: '/settings', label: 'Paramètres', id: 'settings', icon: Settings },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <img src="/branding/archifact-horizontal.png" alt="ArchiFact" className="h-9 w-auto max-w-[160px] object-contain object-left" />
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Navigation principale">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Espace sécurisé
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Vos données sont réservées à votre compte et synchronisées automatiquement.
        </p>
      </div>
    </aside>
  );
};
