/**
 * Repository Pattern Interfaces
 *
 * These interfaces abstract data access so that the frontend
 * can switch from localStorage to a backend API transparently.
 *
 * Current: LocalStorageRepository (client-side)
 * Target:  ApiRepository (backend via REST API)
 */

import { Invoice, Quote, Article, Client, CompanySettings } from '../types';

// ── Generic Repository ──

export interface Repository<T> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(item: T): void;
  update(item: T): void;
  delete(id: string): void;
}

// ── Specialized Repositories ──

export interface InvoiceRepository extends Repository<Invoice> {
  updateStatus(id: string, status: 'paid' | 'pending' | 'overdue'): void;
  duplicate(invoice: Invoice): Invoice;
}

export interface QuoteRepository extends Repository<Quote> {
  updateStatus(id: string, status: 'pending' | 'accepted' | 'declined'): void;
  duplicate(quote: Quote): Quote;
  convertToInvoice(quote: Quote): Invoice;
}

export interface ArticleRepository extends Repository<Article> {
  createBulk(articles: Article[]): void;
}

export interface ClientRepository extends Repository<Client> {}

export interface SettingsRepository {
  get(): CompanySettings;
  update(settings: Partial<CompanySettings>): void;
}
