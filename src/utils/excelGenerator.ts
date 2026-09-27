import ExcelJS from 'exceljs';
import { DocumentItem } from '../types';
import { DocumentPdfData } from './pdfGenerator';

const headerFill = '1E3A5F';
const accentFill = 'E8EEF5';
const inputFill = 'FFF9E6';
const borderColor = 'CBD5E1';
const currencyFormat = '#,##0.00 [$FCFA]';

function safeFilePart(value: string): string {
  return (value || '001').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getExcelFileName(documentType: DocumentPdfData['documentType'], number: string): string {
  const prefix = documentType === 'quote' ? 'Devis' : 'Facture';
  return `${prefix}_${safeFilePart(number)}.xlsx`;
}

function setBorder(cell: ExcelJS.Cell): void {
  cell.border = {
    top: { style: 'thin', color: { argb: borderColor } },
    left: { style: 'thin', color: { argb: borderColor } },
    bottom: { style: 'thin', color: { argb: borderColor } },
    right: { style: 'thin', color: { argb: borderColor } },
  };
}

function setEditable(cell: ExcelJS.Cell): void {
  cell.protection = { locked: false };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: inputFill } };
}

function addLabelValue(
  worksheet: ExcelJS.Worksheet,
  row: number,
  label: string,
  value: string | number,
  editable = false
): void {
  const labelCell = worksheet.getCell(`A${row}`);
  const valueCell = worksheet.getCell(`B${row}`);
  labelCell.value = label;
  labelCell.font = { bold: true, color: { argb: '475569' } };
  valueCell.value = value;
  setBorder(labelCell);
  setBorder(valueCell);
  if (editable) setEditable(valueCell);
}

function addItemRow(
  worksheet: ExcelJS.Worksheet,
  row: number,
  item: DocumentItem
): void {
  const values: (string | number)[] = [
    item.name,
    item.description || '',
    item.quantity,
    item.unitPrice,
  ];

  values.forEach((value, index) => {
    const cell = worksheet.getCell(row, index + 1);
    cell.value = value;
    setBorder(cell);
    setEditable(cell);
    if (index >= 2) cell.numFmt = index === 2 ? '0.00' : currencyFormat;
  });

  const totalCell = worksheet.getCell(row, 5);
  totalCell.value = { formula: `C${row}*D${row}` };
  totalCell.numFmt = currencyFormat;
  setBorder(totalCell);
}

