import { useCallback } from 'react';
import { Invoice } from '../types';
import { usePersistedState } from './usePersistedState';
import { INITIAL_INVOICES } from '../data/mockData';

export function useInvoices() {
  const [invoices, setInvoices] = usePersistedState<Invoice[]>('df_invoices', INITIAL_INVOICES);

  const saveInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => {
      const idx = prev.findIndex((i) => i.id === invoice.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = invoice;
        return copy;
      }
      return [invoice, ...prev];
    });
  }, [setInvoices]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, [setInvoices]);

  const updateInvoiceStatus = useCallback((id: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );
  }, [setInvoices]);

  const duplicateInvoice = useCallback((invoice: Invoice) => {
    const copy: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      number: `FACT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [copy, ...prev]);
    return copy;
  }, [setInvoices]);

  return {
    invoices,
    setInvoices,
    saveInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    duplicateInvoice,
  };
}
