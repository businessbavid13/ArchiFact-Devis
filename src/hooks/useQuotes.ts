import { useCallback } from 'react';
import { Quote, Invoice } from '../types';
import { usePersistedState } from './usePersistedState';
import { INITIAL_QUOTES } from '../data/mockData';

export function useQuotes() {
  const [quotes, setQuotes] = usePersistedState<Quote[]>('df_quotes', INITIAL_QUOTES);

  const saveQuote = useCallback((quote: Quote) => {
    setQuotes((prev) => {
      const idx = prev.findIndex((q) => q.id === quote.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = quote;
        return copy;
      }
      return [quote, ...prev];
    });
  }, [setQuotes]);

  const deleteQuote = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, [setQuotes]);

  const duplicateQuote = useCallback((quote: Quote) => {
    const copy: Quote = {
      ...quote,
      id: `quote-${Date.now()}`,
      number: `DEV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setQuotes((prev) => [copy, ...prev]);
  }, [setQuotes]);

  const updateQuoteStatus = useCallback((id: string, newStatus: 'pending' | 'accepted' | 'declined') => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
  }, [setQuotes]);

  const convertQuoteToInvoice = useCallback((quote: Quote): Invoice => {
    return {
      id: `inv-${Date.now()}`,
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
      total: quote.total,
      paymentMode: quote.paymentMode,
      terms: quote.terms,
      status: 'pending',
      scannedPagesUrls: quote.scannedPagesUrls,
      createdAt: new Date().toISOString(),
    };
  }, []);

  return {
    quotes,
    setQuotes,
    saveQuote,
    deleteQuote,
    duplicateQuote,
    updateQuoteStatus,
    convertQuoteToInvoice,
  };
}