export async function buildDocumentExcel(data: DocumentPdfData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ArchiFact';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(data.documentType === 'quote' ? 'Devis' : 'Facture', {
    views: [{ showGridLines: false }],
  });

  worksheet.columns = [
    { key: 'name', width: 28 },
    { key: 'description', width: 36 },
    { key: 'quantity', width: 12 },
    { key: 'unitPrice', width: 18 },
    { key: 'total', width: 20 },
  ];

  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = data.documentType === 'quote' ? 'DEVIS' : 'FACTURE';
  worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFF' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill } };
  worksheet.getRow(1).height = 30;

  addLabelValue(worksheet, 3, 'Entreprise', data.settings.name || '');
  addLabelValue(worksheet, 4, 'Coordonnées', [data.settings.address, data.settings.phone, data.settings.email].filter(Boolean).join(' • '));
  addLabelValue(worksheet, 5, 'Numéro', data.number);
  addLabelValue(worksheet, 6, 'Date', data.date);
  addLabelValue(worksheet, 7, data.documentType === 'quote' ? 'Date de validité' : 'Date d’échéance', data.dueDateOrExpiration);
  addLabelValue(worksheet, 8, 'Client', data.client?.name || 'Client');
  addLabelValue(worksheet, 9, 'Adresse client', data.client?.address || '');
  addLabelValue(worksheet, 10, 'Contact client', [data.client?.phone, data.client?.email].filter(Boolean).join(' • '));

  const headerRow = 12;
  ['Désignation', 'Description', 'Quantité', 'Prix unitaire', 'Total'].forEach((value, index) => {
    const cell = worksheet.getCell(headerRow, index + 1);
    cell.value = value;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill } };
    setBorder(cell);
  });

  const firstItemRow = headerRow + 1;
  data.items.forEach((item, index) => addItemRow(worksheet, firstItemRow + index, item));
  const lastItemRow = Math.max(firstItemRow, firstItemRow + data.items.length - 1);
  if (data.items.length === 0) {
    ['Aucun article', '', 0, 0].forEach((value, index) => {
      const cell = worksheet.getCell(firstItemRow, index + 1);
      cell.value = value;
      setBorder(cell);
      setEditable(cell);
    });
    worksheet.getCell(`E${firstItemRow}`).value = { formula: `C${firstItemRow}*D${firstItemRow}` };
    worksheet.getCell(`E${firstItemRow}`).numFmt = currencyFormat;
    setBorder(worksheet.getCell(`E${firstItemRow}`));
  }

  const subtotalRow = lastItemRow + 2;
  const discountTypeRow = subtotalRow + 1;
  const discountValueRow = subtotalRow + 2;
  const discountAmountRow = subtotalRow + 3;
  const taxableRow = subtotalRow + 4;
  const taxRateRow = subtotalRow + 5;
  const taxAmountRow = subtotalRow + 6;
  const additionalTaxRateRow = subtotalRow + 7;
  const additionalTaxAmountRow = subtotalRow + 8;
  const totalRow = subtotalRow + 9;

  const setSummaryRow = (
    row: number,
    label: string,
    value: string | number | { formula: string },
    editable = false
  ) => {
    worksheet.getCell(`D${row}`).value = label;
    worksheet.getCell(`D${row}`).font = { bold: row === totalRow, color: { argb: '334155' } };
    worksheet.getCell(`E${row}`).value = value;
    worksheet.getCell(`E${row}`).numFmt = currencyFormat;
    setBorder(worksheet.getCell(`D${row}`));
    setBorder(worksheet.getCell(`E${row}`));
    if (editable) setEditable(worksheet.getCell(`E${row}`));
  };

  setSummaryRow(subtotalRow, 'Sous-total', { formula: `SUM(E${firstItemRow}:E${lastItemRow})` });
  addLabelValue(worksheet, discountTypeRow, 'Type de remise', data.discountType, true);
  addLabelValue(worksheet, discountValueRow, 'Valeur de remise', data.discountValue, true);
  worksheet.getCell(`B${discountValueRow}`).numFmt = '0.00';
  setSummaryRow(
    discountAmountRow,
    'Remise',
    { formula: `IF(B${discountTypeRow}="percent",E${subtotalRow}*MIN(MAX(B${discountValueRow},0),100)/100,MIN(MAX(B${discountValueRow},0),E${subtotalRow}))` }
  );
  setSummaryRow(taxableRow, 'Total HT', { formula: `MAX(0,E${subtotalRow}-E${discountAmountRow})` });
  addLabelValue(worksheet, taxRateRow, 'TVA (%)', data.taxRate, true);
  setSummaryRow(taxAmountRow, 'TVA', { formula: `E${taxableRow}*MAX(B${taxRateRow},0)/100` });
  addLabelValue(worksheet, additionalTaxRateRow, `${data.additionalTaxName || 'Taxe additionnelle'} (%)`, data.additionalTaxRate || 0, true);
  setSummaryRow(additionalTaxAmountRow, data.additionalTaxName || 'Taxe additionnelle', { formula: `E${taxableRow}*MAX(B${additionalTaxRateRow},0)/100` });
  setSummaryRow(totalRow, 'Total TTC', { formula: `E${taxableRow}+E${taxAmountRow}+E${additionalTaxAmountRow}` });
  worksheet.getCell(`D${totalRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentFill } };
  worksheet.getCell(`E${totalRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentFill } };

  worksheet.mergeCells(`A${totalRow + 2}:E${totalRow + 2}`);
  worksheet.getCell(`A${totalRow + 2}`).value = 'Les cellules jaunes sont modifiables. Les totaux sont calculés par des formules Excel.';
  worksheet.getCell(`A${totalRow + 2}`).font = { italic: true, color: { argb: '64748B' } };
  worksheet.getCell(`A${totalRow + 2}`).alignment = { wrapText: true };

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = cell.alignment || { vertical: 'middle' };
    });
  });

  await worksheet.protect('', {
    selectLockedCells: false,
    selectUnlockedCells: true,
    formatCells: true,
    formatColumns: true,
    formatRows: true,
    insertRows: true,
    deleteRows: true,
  });

  return workbook;
}

export async function downloadDocumentExcel(data: DocumentPdfData): Promise<string> {
  const workbook = await buildDocumentExcel(data);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = getExcelFileName(data.documentType, data.number);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return anchor.download;
}
