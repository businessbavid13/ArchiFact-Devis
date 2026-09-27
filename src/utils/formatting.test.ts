import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './formatting';

describe('formatCurrency', () => {
  it('formats simple amount with FCFA', () => {
    expect(formatCurrency(5000)).toBe('5 000 FCFA');
  });

  it('formats large amounts with thousand separators', () => {
    expect(formatCurrency(1500000)).toBe('1 500 000 FCFA');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0 FCFA');
  });

  it('rounds decimal amounts (FCFA has no cents)', () => {
    expect(formatCurrency(4999.7)).toBe('5 000 FCFA');
    expect(formatCurrency(1234.4)).toBe('1 234 FCFA');
  });

  it('uses custom currency', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('1 000 EUR');
    expect(formatCurrency(25000, 'XOF')).toBe('25 000 XOF');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-5000)).toBe('-5 000 FCFA');
  });

  // Realistic BTP amounts
  it('formats typical BTP invoice totals', () => {
    expect(formatCurrency(662000)).toBe('662 000 FCFA');
    expect(formatCurrency(470820)).toBe('470 820 FCFA');
    expect(formatCurrency(150000)).toBe('150 000 FCFA');
  });
});

describe('formatDate', () => {
  it('returns DD/MM/YYYY dates unchanged', () => {
    expect(formatDate('14/09/2026')).toBe('14/09/2026');
    expect(formatDate('01/01/2025')).toBe('01/01/2025');
  });

  it('converts ISO dates to DD/MM/YYYY', () => {
    expect(formatDate('2026-09-14T09:00:00.000Z')).toBe('14/09/2026');
  });

  it('returns empty string for undefined/empty input', () => {
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('returns original string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
