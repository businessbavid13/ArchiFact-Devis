import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MobileStatusBar } from '../components/StatusBar/MobileStatusBar';
import { AppHeader } from '../components/Header/AppHeader';
import { BottomTabBar, TabType } from '../components/BottomTabs/BottomTabBar';
import { PhotoScanModal } from '../components/PhotoScanModal/PhotoScanModal';
import { CreditsModal } from '../components/CreditsModal/CreditsModal';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal/DocumentPreviewModal';
import { AppProvider, useAppContext } from './AppContext';
import { Invoice, Quote } from '../types';

/**
 * Maps URL pathname to the active BottomTab
 */
function pathToTab(pathname: string): TabType {
  if (pathname.startsWith('/quotes')) return 'quotes';
  if (pathname.startsWith('/articles')) return 'articles';
  if (pathname.startsWith('/clients')) return 'clients';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'invoices'; // default & /invoices
}

/**
 * Maps a TabType to the corresponding base route
 */
function tabToPath(tab: TabType): string {
  switch (tab) {
    case 'invoices': return '/invoices';
    case 'quotes': return '/quotes';
    case 'articles': return '/articles';
    case 'clients': return '/clients';
    case 'settings': return '/settings';
  }
}

/**
 * Inner layout that accesses AppContext
 */
function AppLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useAppContext();

  const activeTab = pathToTab(location.pathname);

  const handleTabChange = (tab: TabType) => {
    navigate(tabToPath(tab));
  };

  // Resolve header props based on current route
  const getHeaderProps = () => {
    const path = location.pathname;

    if (path.startsWith('/invoices/') && path !== '/invoices') {
      return {
        title: 'Facture',
        showBack: true,
        onBack: () => navigate('/invoices'),
      };
    }
    if (path.startsWith('/quotes/') && path !== '/quotes') {
      return {
        title: 'Devis',
        showBack: true,
        onBack: () => navigate('/quotes'),
      };
    }
    if (path === '/settings/customization') {
      return {
        title: 'Personnalisation',
        showClose: true,
        onClose: () => navigate('/settings'),
      };
    }

    switch (activeTab) {
      case 'invoices':
        return {
          title: 'Factures',
          subtitle: `${ctx.invoices.length} document${ctx.invoices.length > 1 ? 's' : ''}`,
        };
      case 'quotes':
        return {
          title: 'Devis',
          subtitle: `${ctx.quotes.length} document${ctx.quotes.length > 1 ? 's' : ''}`,
        };
      case 'articles':
        return {
          title: 'Articles & Services',
          subtitle: `${ctx.articles.length} article${ctx.articles.length > 1 ? 's' : ''}`,
        };
      case 'clients':
        return {
          title: 'Clients',
          subtitle: `${ctx.clients.length} contact${ctx.clients.length > 1 ? 's' : ''}`,
        };
      case 'settings':
        return {
          title: 'Paramètres',
          subtitle: ctx.settings.name,
        };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-4 select-none font-sans text-slate-800">
      <div className="w-full sm:max-w-[420px] h-screen sm:h-[860px] bg-white sm:rounded-[44px] shadow-2xl overflow-hidden flex flex-col relative sm:border-[8px] sm:border-slate-800/90">
        <MobileStatusBar />

        <AppHeader
          {...headerProps}
          credits={ctx.credits}
          onCreditsClick={() => ctx.setIsCreditsModalOpen(true)}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Outlet />
        </main>

        <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Global Modals */}
        <PhotoScanModal
          isOpen={ctx.isPhotoScanOpen}
          onClose={() => ctx.setIsPhotoScanOpen(false)}
          documentType={ctx.photoScanTarget}
          creditsBalance={ctx.credits}
          onReserveCredits={async () => {
            const operation = ctx.photoScanTarget === 'quote'
              ? 'AI_QUOTE_FROM_IMAGE'
              : ctx.photoScanTarget === 'invoice'
                ? 'AI_INVOICE_FROM_IMAGE'
                : 'AI_ARTICLE_FROM_IMAGE';
            return ctx.reserveCredits(operation);
          }}
          onCompleteReservation={ctx.completeCreditReservation}
          onRefundReservation={ctx.refundCreditReservation}
          onAnalyzeImages={ctx.analyzeImages}
          onOpenCreditStore={() => {
            ctx.setIsPhotoScanOpen(false);
            ctx.setIsCreditsModalOpen(true);
          }}
          onExtracted={ctx.handlePhotoScanExtracted}
        />

        <CreditsModal
          isOpen={ctx.isCreditsModalOpen}
          onClose={() => ctx.setIsCreditsModalOpen(false)}
          currentCredits={ctx.credits}
          plans={ctx.creditPlans}
          onCreatePayment={ctx.createPayment}
        />

        {ctx.previewData && (
          <DocumentPreviewModal
            isOpen={!!ctx.previewData}
            onClose={() => ctx.setPreviewData(null)}
            onUpdateSettings={ctx.updateSettings}
            {...ctx.previewData}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Root layout wrapping everything with AppProvider + Router outlet.
 * AppProvider needs navigate for photo scan redirects, so we wrap it here.
 */
export function AppLayout() {
  const navigate = useNavigate();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  return (
    <AppProvider
      onEditInvoice={(inv) => setEditingInvoice(inv)}
      onEditQuote={(quo) => setEditingQuote(quo)}
      onNavigate={(path) => navigate(path)}
    >
      <EditingContext.Provider value={{ editingInvoice, setEditingInvoice, editingQuote, setEditingQuote }}>
        <AppLayoutInner />
      </EditingContext.Provider>
    </AppProvider>
  );
}

// ── Editing Context (for passing scan-created docs to form screens) ──
interface EditingContextType {
  editingInvoice: Invoice | null;
  setEditingInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  editingQuote: Quote | null;
  setEditingQuote: React.Dispatch<React.SetStateAction<Quote | null>>;
}

const EditingContext = React.createContext<EditingContextType>({
  editingInvoice: null,
  setEditingInvoice: () => {},
  editingQuote: null,
  setEditingQuote: () => {},
});

export function useEditingContext() {
  return React.useContext(EditingContext);
}
