import { Client, CompanySettings, Invoice, Quote } from '../types';
import { calculateDocumentTotals } from './calculations';
import { DocumentPdfData } from './pdfGenerator';

function getDiscountAmount(
  subtotal: number,
  discountType: Quote['discountType'],
  discountValue: number
): number {
  if (discountType === 'percent') {
    return subtotal * (Math.max(0, Math.min(100, discountValue)) / 100);
  }
  return Math.max(0, Math.min(subtotal, discountValue));
}

function createDocumentData(
  document: Quote | Invoice,
  documentType: DocumentPdfData['documentType'],
  client: Client | undefined,
  settings: CompanySettings
): DocumentPdfData {
  const totals = calculateDocumentTotals(
    document.items,
    document.discountType,
    document.discountValue,
    document.taxRate
  );
  const dueDateOrExpiration = documentType === 'quote'
    ? (document as Quote).expirationDate
    : (document as Invoice).dueDate;

  return {
    documentType,
    number: document.number,
    client,
    date: document.date,
    dueDateOrExpiration,
    items: document.items,
    subtotal: totals.subtotal,
    discountType: document.discountType,
    discountValue: document.discountValue,
    discountAmount: getDiscountAmount(totals.subtotal, document.discountType, document.discountValue),
    taxRate: document.taxRate,
    taxAmount: totals.taxAmount,
    additionalTaxName: document.additionalTaxName,
    additionalTaxRate: document.additionalTaxRate,
    additionalTaxAmount: totals.additionalTaxAmount,
    total: totals.total,
    paymentMode: document.paymentMode,
    terms: document.terms,
    settings,
    scannedPagesUrls: document.scannedPagesUrls,
  };
}

export function createQuoteDocumentData(
  quote: Quote,
  client: Client | undefined,
  settings: CompanySettings
): DocumentPdfData {
  return createDocumentData(quote, 'quote', client, settings);
}

export function createInvoiceDocumentData(
  invoice: Invoice,
  client: Client | undefined,
  settings: CompanySettings
): DocumentPdfData {
  return createDocumentData(invoice, 'invoice', client, settings);
}
