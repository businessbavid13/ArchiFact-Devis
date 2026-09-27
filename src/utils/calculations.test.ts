import { describe, it, expect } from 'vitest';
import { calculateDocumentTotals, CalculationResult } from './calculations';
import { DocumentItem, DiscountType } from '../types';

// Helper to create test items
function makeItem(name: string, quantity: number, unitPrice: number): DocumentItem {
  return {
    id: `test-${name}`,
    name,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  };
}

describe('calculateDocumentTotals', () => {
  // ── Subtotal ──

  it('calculates subtotal correctly for single item', () => {
    const items = [makeItem('Ciment', 10, 5000)];
    const result = calculateDocumentTotals(items, 'fixed', 0, 0);
    expect(result.subtotal).toBe(50000);
  });

  it('calculates subtotal correctly for multiple items', () => {
    const items = [
      makeItem('Ciment', 25, 4800),     // 120 000
      makeItem('Fer 10mm', 40, 4200),    // 168 000
      makeItem('Sable m³', 8, 15000),    // 120 000
    ];
    const result = calculateDocumentTotals(items, 'fixed', 0, 0);
    expect(result.subtotal).toBe(408000);
  });

  it('returns zero subtotal for empty items', () => {
    const result = calculateDocumentTotals([], 'fixed', 0, 0);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  // ── Fixed Discount ──

  it('applies fixed discount correctly', () => {
    const items = [makeItem('Ciment', 10, 5000)]; // subtotal = 50 000
    const result = calculateDocumentTotals(items, 'fixed', 5000, 0);
    expect(result.discountAmount).toBe(5000);
    expect(result.taxableAmount).toBe(45000);
    expect(result.total).toBe(45000);
  });

  it('caps fixed discount at subtotal (no negative total)', () => {
    const items = [makeItem('Ciment', 1, 1000)]; // subtotal = 1 000
    const result = calculateDocumentTotals(items, 'fixed', 50000, 0);
    expect(result.discountAmount).toBe(1000);
    expect(result.taxableAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('ignores negative fixed discount', () => {
    const items = [makeItem('Ciment', 1, 10000)];
    const result = calculateDocumentTotals(items, 'fixed', -500, 0);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(10000);
  });

  // ── Percent Discount ──

  it('applies percentage discount correctly', () => {
    const items = [makeItem('Ciment', 10, 5000)]; // subtotal = 50 000
    const result = calculateDocumentTotals(items, 'percent', 10, 0);
    expect(result.discountAmount).toBe(5000);
    expect(result.taxableAmount).toBe(45000);
    expect(result.total).toBe(45000);
  });

  it('caps percentage discount at 100%', () => {
    const items = [makeItem('Ciment', 1, 10000)];
    const result = calculateDocumentTotals(items, 'percent', 150, 0);
    expect(result.discountAmount).toBe(10000);
    expect(result.taxableAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  // ── TVA (Tax) ──

  it('applies 18% TVA standard correctly', () => {
    const items = [makeItem('Ciment', 10, 5000)]; // subtotal = 50 000
    const result = calculateDocumentTotals(items, 'fixed', 0, 18);
    expect(result.taxAmount).toBe(9000); // 50000 * 0.18
    expect(result.total).toBe(59000);    // 50000 + 9000
  });

  it('applies 5% reduced TVA correctly', () => {
    const items = [makeItem('Peinture', 5, 10000)]; // subtotal = 50 000
    const result = calculateDocumentTotals(items, 'fixed', 0, 5);
    expect(result.taxAmount).toBe(2500);
    expect(result.total).toBe(52500);
  });

  it('applies 0% TVA (exempt)', () => {
    const items = [makeItem('Ciment', 10, 5000)];
    const result = calculateDocumentTotals(items, 'fixed', 0, 0);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(50000);
  });

  // ── Additional Tax ──

  it('applies additional tax correctly', () => {
    const items = [makeItem('Ciment', 10, 5000)]; // subtotal = 50 000
    const result = calculateDocumentTotals(items, 'fixed', 0, 18, 2);
    expect(result.taxAmount).toBe(9000);           // 50000 * 0.18
    expect(result.additionalTaxAmount).toBe(1000); // 50000 * 0.02
    expect(result.total).toBe(60000);              // 50000 + 9000 + 1000
  });

  // ── Combined: Discount + TVA ──

  it('applies discount before tax (correct order)', () => {
    const items = [makeItem('Ciment', 20, 5000)]; // subtotal = 100 000
    const result = calculateDocumentTotals(items, 'fixed', 10000, 18);
    // taxable = 100 000 - 10 000 = 90 000
    // tax = 90 000 * 0.18 = 16 200
    // total = 90 000 + 16 200 = 106 200
    expect(result.discountAmount).toBe(10000);
    expect(result.taxableAmount).toBe(90000);
    expect(result.taxAmount).toBe(16200);
    expect(result.total).toBe(106200);
  });

  it('applies percent discount + TVA correctly', () => {
    const items = [makeItem('Fer', 100, 4200)]; // subtotal = 420 000
    const result = calculateDocumentTotals(items, 'percent', 5, 18);
    // discount = 420 000 * 0.05 = 21 000
    // taxable = 420 000 - 21 000 = 399 000
    // tax = 399 000 * 0.18 = 71 820
    // total = 399 000 + 71 820 = 470 820
    expect(result.discountAmount).toBe(21000);
    expect(result.taxableAmount).toBe(399000);
    expect(result.taxAmount).toBe(71820);
    expect(result.total).toBe(470820);
  });

  // ── FCFA Precision ──

  it('handles FCFA amounts (integer precision, no floating point)', () => {
    const items = [
      makeItem('Ciment CPJ 42.5', 25, 4800),  // 120 000
      makeItem('Fer 10mm', 40, 4200),          // 168 000
      makeItem('Fil recuit', 4, 8500),         //  34 000
      makeItem('Sable m³', 8, 15000),          // 120 000
      makeItem('Gravier 15/25', 10, 22000),    // 220 000
    ];
    const result = calculateDocumentTotals(items, 'fixed', 0, 18);
    expect(result.subtotal).toBe(662000);
    expect(result.taxAmount).toBe(662000 * 0.18);
    expect(result.total).toBe(662000 + 662000 * 0.18);
  });

  // ── Return type completeness ──

  it('returns all required fields', () => {
    const items = [makeItem('Test', 1, 1000)];
    const result = calculateDocumentTotals(items, 'fixed', 0, 0);
    expect(result).toHaveProperty('subtotal');
    expect(result).toHaveProperty('discountAmount');
    expect(result).toHaveProperty('taxableAmount');
    expect(result).toHaveProperty('taxAmount');
    expect(result).toHaveProperty('additionalTaxAmount');
    expect(result).toHaveProperty('total');
  });
});
