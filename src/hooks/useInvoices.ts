import { useCallback } from 'react';
import { Invoice } from '../types';
import { normalizeLegacyId, useSupabaseCollection } from './useSupabaseCollection';

function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    number: String(row.number || ''),
    clientId: String(row.client_id || ''),
    date: String(row.date || ''),
    dueDate: String(row.due_date || ''),
    items: (row.items as Invoice['items']) || [],
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
    status: row.status === 'paid' || row.status === 'overdue' ? row.status : 'pending',
    scannedPagesUrls: (row.scanned_pages_urls as string[]) || undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function invoiceToRow(invoice: Invoice): Record<string, unknown> {
  return {
    id: normalizeLegacyId(invoice.id),
    number: invoice.number,
    client_id: invoice.clientId ? normalizeLegacyId(invoice.clientId) : null,
    date: invoice.date,
    due_date: invoice.dueDate,
    items: invoice.items,
    subtotal: invoice.subtotal,
    discount_type: invoice.discountType,
    discount_value: invoice.discountValue,
    tax_rate: invoice.taxRate,
    tax_amount: invoice.taxAmount,
    additional_tax_name: invoice.additionalTaxName || null,
    additional_tax_rate: invoice.additionalTaxRate ?? null,
    additional_tax_amount: invoice.additionalTaxAmount ?? null,
    total: invoice.total,
    payment_mode: invoice.paymentMode || null,
    terms: invoice.terms || null,
    status: invoice.status,
    scanned_pages_urls: invoice.scannedPagesUrls || null,
    created_at: invoice.createdAt,
  };
}

export function useInvoices(userId: string | null) {
  const collection = useSupabaseCollection<Invoice>({
    table: 'invoices',
    userId,
    localStorageKey: 'df_invoices',
    mapRow: mapInvoice,
    toRow: invoiceToRow,
  });

  const saveInvoice = useCallback((invoice: Invoice) => {
    void collection.save(invoice);
  }, [collection.save]);

  const deleteInvoice = useCallback((id: string) => {
    void collection.remove(id);
  }, [collection.remove]);

  const updateInvoiceStatus = useCallback((id: string, newStatus: Invoice['status']) => {
    const invoice = collection.items.find((item) => item.id === id);
    if (invoice) void collection.save({ ...invoice, status: newStatus });
  }, [collection.items, collection.save]);

  const duplicateInvoice = useCallback((invoice: Invoice) => {
    const copy: Invoice = {
      ...invoice,
      id: crypto.randomUUID(),
      number: `FACT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    void collection.save(copy);
  }, [collection.save]);

  return {
    invoices: collection.items,
    saveInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    duplicateInvoice,
    isLoading: collection.isLoading,
  };
}
