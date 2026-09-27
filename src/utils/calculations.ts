import { DocumentItem, DiscountType } from '../types';

export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  additionalTaxAmount: number;
  total: number;
}

export function calculateDocumentTotals(
  items: DocumentItem[],
  discountType: DiscountType,
  discountValue: number,
  taxRate: number,
  additionalTaxRate: number = 0
): CalculationResult {
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = subtotal * (Math.max(0, Math.min(100, discountValue)) / 100);
  } else {
    discountAmount = Math.max(0, Math.min(subtotal, discountValue));
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (Math.max(0, taxRate) / 100);
  const additionalTaxAmount = taxableAmount * (Math.max(0, additionalTaxRate) / 100);
  const total = taxableAmount + taxAmount + additionalTaxAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    additionalTaxAmount,
    total,
  };
}
