/**
 * Supabase API Implementation of Repository Interfaces
 *
 * These repositories query the Supabase PostgreSQL database via PostgREST.
 * They implement the same interfaces as LocalStorageRepository,
 * allowing transparent swapping between offline (localStorage) and online (API) modes.
 */

import { supabase } from '../lib/supabase';
import {
  InvoiceRepository,
  QuoteRepository,
  ArticleRepository,
  ClientRepository,
  SettingsRepository,
} from './interfaces';
import { Invoice, Quote, Article, Client, CompanySettings, DocumentItem, DiscountType } from '../types';

// ── Mappers: DB Row ↔ Domain Model ──

function mapDbInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: (row.client_id as string) || '',
    date: row.date as string,
    dueDate: row.due_date as string,
    items: (row.items as DocumentItem[]) || [],
    subtotal: row.subtotal as number,
    discountType: (row.discount_type as DiscountType) || 'fixed',
    discountValue: row.discount_value as number,
    taxRate: Number(row.tax_rate) || 0,
    taxAmount: row.tax_amount as number,
    additionalTaxName: row.additional_tax_name as string | undefined,
    additionalTaxRate: row.additional_tax_rate != null ? Number(row.additional_tax_rate) : undefined,
    additionalTaxAmount: row.additional_tax_amount as number | undefined,
    total: row.total as number,
    paymentMode: row.payment_mode as string | undefined,
    terms: row.terms as string | undefined,
    status: (row.status as 'pending' | 'paid' | 'overdue') || 'pending',
    scannedPagesUrls: (row.scanned_pages_urls as string[]) || undefined,
    createdAt: row.created_at as string,
  };
}

function invoiceToDb(inv: Invoice) {
  return {
    id: inv.id,
    number: inv.number,
    client_id: inv.clientId || null,
    date: inv.date,
    due_date: inv.dueDate,
    items: inv.items,
    subtotal: inv.subtotal,
    discount_type: inv.discountType,
    discount_value: inv.discountValue,
    tax_rate: inv.taxRate,
    tax_amount: inv.taxAmount,
    additional_tax_name: inv.additionalTaxName || null,
    additional_tax_rate: inv.additionalTaxRate ?? null,
    additional_tax_amount: inv.additionalTaxAmount ?? null,
    total: inv.total,
    payment_mode: inv.paymentMode || null,
    terms: inv.terms || null,
    status: inv.status,
    scanned_pages_urls: inv.scannedPagesUrls || null,
  };
}

function mapDbQuote(row: Record<string, unknown>): Quote {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: (row.client_id as string) || '',
    date: row.date as string,
    expirationDate: row.expiration_date as string,
    items: (row.items as DocumentItem[]) || [],
    subtotal: row.subtotal as number,
    discountType: (row.discount_type as DiscountType) || 'fixed',
    discountValue: row.discount_value as number,
    taxRate: Number(row.tax_rate) || 0,
    taxAmount: row.tax_amount as number,
    additionalTaxName: row.additional_tax_name as string | undefined,
    additionalTaxRate: row.additional_tax_rate != null ? Number(row.additional_tax_rate) : undefined,
    additionalTaxAmount: row.additional_tax_amount as number | undefined,
    total: row.total as number,
    paymentMode: row.payment_mode as string | undefined,
    terms: row.terms as string | undefined,
    status: (row.status as 'pending' | 'accepted' | 'declined') || 'pending',
    scannedPagesUrls: (row.scanned_pages_urls as string[]) || undefined,
    createdAt: row.created_at as string,
  };
}

function quoteToDb(q: Quote) {
  return {
    id: q.id,
    number: q.number,
    client_id: q.clientId || null,
    date: q.date,
    expiration_date: q.expirationDate,
    items: q.items,
    subtotal: q.subtotal,
    discount_type: q.discountType,
    discount_value: q.discountValue,
    tax_rate: q.taxRate,
    tax_amount: q.taxAmount,
    additional_tax_name: q.additionalTaxName || null,
    additional_tax_rate: q.additionalTaxRate ?? null,
    additional_tax_amount: q.additionalTaxAmount ?? null,
    total: q.total,
    payment_mode: q.paymentMode || null,
    terms: q.terms || null,
    status: q.status,
    scanned_pages_urls: q.scannedPagesUrls || null,
  };
}

function mapDbClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    address: row.address as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapDbArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    unitPrice: row.unit_price as number,
    unit: row.unit as string | undefined,
    createdAt: row.created_at as string,
  };
}

// ── Supabase Invoice Repository ──

