import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceFormPage } from './pages/InvoiceFormPage';
import { QuotesPage } from './pages/QuotesPage';
import { QuoteFormPage } from './pages/QuoteFormPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ClientsPage } from './pages/ClientsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomizationPage } from './pages/CustomizationPage';
import { HomePage } from './pages/HomePage';

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
      { index: true, element: <HomePage /> },

      // Invoices
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'invoices/new', element: <InvoiceFormPage /> },
      { path: 'invoices/:id', element: <InvoiceFormPage /> },

      // Quotes
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'quotes/new', element: <QuoteFormPage /> },
      { path: 'quotes/:id', element: <QuoteFormPage /> },

      // Articles
      { path: 'articles', element: <ArticlesPage /> },

      // Clients
      { path: 'clients', element: <ClientsPage /> },

      // Settings
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/customization', element: <CustomizationPage /> },

      // Catch-all
      { path: '*', element: <Navigate to="/invoices" replace /> },
    ],
  },
]);
