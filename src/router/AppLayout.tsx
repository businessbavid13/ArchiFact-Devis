import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MobileStatusBar } from '../components/StatusBar/MobileStatusBar';
import { AppHeader } from '../components/Header/AppHeader';
import { BottomTabBar, TabType } from '../components/BottomTabs/BottomTabBar';
import { SidebarNav } from '../components/Sidebar/SidebarNav';
import { AppProvider, useAppContext } from './AppContext';
import { Invoice, Quote } from '../types';

const PhotoScanModal = lazy(() =>
  import('../components/PhotoScanModal/PhotoScanModal').then(({ PhotoScanModal }) => ({ default: PhotoScanModal }))
);
const CreditsModal = lazy(() =>
  import('../components/CreditsModal/CreditsModal').then(({ CreditsModal }) => ({ default: CreditsModal }))
);
const DocumentPreviewModal = lazy(() =>
  import('../components/DocumentPreviewModal/DocumentPreviewModal').then(({ DocumentPreviewModal }) => ({ default: DocumentPreviewModal }))
);

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

  useEffect(() => {
    ctx.setIsPhotoScanOpen(false);
    ctx.setIsCreditsModalOpen(false);
    ctx.setPreviewData(null);
  }, [location.pathname]);

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
    if (path === '/') {
      return {
        title: 'Accueil',
        subtitle: 'Votre activité en un coup d’œil',
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
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-0 sm:p-4 select-none font-sans text-slate-800">
      <div className="w-full min-h-[100dvh] bg-white shadow-2xl overflow-hidden flex flex-col relative sm:max-w-[560px] sm:min-h-0 sm:h-[calc(100dvh-2rem)] sm:rounded-[32px] lg:max-w-none lg:h-[calc(100dvh-2rem)] lg:rounded-none lg:overflow-visible">
        <MobileStatusBar />

        <div className="flex min-h-0 flex-1">
          <SidebarNav
            activeTab={activeTab}
            isHome={location.pathname === '/'}
            onNavigate={navigate}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader
              {...headerProps}
              credits={ctx.credits}
              onCreditsClick={() => ctx.setIsCreditsModalOpen(true)}
            />

            <main className="flex-1 flex flex-col overflow-hidden relative">
              <Outlet />
            </main>

            <div className="lg:hidden">
              <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
          </div>
        </div>

        {/* Global Modals */}
        <Suspense fallback={null}>
        {ctx.isPhotoScanOpen && (
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
        )}

        {ctx.isCreditsModalOpen && (
        <CreditsModal
          isOpen={ctx.isCreditsModalOpen}
          onClose={() => ctx.setIsCreditsModalOpen(false)}
          currentCredits={ctx.credits}
          plans={ctx.creditPlans}
          isLoading={ctx.creditsLoading}
          loadError={ctx.creditsError}
          onCreatePayment={ctx.createPayment}
        />
        )}

        {ctx.previewData && (
          <DocumentPreviewModal
            isOpen={!!ctx.previewData}
            onClose={() => ctx.setPreviewData(null)}
            onUpdateSettings={ctx.updateSettings}
            {...ctx.previewData}
          />
        )}
        </Suspense>
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