export class SupabaseInvoiceRepository implements InvoiceRepository {
  getAll(): Invoice[] {
    // Note: sync interface — will be migrated to async in Phase 4
    throw new Error('Use async methods. Call getAllAsync() instead.');
  }

  async getAllAsync(): Promise<Invoice[]> {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbInvoice);
  }

  getById(id: string): Invoice | undefined {
    throw new Error('Use async methods. Call getByIdAsync() instead.');
  }

  async getByIdAsync(id: string): Promise<Invoice | undefined> {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (error) return undefined;
    return data ? mapDbInvoice(data) : undefined;
  }

  create(invoice: Invoice): void {
    throw new Error('Use async methods.');
  }

  async createAsync(invoice: Invoice): Promise<void> {
    const { error } = await supabase.from('invoices').insert(invoiceToDb(invoice));
    if (error) throw error;
  }

  update(invoice: Invoice): void {
    throw new Error('Use async methods.');
  }

  async updateAsync(invoice: Invoice): Promise<void> {
    const { error } = await supabase.from('invoices').update(invoiceToDb(invoice)).eq('id', invoice.id);
    if (error) throw error;
  }

  delete(id: string): void {
    throw new Error('Use async methods.');
  }

  async deleteAsync(id: string): Promise<void> {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  }

  updateStatus(id: string, status: 'paid' | 'pending' | 'overdue'): void {
    throw new Error('Use async methods.');
  }

  async updateStatusAsync(id: string, status: 'paid' | 'pending' | 'overdue'): Promise<void> {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) throw error;
  }

  duplicate(invoice: Invoice): Invoice {
    const copy: Invoice = {
      ...invoice,
      id: crypto.randomUUID(),
      number: `FACT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    // Fire and forget — or caller handles async
    this.createAsync(copy);
    return copy;
  }
}

// ── Supabase Quote Repository ──

export class SupabaseQuoteRepository implements QuoteRepository {
  getAll(): Quote[] { throw new Error('Use getAllAsync()'); }

  async getAllAsync(): Promise<Quote[]> {
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbQuote);
  }

  getById(id: string): Quote | undefined { throw new Error('Use getByIdAsync()'); }

  async getByIdAsync(id: string): Promise<Quote | undefined> {
    const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
    if (error) return undefined;
    return data ? mapDbQuote(data) : undefined;
  }

  create(quote: Quote): void { throw new Error('Use createAsync()'); }
  async createAsync(quote: Quote): Promise<void> {
    const { error } = await supabase.from('quotes').insert(quoteToDb(quote));
    if (error) throw error;
  }

  update(quote: Quote): void { throw new Error('Use updateAsync()'); }
  async updateAsync(quote: Quote): Promise<void> {
    const { error } = await supabase.from('quotes').update(quoteToDb(quote)).eq('id', quote.id);
    if (error) throw error;
  }

  delete(id: string): void { throw new Error('Use deleteAsync()'); }
  async deleteAsync(id: string): Promise<void> {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
  }

  updateStatus(id: string, status: 'pending' | 'accepted' | 'declined'): void { throw new Error('Use updateStatusAsync()'); }
  async updateStatusAsync(id: string, status: 'pending' | 'accepted' | 'declined'): Promise<void> {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', id);
    if (error) throw error;
  }

  duplicate(quote: Quote): Quote {
    const copy: Quote = {
      ...quote,
      id: crypto.randomUUID(),
      number: `DEV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.createAsync(copy);
    return copy;
  }

  convertToInvoice(quote: Quote): Invoice {
    return {
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
      total: quote.total,
      paymentMode: quote.paymentMode,
      terms: quote.terms,
      status: 'pending',
      scannedPagesUrls: quote.scannedPagesUrls,
      createdAt: new Date().toISOString(),
    };
  }
}

// ── Supabase Article Repository ──

export class SupabaseArticleRepository implements ArticleRepository {
  getAll(): Article[] { throw new Error('Use getAllAsync()'); }
  async getAllAsync(): Promise<Article[]> {
    const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbArticle);
  }

  getById(id: string): Article | undefined { throw new Error('Use getByIdAsync()'); }
  create(article: Article): void { throw new Error('Use createAsync()'); }
  async createAsync(article: Article): Promise<void> {
    const { error } = await supabase.from('articles').insert({
      id: article.id, name: article.name, description: article.description || null,
      unit_price: article.unitPrice, unit: article.unit || null,
    });
    if (error) throw error;
  }

  update(article: Article): void { throw new Error('Use updateAsync()'); }
  async updateAsync(article: Article): Promise<void> {
    const { error } = await supabase.from('articles').update({
      name: article.name, description: article.description || null,
      unit_price: article.unitPrice, unit: article.unit || null,
    }).eq('id', article.id);
    if (error) throw error;
  }

  delete(id: string): void { throw new Error('Use deleteAsync()'); }
  async deleteAsync(id: string): Promise<void> {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
  }

  createBulk(articles: Article[]): void { throw new Error('Use createBulkAsync()'); }
  async createBulkAsync(articles: Article[]): Promise<void> {
    const rows = articles.map((a) => ({
      id: a.id, name: a.name, description: a.description || null,
      unit_price: a.unitPrice, unit: a.unit || null,
    }));
    const { error } = await supabase.from('articles').insert(rows);
    if (error) throw error;
  }
}

