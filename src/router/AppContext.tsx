import React, { createContext, useContext, useState } from 'react';
import { useInvoices, useQuotes, useArticles, useClients, useSettings, useCredits } from '../hooks';
import { Invoice, Quote, Article, Client, CompanySettings, PhotoScanExtract } from '../types';
import { DocumentPdfData } from '../utils/pdfGenerator';
import { useAuth } from '../auth/AuthContext';

// ── Context Type ──
interface AppContextType {
  // Domain data
  invoices: Invoice[];
  saveInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, newStatus: 'paid' | 'pending' | 'overdue') => void;
  duplicateInvoice: (invoice: Invoice) => void;

  quotes: Quote[];
  saveQuote: (quote: Quote) => void;
  deleteQuote: (id: string) => void;
  duplicateQuote: (quote: Quote) => void;
  updateQuoteStatus: (id: string, newStatus: 'pending' | 'accepted' | 'declined') => void;
  convertQuoteToInvoice: (quote: Quote) => Invoice;

  articles: Article[];
  addArticle: (article: Article) => void;
  updateArticle: (article: Article) => void;
  deleteArticle: (id: string) => void;
  addBulkArticles: (articles: Article[]) => void;

  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  settings: CompanySettings;
  updateSettings: (newVals: Partial<CompanySettings>) => void;

  credits: number;
  plan: string;
  creditPlans: ReturnType<typeof useCredits>['plans'];
  creditsLoading: ReturnType<typeof useCredits>['isLoading'];
  creditsError: ReturnType<typeof useCredits>['error'];
  reserveCredits: ReturnType<typeof useCredits>['reserveCredits'];
  completeCreditReservation: ReturnType<typeof useCredits>['completeReservation'];
  refundCreditReservation: ReturnType<typeof useCredits>['refundReservation'];
  createPayment: ReturnType<typeof useCredits>['createPayment'];
  analyzeImages: ReturnType<typeof useCredits>['analyzeImages'];

  // UI state
  previewData: DocumentPdfData | null;
  setPreviewData: React.Dispatch<React.SetStateAction<DocumentPdfData | null>>;

  isPhotoScanOpen: boolean;
  setIsPhotoScanOpen: React.Dispatch<React.SetStateAction<boolean>>;
  photoScanTarget: 'invoice' | 'quote' | 'article';
  setPhotoScanTarget: React.Dispatch<React.SetStateAction<'invoice' | 'quote' | 'article'>>;
  openPhotoScan: (type: 'invoice' | 'quote' | 'article') => void;

  isCreditsModalOpen: boolean;
  setIsCreditsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  handlePhotoScanExtracted: (extract: PhotoScanExtract) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

interface AppProviderProps {
  children: React.ReactNode;
  /** Called when photo scan creates a new invoice to edit */
  onEditInvoice?: (invoice: Invoice) => void;
  /** Called when photo scan creates a new quote to edit */
  onEditQuote?: (quote: Quote) => void;
  /** Called to navigate to a specific tab/route after scan */
  onNavigate?: (path: string) => void;
}

export function AppProvider({ children, onEditInvoice, onEditQuote, onNavigate }: AppProviderProps) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  // Domain hooks
  const invoiceHook = useInvoices(userId);
  const quoteHook = useQuotes(userId);
  const articleHook = useArticles(userId);
  const clientHook = useClients(userId);
  const settingsHook = useSettings(userId);
  const creditsHook = useCredits(session);

  // UI state
  const [previewData, setPreviewData] = useState<DocumentPdfData | null>(null);
  const [isPhotoScanOpen, setIsPhotoScanOpen] = useState(false);
  const [photoScanTarget, setPhotoScanTarget] = useState<'invoice' | 'quote' | 'article'>('invoice');
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const openPhotoScan = (type: 'invoice' | 'quote' | 'article') => {
    setPhotoScanTarget(type);
    setIsPhotoScanOpen(true);
  };

  // Photo Scan Extraction Handler
  const handlePhotoScanExtracted = (extract: PhotoScanExtract) => {
    let matchedClientId = clientHook.clients[0]?.id || '';
    if (extract.clientName) {
      const existingClient = clientHook.clients.find(
        (c) => c.name.toLowerCase() === extract.clientName?.toLowerCase()
      );
      if (existingClient) {
        matchedClientId = existingClient.id;
      } else {
        const newClient: Client = {
          id: crypto.randomUUID(),
          name: extract.clientName,
          phone: '07 00 00 00',
          email: `${extract.clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          address: 'Abidjan',
          createdAt: new Date().toISOString(),
        };
        clientHook.addClient(newClient);
        matchedClientId = newClient.id;
      }
    }

    const docItems = extract.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: it.name,
      description: it.description || '',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.quantity * it.unitPrice,
    }));

    if (photoScanTarget === 'article') {
      const newCatalogArticles: Article[] = extract.items.map((it, idx) => ({
        id: crypto.randomUUID(),
        name: it.name,
        description: it.description || 'Généré par photo OCR',
        unitPrice: it.unitPrice,
        createdAt: new Date().toISOString(),
      }));
      articleHook.addBulkArticles(newCatalogArticles);
      onNavigate?.('/articles');
      return;
    }

    if (photoScanTarget === 'invoice') {
      const newInv: Invoice = {
        id: crypto.randomUUID(),
        number: `FACT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        clientId: matchedClientId,
        date: extract.date || '14/09/2026',
        dueDate: '21/09/2026',
        items: docItems,
        subtotal: docItems.reduce((acc, cur) => acc + cur.total, 0),
        discountType: 'fixed',
        discountValue: 0,
        taxRate: 0,
        taxAmount: 0,
        total: docItems.reduce((acc, cur) => acc + cur.total, 0),
        status: 'pending',
        scannedPagesUrls: extract.scannedPagesUrls,
        createdAt: new Date().toISOString(),
      };
      onEditInvoice?.(newInv);
      onNavigate?.('/invoices/new');
    }

    if (photoScanTarget === 'quote') {
      const newQuo: Quote = {
        id: crypto.randomUUID(),
        number: `DEV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        clientId: matchedClientId,
        date: extract.date || '14/09/2026',
        expirationDate: '14/10/2026',
        items: docItems,
        subtotal: docItems.reduce((acc, cur) => acc + cur.total, 0),
        discountType: 'fixed',
        discountValue: 0,
        taxRate: 0,
        taxAmount: 0,
        total: docItems.reduce((acc, cur) => acc + cur.total, 0),
        status: 'pending',
        scannedPagesUrls: extract.scannedPagesUrls,
        createdAt: new Date().toISOString(),
      };
      onEditQuote?.(newQuo);
      onNavigate?.('/quotes/new');
    }
  };

  const value: AppContextType = {
    ...invoiceHook,
    ...quoteHook,
    ...articleHook,
    ...clientHook,
    ...settingsHook,
    credits: creditsHook.credits,
    plan: creditsHook.plan,
    creditPlans: creditsHook.plans,
    creditsLoading: creditsHook.isLoading,
    creditsError: creditsHook.error,
    reserveCredits: creditsHook.reserveCredits,
    completeCreditReservation: creditsHook.completeReservation,
    refundCreditReservation: creditsHook.refundReservation,
    createPayment: creditsHook.createPayment,
    analyzeImages: creditsHook.analyzeImages,
    previewData,
    setPreviewData,
    isPhotoScanOpen,
    setIsPhotoScanOpen,
    photoScanTarget,
    setPhotoScanTarget,
    openPhotoScan,
    isCreditsModalOpen,
    setIsCreditsModalOpen,
    handlePhotoScanExtracted,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
