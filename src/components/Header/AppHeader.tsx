import React from 'react';
import { ArrowLeft, X, Save, Zap, Sliders, FileText } from 'lucide-react';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showClose?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onSave?: () => void;
  onCustomise?: () => void;
  onOpenCredits?: () => void;
  onCreditsClick?: () => void;
  credits?: number;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'ArchiFact Devis',
  subtitle,
  showBack,
  showClose,
  onBack,
  onClose,
  onSave,
  onCustomise,
  onOpenCredits,
  onCreditsClick,
  credits,
  rightAction,
}) => {
  const handleCredits = onCreditsClick || onOpenCredits;
  const isNavRoot = !showBack && !showClose && !onBack && !onClose;

  return (
    <header className="w-full bg-white text-slate-900 px-3.5 sm:px-4 py-2.5 flex items-center justify-between border-b border-slate-200 relative z-20 min-h-[56px]">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {(showBack || onBack) && (
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 min-w-[40px] min-h-[40px] -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-150 ease-out active:scale-95 flex items-center justify-center"
            aria-label="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        {(showClose || onClose) && (
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-150 ease-out active:scale-95 flex items-center justify-center"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isNavRoot ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 leading-none">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  ArchiFact
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5 leading-tight">
                {title ? `${title} ${subtitle ? `• ${subtitle}` : ''}` : 'Devis & Facturation'}
              </p>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate leading-snug">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate leading-normal">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {credits !== undefined && handleCredits && (
          <button
            type="button"
            onClick={handleCredits}
            className="flex items-center gap-1.5 px-3 min-h-[38px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-all duration-150 ease-out active:scale-95 cursor-pointer"
            title="Gérer les crédits"
          >
            <Zap className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold">{credits}</span>
            <span className="text-slate-500">crédits</span>
          </button>
        )}

        {onCustomise && (
          <button
            type="button"
            onClick={onCustomise}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-150 ease-out active:scale-95"
            title="Personnaliser les documents"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {rightAction}

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 px-3.5 min-h-[38px] bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-md text-xs font-semibold tracking-tight transition-all duration-150 ease-out active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>
        )}
      </div>
    </header>
  );
};