// ── Supabase Client Repository ──

export class SupabaseClientRepository implements ClientRepository {
  getAll(): Client[] { throw new Error('Use getAllAsync()'); }
  async getAllAsync(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbClient);
  }

  getById(id: string): Client | undefined { throw new Error('Use getByIdAsync()'); }
  create(client: Client): void { throw new Error('Use createAsync()'); }
  async createAsync(client: Client): Promise<void> {
    const { error } = await supabase.from('clients').insert({
      id: client.id, name: client.name, email: client.email || null,
      phone: client.phone || null, address: client.address || null,
    });
    if (error) throw error;
  }

  update(client: Client): void { throw new Error('Use updateAsync()'); }
  async updateAsync(client: Client): Promise<void> {
    const { error } = await supabase.from('clients').update({
      name: client.name, email: client.email || null,
      phone: client.phone || null, address: client.address || null,
    }).eq('id', client.id);
    if (error) throw error;
  }

  delete(id: string): void { throw new Error('Use deleteAsync()'); }
  async deleteAsync(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  }
}

// ── Supabase Settings Repository ──

export class SupabaseSettingsRepository implements SettingsRepository {
  get(): CompanySettings { throw new Error('Use getAsync()'); }

  async getAsync(): Promise<CompanySettings | null> {
    const { data, error } = await supabase.from('company_settings').select('*').single();
    if (error || !data) return null;
    return {
      name: data.name,
      legalStatus: data.legal_status ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      address: data.address ?? undefined,
      taxId: data.tax_id ?? undefined,
      logoUrl: data.logo_url ?? undefined,
      headerImageUrl: data.header_image_url ?? undefined,
      headerText: data.header_text ?? undefined,
      footerText: data.footer_text ?? undefined,
      footerImageUrl: data.footer_image_url ?? undefined,
      signatureUrl: data.signature_url ?? undefined,
      signatureImageUrl: data.signature_image_url ?? undefined,
      currency: data.currency,
      language: data.language,
      numberFormat: data.number_format,
      dateFormat: data.date_format,
      invoiceDueDays: data.invoice_due_days,
      showPaymentStatus: data.show_payment_status,
      documentTemplate: data.document_template,
      invoiceColor: data.invoice_color,
      quoteColor: data.quote_color,
      invoiceOpacity: data.invoice_opacity,
      signatureScale: data.signature_scale,
      paymentModes: data.payment_modes as string[],
      termsAndConditions: data.terms_and_conditions as string[],
      taxOptions: data.tax_options as { name: string; rate: number }[],
    };
  }

  update(settings: Partial<CompanySettings>): void { throw new Error('Use updateAsync()'); }
  async updateAsync(settings: Partial<CompanySettings>): Promise<void> {
    const mapped: Record<string, unknown> = {};
    if (settings.name !== undefined) mapped.name = settings.name;
    if (settings.legalStatus !== undefined) mapped.legal_status = settings.legalStatus;
    if (settings.email !== undefined) mapped.email = settings.email;
    if (settings.phone !== undefined) mapped.phone = settings.phone;
    if (settings.address !== undefined) mapped.address = settings.address;
    if (settings.taxId !== undefined) mapped.tax_id = settings.taxId;
    if (settings.logoUrl !== undefined) mapped.logo_url = settings.logoUrl;
    if (settings.currency !== undefined) mapped.currency = settings.currency;
    if (settings.invoiceDueDays !== undefined) mapped.invoice_due_days = settings.invoiceDueDays;
    if (settings.documentTemplate !== undefined) mapped.document_template = settings.documentTemplate;
    if (settings.invoiceColor !== undefined) mapped.invoice_color = settings.invoiceColor;
    if (settings.quoteColor !== undefined) mapped.quote_color = settings.quoteColor;
    if (settings.paymentModes !== undefined) mapped.payment_modes = settings.paymentModes;
    if (settings.taxOptions !== undefined) mapped.tax_options = settings.taxOptions;
    // ... add remaining fields as needed

    const { error } = await supabase.from('company_settings').upsert(mapped);
    if (error) throw error;
  }
}
