import { useCallback } from 'react';
import { Invoice, Quote } from '../types';
import { normalizeLegacyId, useSupabaseCollection } from './useSupabaseCollection';

function mapQuote(row: Record<string, unknown>): Quote {
  return {
    id: String(row.id),
    number: String(row.number || ''),
    clientId: String(row.client_id || ''),
    date: String(row.date || ''),
    expirationDate: String(row.expiration_date || ''),
    items: (row.items as Quote['items']) || [],
    subtotal: Number(row.subtotal) || 0,
    discountType: row.discount_type === 'percent' ? 'percent' : 'fixed',
    discountValue: Number(row.discount_value) || 0,
    taxRate: Number(row.tax_rate) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    additionalTaxName: row.additional_tax_name as string | undefined,
    additionalTaxRate: row.additional_tax_rate == null ? undefined : Number(row.additional_tax_rate),
    additionalTaxAmount: row.additional_tax_amount == null ? undefined : Number(row.additional_tax_amount),
    total: Number(row.total) || 0,
    paymentMode: row.payment_mode as string | undefined,
    terms: row.terms as string | undefined,
    status: row.status === 'accepted' || row.status === 'declined' ? row.status : 'pending',
    scannedPagesUrls: (row.scanned_pages_urls as string[]) || undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function quoteToRow(quote: Quote): Record<string, unknown> {
  return {
    id: normalizeLegacyId(quote.id),
    number: quote.number,
    client_id: quote.clientId ? normalizeLegacyId(quote.clientId) : null,
    date: quote.date,
    expiration_date: quote.expirationDate,
    items: quote.items,
    subtotal: quote.subtotal,
    discount_type: quote.discountType,
    discount_value: quote.discountValue,
    tax_rate: quote.taxRate,
    tax_amount: quote.taxAmount,
    additional_tax_name: quote.additionalTaxName || null,
    additional_tax_rate: quote.additionalTaxRate ?? null,
    additional_tax_amount: quote.additionalTaxAmount ?? null,
    total: quote.total,
    payment_mode: quote.paymentMode || null,
    terms: quote.terms || null,
    status: quote.status,
    scanned_pages_urls: quote.scannedPagesUrls || null,
    created_at: quote.createdAt,
  };
}

export function useQuotes(userId: string | null) {
  const collection = useSupabaseCollection<Quote>({
    table: 'quotes',
    userId,
    localStorageKey: 'df_quotes',
    mapRow: mapQuote,
    toRow: quoteToRow,
  });

  const saveQuote = useCallback((quote: Quote) => {
    void collection.save(quote);
  }, [collection.save]);

  const deleteQuote = useCallback((id: string) => {
    void collection.remove(id);
  }, [collection.remove]);

  const duplicateQuote = useCallback((quote: Quote) => {
    const copy: Quote = {
      ...quote,
      id: crypto.randomUUID(),
      number: `DEV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    void collection.save(copy);
  }, [collection.save]);

  const updateQuoteStatus = useCallback((id: string, newStatus: Quote['status']) => {
    const quote = collection.items.find((item) => item.id === id);
    if (quote) void collection.save({ ...quote, status: newStatus });
  }, [collection.items, collection.save]);

  const convertQuoteToInvoice = useCallback((quote: Quote): Invoice => ({
    id: crypto.randomUUID(),
    number: `FACT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    clientId: quote.clientId,
    date: quote.date,
    dueDate: quote.expirationDate,
    items: quote.items,
    subtotal: quote.subtotal,
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    taxRate: quote.taxRate,
    taxAmount: quote.taxAmount,
    additionalTaxName: quote.additionalTaxName,
    additionalTaxRate: quote.additionalTaxRate,
    additionalTaxAmount: quote.additionalTaxAmount,
    total: quote.total,
    paymentMode: quote.paymentMode,
    terms: quote.terms,
    status: 'pending',
    scannedPagesUrls: quote.scannedPagesUrls,
    createdAt: new Date().toISOString(),
  }), []);

  return {
    quotes: collection.items,
    saveQuote,
    deleteQuote,
    duplicateQuote,
    updateQuoteStatus,
    convertQuoteToInvoice,
    isLoading: collection.isLoading,
  };
}
