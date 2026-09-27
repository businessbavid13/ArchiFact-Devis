/**
 * TypeScript Interfaces & Types for ArchiFact Devis
 */

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  unit?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  articleId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type DiscountType = 'fixed' | 'percent';

export type QuoteStatus = 'pending' | 'accepted' | 'declined';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  date: string;
  expirationDate: string;
  items: DocumentItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number; // percentage (e.g. 18 for 18%)
  taxAmount: number;
  additionalTaxName?: string;
  additionalTaxRate?: number;
  additionalTaxAmount?: number;
  total: number;
  paymentMode?: string;
  terms?: string;
  status: QuoteStatus;
  scannedPagesUrls?: string[];
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  date: string;
  dueDate: string;
  items: DocumentItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  taxAmount: number;
  additionalTaxName?: string;
  additionalTaxRate?: number;
  additionalTaxAmount?: number;
  total: number;
  paymentMode?: string;
  terms?: string;
  status: InvoiceStatus;
  scannedPagesUrls?: string[];
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  legalStatus?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string; // NIF / SIRET
  logoUrl?: string;
  headerImageUrl?: string;
  headerText?: string;
  footerText?: string;
  footerImageUrl?: string;
  signatureUrl?: string;
  signatureImageUrl?: string;
  currency: string; // e.g. "FCFA" or "EUR"
  language: string; // e.g. "Français"
  numberFormat: string; // e.g. "1 000 000"
  dateFormat: string; // e.g. "DD/MM/YYYY"
  invoiceDueDays: number;
  showPaymentStatus: boolean;
  documentTemplate: string;
  invoiceColor: string;
  quoteColor: string;
  invoiceOpacity: number; // 0 to 100
  signatureScale: number; // 0 to 100
  paymentModes: string[];
  termsAndConditions: string[];
  taxOptions: { name: string; rate: number }[];
}

export interface CreditPlan {
  id: string;
  name: string;
  priceFcfa: number;
  credits: number;
}

export interface ScannedPageItem {
  id: string;
  previewUrl: string;
  name: string;
  file?: File;
}

export interface PhotoScanExtract {
  type: 'quote' | 'invoice' | 'article';
  clientName?: string;
  clientPhone?: string;
  date?: string;
  dueDate?: string;
  items: {
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
  scannedPagesCount?: number;
  scannedPagesUrls?: string[];
}

export type RootTab = 'factures' | 'devis' | 'clients' | 'articles' | 'parametres';
