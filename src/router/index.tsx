import { createHashRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { AppLayout } from './AppLayout';

const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then(({ InvoicesPage }) => ({ default: InvoicesPage })));
const InvoiceFormPage = lazy(() => import('./pages/InvoiceFormPage').then(({ InvoiceFormPage }) => ({ default: InvoiceFormPage })));
const QuotesPage = lazy(() => import('./pages/QuotesPage').then(({ QuotesPage }) => ({ default: QuotesPage })));
const QuoteFormPage = lazy(() => import('./pages/QuoteFormPage').then(({ QuoteFormPage }) => ({ default: QuoteFormPage })));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage').then(({ ArticlesPage }) => ({ default: ArticlesPage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(({ ClientsPage }) => ({ default: ClientsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(({ SettingsPage }) => ({ default: SettingsPage })));
const CustomizationPage = lazy(() => import('./pages/CustomizationPage').then(({ CustomizationPage }) => ({ default: CustomizationPage })));
const HomePage = lazy(() => import('./pages/HomePage').then(({ HomePage }) => ({ default: HomePage })));

function RouteFallback() {
  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Chargement...</div>;
}

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

/**
 * Application router configuration.
 * Uses HashRouter for SPA compatibility without server-side routing config.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Default redirect
      { index: true, element: lazyRoute(<HomePage />) },

      // Invoices
      { path: 'invoices', element: lazyRoute(<InvoicesPage />) },
      { path: 'invoices/new', element: lazyRoute(<InvoiceFormPage />) },
      { path: 'invoices/:id', element: lazyRoute(<InvoiceFormPage />) },

      // Quotes
      { path: 'quotes', element: lazyRoute(<QuotesPage />) },
      { path: 'quotes/new', element: lazyRoute(<QuoteFormPage />) },
      { path: 'quotes/:id', element: lazyRoute(<QuoteFormPage />) },

      // Articles
      { path: 'articles', element: lazyRoute(<ArticlesPage />) },

      // Clients
      { path: 'clients', element: lazyRoute(<ClientsPage />) },

      // Settings
      { path: 'settings', element: lazyRoute(<SettingsPage />) },
      { path: 'settings/customization', element: lazyRoute(<CustomizationPage />) },

      // Catch-all
      { path: '*', element: <Navigate to="/invoices" replace /> },
    ],
  },
]);
