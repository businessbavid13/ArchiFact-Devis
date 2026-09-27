/**
 * localStorage Implementation of Repository Interfaces
 *
 * This is the current data layer. When the backend is ready,
 * we'll create ApiRepository implementations with the same interfaces.
 */

import {
  InvoiceRepository,
  QuoteRepository,
  ArticleRepository,
  ClientRepository,
  SettingsRepository,
} from './interfaces';
import { Invoice, Quote, Article, Client, CompanySettings } from '../types';
import {
  INITIAL_INVOICES,
  INITIAL_QUOTES,
  INITIAL_ARTICLES,
  INITIAL_CLIENTS,
  INITIAL_SETTINGS,
} from '../data/mockData';

// ── Helper ──

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Invoice Repository ──

export class LocalInvoiceRepository implements InvoiceRepository {
  private key = 'df_invoices';

  getAll(): Invoice[] {
    return loadFromStorage<Invoice[]>(this.key, INITIAL_INVOICES);
  }

  getById(id: string): Invoice | undefined {
    return this.getAll().find((inv) => inv.id === id);
  }

  create(invoice: Invoice): void {
    const all = this.getAll();
    saveToStorage(this.key, [invoice, ...all]);
  }

  update(invoice: Invoice): void {
    const all = this.getAll();
    const idx = all.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      all[idx] = invoice;
      saveToStorage(this.key, all);
    }
  }

  delete(id: string): void {
    const all = this.getAll().filter((i) => i.id !== id);
    saveToStorage(this.key, all);
  }

  updateStatus(id: string, status: 'paid' | 'pending' | 'overdue'): void {
    const all = this.getAll().map((inv) =>
      inv.id === id ? { ...inv, status } : inv
    );
    saveToStorage(this.key, all);
  }

  duplicate(invoice: Invoice): Invoice {
    const copy: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      number: `FACT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.create(copy);
    return copy;
  }
}

// ── Quote Repository ──

export class LocalQuoteRepository implements QuoteRepository {
  private key = 'df_quotes';

  getAll(): Quote[] {
    return loadFromStorage<Quote[]>(this.key, INITIAL_QUOTES);
  }

  getById(id: string): Quote | undefined {
    return this.getAll().find((q) => q.id === id);
  }

  create(quote: Quote): void {
    const all = this.getAll();
    saveToStorage(this.key, [quote, ...all]);
  }

  update(quote: Quote): void {
    const all = this.getAll();
    const idx = all.findIndex((q) => q.id === quote.id);
    if (idx >= 0) {
      all[idx] = quote;
      saveToStorage(this.key, all);
    }
  }

  delete(id: string): void {
    const all = this.getAll().filter((q) => q.id !== id);
    saveToStorage(this.key, all);
  }

  updateStatus(id: string, status: 'pending' | 'accepted' | 'declined'): void {
    const all = this.getAll().map((q) =>
      q.id === id ? { ...q, status } : q
    );
    saveToStorage(this.key, all);
  }

  duplicate(quote: Quote): Quote {
    const copy: Quote = {
      ...quote,
      id: `quote-${Date.now()}`,
      number: `DEV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.create(copy);
    return copy;
  }

  convertToInvoice(quote: Quote): Invoice {
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
  }
}

// ── Article Repository ──

export class LocalArticleRepository implements ArticleRepository {
  private key = 'df_articles';

  getAll(): Article[] {
    return loadFromStorage<Article[]>(this.key, INITIAL_ARTICLES);
  }

  getById(id: string): Article | undefined {
    return this.getAll().find((a) => a.id === id);
  }

  create(article: Article): void {
    const all = this.getAll();
    saveToStorage(this.key, [article, ...all]);
  }

  update(article: Article): void {
    const all = this.getAll().map((a) => (a.id === article.id ? article : a));
    saveToStorage(this.key, all);
  }

  delete(id: string): void {
    const all = this.getAll().filter((a) => a.id !== id);
    saveToStorage(this.key, all);
  }

  createBulk(articles: Article[]): void {
    const all = this.getAll();
    saveToStorage(this.key, [...articles, ...all]);
  }
}

// ── Client Repository ──

export class LocalClientRepository implements ClientRepository {
  private key = 'df_clients';

  getAll(): Client[] {
    return loadFromStorage<Client[]>(this.key, INITIAL_CLIENTS);
  }

  getById(id: string): Client | undefined {
    return this.getAll().find((c) => c.id === id);
  }

  create(client: Client): void {
    const all = this.getAll();
    saveToStorage(this.key, [client, ...all]);
  }

  update(client: Client): void {
    const all = this.getAll().map((c) => (c.id === client.id ? client : c));
    saveToStorage(this.key, all);
  }

  delete(id: string): void {
    const all = this.getAll().filter((c) => c.id !== id);
    saveToStorage(this.key, all);
  }
}

// ── Settings Repository ──

export class LocalSettingsRepository implements SettingsRepository {
  private key = 'df_settings';

  get(): CompanySettings {
    return loadFromStorage<CompanySettings>(this.key, INITIAL_SETTINGS);
  }

  update(settings: Partial<CompanySettings>): void {
    const current = this.get();
    saveToStorage(this.key, { ...current, ...settings });
  }
}
