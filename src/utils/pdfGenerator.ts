import { jsPDF } from 'jspdf';
import { CompanySettings, DocumentItem, Client } from '../types';
import { formatCurrency, formatDate } from './formatting';
import { generatePaymentQrDataUrl } from './qrCode';

export interface DocumentPdfData {
  documentType: 'quote' | 'invoice';
  number: string;
  client?: Client;
  date: string;
  dueDateOrExpiration: string;
  items: DocumentItem[];
  subtotal: number;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  additionalTaxName?: string;
  additionalTaxRate?: number;
  additionalTaxAmount?: number;
  total: number;
  paymentMode?: string;
  terms?: string;
  settings: CompanySettings;
  scannedPagesUrls?: string[];
  appendScannedPages?: boolean;
}

/**
 * Converts a hex color string (e.g. #2563eb) to an RGB tuple [r, g, b]
 */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex) return [37, 99, 235];
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [37, 99, 235];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Rasterizes any image (Data URL, SVG, or remote URL) to a PNG base64 Data URL for jsPDF
 */
export function rasterizeImageToDataUrl(src?: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!src || src.trim() === '') {
      return resolve(null);
    }

    // Direct PNG/JPEG base64 check
    if (src.startsWith('data:image/png;base64,') || src.startsWith('data:image/jpeg;base64,')) {
      return resolve(src);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      resolve(null);
    }, 2500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const scale = 2; // Hi-DPI
        const width = img.naturalWidth || img.width || 320;
        const height = img.naturalHeight || img.height || 160;
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Image rasterization fallback warning:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = src;
  });
}

export type DocumentTemplateStyle = 'modern' | 'btp' | 'elegant';

export function resolveDocumentTemplate(templateName?: string): DocumentTemplateStyle {
  if (!templateName) return 'modern';
  const lower = templateName.toLowerCase();
  if (lower.includes('btp') || lower.includes('chantier')) return 'btp';
  if (lower.includes('elegant') || lower.includes('élégant') || lower.includes('prestation')) return 'elegant';
  return 'modern';
}

/**
 * Builds a vector PDF document using jsPDF with adaptive content flow
 */
export async function buildDocumentPdf(data: DocumentPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isQuote = data.documentType === 'quote';
  const themeHex = isQuote ? (data.settings.quoteColor || '#2563EB') : (data.settings.invoiceColor || '#2563EB');
  const [tr, tg, tb] = hexToRgb(themeHex);
  const docTitle = isQuote ? 'DEVIS' : 'FACTURE';
  const dateDueLabel = isQuote ? 'Date d’expiration' : 'Date d’échéance';

  const templateStyle = resolveDocumentTemplate(data.settings.documentTemplate);

  const marginX = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - marginX * 2; // 182 mm
  let currentY = 15;

  // Pre-rasterize any user images asynchronously (logo, signature/stamp, footer banner, payment QR)
  const [logoPng, stampPng, footerPng, paymentQrPng] = await Promise.all([
    rasterizeImageToDataUrl(data.settings.logoUrl || data.settings.headerImageUrl),
    rasterizeImageToDataUrl(data.settings.signatureImageUrl || (data.settings.signatureUrl?.includes('iconify') ? undefined : data.settings.signatureUrl)),
    rasterizeImageToDataUrl(data.settings.footerImageUrl),
    generatePaymentQrDataUrl({
      companyName: data.settings.name || 'ArchiFact Studio',
      documentType: data.documentType,
      number: data.number,
      total: data.total,
      currency: data.settings.currency || 'FCFA',
      phone: data.settings.phone,
      paymentMode: data.paymentMode,
    }),
  ]);

  // Top Accent Banner for Elegant or BTP styles
  if (templateStyle === 'elegant') {
    doc.setFillColor(tr, tg, tb);
    doc.rect(marginX, 10, contentWidth, 2.5, 'F');
    currentY = 16;
  } else if (templateStyle === 'btp') {
    // Technical BTP Top Stripe
    doc.setFillColor(tr, tg, tb);
    doc.rect(marginX, 10, contentWidth, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('DOCUMENT TECHNIQUE BTP & CHANTIER • HAUTE PRÉCISION', marginX + 3, 12.8);
    currentY = 18;
  }

  // 1. HEADER SECTION
  let textStartX = marginX;
  let logoBottomY = currentY;

  // Render logo if provided
  if (logoPng) {
    try {
      const logoWidth = 26;
      const logoHeight = 16;
      doc.addImage(logoPng, 'PNG', marginX, currentY, logoWidth, logoHeight);
      textStartX = marginX + logoWidth + 4;
      logoBottomY = currentY + logoHeight;
    } catch (e) {
      console.warn('Error placing logo in PDF', e);
    }
  }

  // Company Name
  if (templateStyle === 'elegant') {
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
  }
  doc.setTextColor(15, 23, 42); // slate-900
  const companyName = data.settings.name || 'Mon Entreprise';
  doc.text(companyName, textStartX, currentY + 4);

  let compY = currentY + 8;

  // Header Subtitle / Custom Text if present
  if (data.settings.headerText) {
    doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(tr, tg, tb);
    doc.text(data.settings.headerText, textStartX, compY);
    compY += 3.8;
  }

  // Company Metadata
  doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500

  if (data.settings.legalStatus) {
    doc.text(data.settings.legalStatus, textStartX, compY);
    compY += 3.6;
  }
  if (data.settings.address) {
    doc.text(data.settings.address, textStartX, compY);
    compY += 3.6;
  }
  if (data.settings.phone) {
    doc.text(`Tél : ${data.settings.phone}`, textStartX, compY);
    compY += 3.6;
  }
  if (data.settings.email) {
    doc.text(`Email : ${data.settings.email}`, textStartX, compY);
    compY += 3.6;
  }
  if (data.settings.taxId) {
    doc.text(`NIF/SIRET : ${data.settings.taxId}`, textStartX, compY);
    compY += 3.6;
  }

  // Right: Document Title & Badge
  const badgeWidth = templateStyle === 'btp' ? 68 : 62;
  const badgeHeight = 11;
  const badgeX = pageWidth - marginX - badgeWidth;
  const badgeY = currentY;

  if (templateStyle === 'modern') {
    doc.setFillColor(tr, tg, tb);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${docTitle} N° ${data.number}`, badgeX + badgeWidth / 2, badgeY + 7.2, { align: 'center' });
  } else if (templateStyle === 'btp') {
    // Technical double border box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(tr, tg, tb);
    doc.setLineWidth(0.8);
    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(tr, tg, tb);
    doc.text(`${docTitle} BTP • ${data.number}`, badgeX + badgeWidth / 2, badgeY + 7.2, { align: 'center' });
  } else {
    // Elegant style: Gold/theme outlined pill
    doc.setFillColor(tr, tg, tb);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`${docTitle} • ${data.number}`, badgeX + badgeWidth / 2, badgeY + 7.2, { align: 'center' });
  }

  // Divider line - cleanly adapts to whichever header element is taller
  currentY = Math.max(compY, logoBottomY, badgeY + badgeHeight) + 3.5;
  doc.setDrawColor(templateStyle === 'btp' ? 180 : 226, templateStyle === 'btp' ? 180 : 232, templateStyle === 'btp' ? 180 : 240);
  doc.setLineWidth(templateStyle === 'btp' ? 0.6 : 0.35);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4.5;

  // 2. CLIENT & DATES BOX
  const boxY = currentY;
  const boxHeight = 23;

  if (templateStyle === 'modern') {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.roundedRect(marginX, boxY, contentWidth, boxHeight, 2, 2, 'FD');
  } else if (templateStyle === 'btp') {
    // Technical 2-column box with grid line in center
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.rect(marginX, boxY, contentWidth, boxHeight, 'FD');
    // Middle vertical dividing line
    doc.line(marginX + contentWidth / 2, boxY, marginX + contentWidth / 2, boxY + boxHeight);
  } else {
    // Elegant style: Soft tinted box with vertical accent line
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(230, 235, 245);
    doc.roundedRect(marginX, boxY, contentWidth, boxHeight, 2, 2, 'FD');
    doc.setFillColor(tr, tg, tb);
    doc.rect(marginX, boxY, 2.5, boxHeight, 'F');
  }

  // Client Details (Left)
  const clientX = templateStyle === 'elegant' ? marginX + 6 : marginX + 4;
  doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(templateStyle === 'btp' ? tr : 148, templateStyle === 'btp' ? tg : 163, templateStyle === 'btp' ? tb : 184);
  const clientHeaderLabel = templateStyle === 'btp'
    ? (isQuote ? 'MAÎTRE D’OUVRAGE / CLIENT :' : 'CLIENT / FACTURÉ À :')
    : (isQuote ? 'DEVIS POUR :' : 'FACTURÉ À :');
  doc.text(clientHeaderLabel, clientX, boxY + 5);

  doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const clientName = data.client?.name || 'Client';
  doc.text(clientName, clientX, boxY + 9.5);

  doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  let clientExtraY = boxY + 13.8;
  if (data.client?.phone) {
    doc.text(`Tél : ${data.client.phone}`, clientX, clientExtraY);
    clientExtraY += 3.6;
  }
  if (data.client?.email) {
    doc.text(data.client.email, clientX, clientExtraY);
  }

  // Dates (Right)
  const dateColX = pageWidth - marginX - 4;
  doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(templateStyle === 'btp' ? tr : 148, templateStyle === 'btp' ? tg : 163, templateStyle === 'btp' ? tb : 184);
  doc.text('DATE D’ÉMISSION', dateColX, boxY + 5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(formatDate(data.date), dateColX, boxY + 9.5, { align: 'right' });

  doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(templateStyle === 'btp' ? tr : 148, templateStyle === 'btp' ? tg : 163, templateStyle === 'btp' ? tb : 184);
  doc.text(dateDueLabel.toUpperCase(), dateColX, boxY + 14.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(formatDate(data.dueDateOrExpiration), dateColX, boxY + 19, { align: 'right' });

  currentY = boxY + boxHeight + 4.5;

  // 3. ITEMS TABLE
  const tableHeaderHeight = 7.5;
  doc.setFillColor(tr, tg, tb);
  if (templateStyle === 'modern') {
    doc.roundedRect(marginX, currentY, contentWidth, tableHeaderHeight, 1.5, 1.5, 'F');
  } else if (templateStyle === 'btp') {
    doc.rect(marginX, currentY, contentWidth, tableHeaderHeight, 'F');
  } else {
    doc.roundedRect(marginX, currentY, contentWidth, tableHeaderHeight, 2, 2, 'F');
  }

  // Columns Widths - Adaptive per template
  const isBtp = templateStyle === 'btp';
  const colRefX = marginX + 3;
  const colDescrX = isBtp ? marginX + 16 : marginX + 3;
  const colUnitX = isBtp ? marginX + 96 : 0;
  const colQtyX = isBtp ? marginX + 112 : marginX + 105;
  const colUnitPriceX = marginX + 138;
  const colTotalX = pageWidth - marginX - 3;

  doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  if (isBtp) {
    doc.text('RÉF', colRefX, currentY + 5);
    doc.text('DÉSIGNATION TRAVAUX / FOURNITURES', colDescrX, currentY + 5);
    doc.text('UNITÉ', colUnitX, currentY + 5, { align: 'center' });
    doc.text('QTÉ', colQtyX, currentY + 5, { align: 'center' });
  } else {
    doc.text('DÉSIGNATION DES PRESTATIONS & ARTICLES', colDescrX, currentY + 5);
    doc.text('QTÉ', colQtyX, currentY + 5, { align: 'center' });
  }
  doc.text('PRIX UNIT', colUnitPriceX, currentY + 5, { align: 'right' });
  doc.text('TOTAL HT', colTotalX, currentY + 5, { align: 'right' });

  currentY += tableHeaderHeight;

  const pageHeight = 297;

  // Table Body Rows
  const items = data.items || [];
  if (items.length === 0) {
    currentY += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Aucun article ajouté', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
  } else {
    items.forEach((item, index) => {
      const rowHeight = item.description ? 10.5 : 7.5;

      // Multi-page break check for table items
      if (currentY + rowHeight > pageHeight - 30) {
        doc.addPage();
        currentY = 16;

        // Running continuation header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(tr, tg, tb);
        doc.text(`${docTitle} N° ${data.number} • Suite`, marginX, currentY);
        currentY += 4.5;

        // Repeat table header row
        doc.setFillColor(tr, tg, tb);
        doc.rect(marginX, currentY, contentWidth, tableHeaderHeight, 'F');
        doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        if (isBtp) {
          doc.text('RÉF', colRefX, currentY + 5);
          doc.text('DÉSIGNATION TRAVAUX / FOURNITURES', colDescrX, currentY + 5);
          doc.text('UNITÉ', colUnitX, currentY + 5, { align: 'center' });
          doc.text('QTÉ', colQtyX, currentY + 5, { align: 'center' });
        } else {
          doc.text('DÉSIGNATION', colDescrX, currentY + 5);
          doc.text('QTÉ', colQtyX, currentY + 5, { align: 'center' });
        }
        doc.text('PRIX UNIT', colUnitPriceX, currentY + 5, { align: 'right' });
        doc.text('TOTAL HT', colTotalX, currentY + 5, { align: 'right' });
        currentY += tableHeaderHeight;
      }

      const rowY = currentY;
      const isEven = index % 2 === 0;

      if (!isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, rowY, contentWidth, rowHeight, 'F');
      }

      // If BTP, render line item reference number
      if (isBtp) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const refCode = `${String(index + 1).padStart(2, '0')}`;
        doc.text(refCode, colRefX, rowY + 5);

        // Unit
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const guessedUnit = item.name.toLowerCase().includes('sac')
          ? 'sac'
          : item.name.toLowerCase().includes('peinture') || item.name.toLowerCase().includes('pot')
          ? 'pot'
          : item.name.toLowerCase().includes('jour')
          ? 'j'
          : item.name.toLowerCase().includes('heure')
          ? 'h'
          : 'u';
        doc.text(guessedUnit, colUnitX, rowY + 5, { align: 'center' });
      }

      // Name
      doc.setFont(templateStyle === 'elegant' ? 'times' : 'helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(item.name || 'Article', colDescrX, rowY + 5);

      // Quantity
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(String(item.quantity), colQtyX, rowY + 5, { align: 'center' });

      // Unit price
      doc.text(formatCurrency(item.unitPrice, data.settings.currency), colUnitPriceX, rowY + 5, { align: 'right' });

      // Total
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const rowTotal = item.total || (item.quantity * item.unitPrice);
      doc.text(formatCurrency(rowTotal, data.settings.currency), colTotalX, rowY + 5, { align: 'right' });

      if (item.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(item.description, colDescrX, rowY + 8.5);
      }

      // Row separator
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(marginX, rowY + rowHeight, pageWidth - marginX, rowY + rowHeight);

      currentY += rowHeight;
    });

    if (isBtp) {
      // Outer grid boundary for BTP
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(marginX, currentY - items.length * 7.5 - tableHeaderHeight, contentWidth, items.length * 7.5 + tableHeaderHeight);
    }
  }

  currentY += 3.5;

  // Check if totals + closing fit on current page; if not, break to new page
  const requiredClosingHeight = 65;
  if (currentY + requiredClosingHeight > pageHeight - 15) {
    doc.addPage();
    currentY = 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(tr, tg, tb);
    doc.text(`${docTitle} N° ${data.number} • Règlement & Clôture`, marginX, currentY);
    currentY += 6;
  }

  // 4. TOTALS SUMMARY (Right aligned box)
  const totalsBoxWidth = 78;
  const totalsX = pageWidth - marginX - totalsBoxWidth;

  const renderTotalLine = (label: string, value: string, isBold: boolean = false, textColor: [number, number, number] = [71, 85, 105]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(label, totalsX, currentY + 3.8);
    doc.text(value, pageWidth - marginX - 2, currentY + 3.8, { align: 'right' });
    currentY += 4.8;
  };

  renderTotalLine('Sous-total :', formatCurrency(data.subtotal, data.settings.currency));

  if (data.discountAmount > 0) {
    const discLabel = `Remise (${data.discountType === 'percent' ? `${data.discountValue}%` : 'Fixe'}) :`;
    renderTotalLine(discLabel, `-${formatCurrency(data.discountAmount, data.settings.currency)}`, true, [5, 150, 105]);
  }

  if (data.taxRate > 0) {
    renderTotalLine(`TVA (${data.taxRate}%) :`, formatCurrency(data.taxAmount, data.settings.currency));
  }

  if (data.additionalTaxAmount && data.additionalTaxAmount > 0) {
    const addTaxName = data.additionalTaxName || 'Taxe';
    renderTotalLine(`${addTaxName} :`, formatCurrency(data.additionalTaxAmount, data.settings.currency));
  }

  // Grand Total Banner
  currentY += 1.5;
  const grandTotalHeight = 8.5;
  doc.setFillColor(tr, tg, tb);
  doc.roundedRect(totalsX, currentY, totalsBoxWidth, grandTotalHeight, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  const totalLabel = isQuote ? 'TOTAL :' : 'TOTAL À PAYER :';
  doc.text(totalLabel, totalsX + 3, currentY + 5.7);
  doc.text(formatCurrency(data.total, data.settings.currency), pageWidth - marginX - 3, currentY + 5.7, { align: 'right' });

  // 5. PAYMENT TERMS & SIGNATURE - Seamlessly follows totals with NO giant voids
  currentY = currentY + grandTotalHeight + 4.5;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 3.5;

  const notesY = currentY;
  let termsEndY = notesY;

  // Payment terms & Conditions (Left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const qrBoxWidth = paymentQrPng ? 34 : 0;
  const sigBoxWidth = 48;
  const sigBoxHeight = 22;
  const sigBoxX = pageWidth - marginX - sigBoxWidth;
  const sigBoxY = notesY;
  const qrBoxX = sigBoxX - qrBoxWidth - 4;
  const qrBoxY = notesY;
  const leftColWidth = paymentQrPng ? (qrBoxX - marginX - 4) : 98;

  if (data.paymentMode) {
    doc.text('Mode de paiement :', marginX, currentY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(data.paymentMode, marginX + 28, currentY + 3);
    currentY += 4.5;
  }

  if (data.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Conditions :', marginX, currentY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const splitTerms = doc.splitTextToSize(data.terms, leftColWidth);
    doc.text(splitTerms, marginX + 20, currentY + 3);
    currentY += splitTerms.length * 3.6;
  }
  termsEndY = currentY;

  // Flash Code Paiement Mobile (Center side)
  if (paymentQrPng) {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrBoxX, qrBoxY, qrBoxWidth, sigBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SCANNER POUR PAYER', qrBoxX + qrBoxWidth / 2, qrBoxY + 3.2, { align: 'center' });

    try {
      const qrSize = 14;
      doc.addImage(paymentQrPng, 'PNG', qrBoxX + (qrBoxWidth - qrSize) / 2, qrBoxY + 4, qrSize, qrSize);
    } catch (e) {
      console.warn('Error adding QR code image', e);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Wave • Mobile Money', qrBoxX + qrBoxWidth / 2, qrBoxY + sigBoxHeight - 1.2, { align: 'center' });
  }

  // Signature & Cachet Box (Right side)

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(sigBoxX, sigBoxY, sigBoxWidth, sigBoxHeight, 2, 2, 'FD');
  doc.setLineDashPattern([], 0); // reset dash

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('SIGNATURE & CACHET', sigBoxX + sigBoxWidth / 2, sigBoxY + 3.8, { align: 'center' });

  if (stampPng) {
    try {
      doc.addImage(stampPng, 'PNG', sigBoxX + 3, sigBoxY + 4.8, sigBoxWidth - 6, sigBoxHeight - 6.5);
    } catch {
      // Fallback below
    }
  } else {
    // Professional signature cursive without broken emoji
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(tr, tg, tb);
    doc.text(companyName, sigBoxX + sigBoxWidth / 2, sigBoxY + 12.5, { align: 'center' });

    // Elegant vector pen flourish underline
    doc.setDrawColor(tr, tg, tb);
    doc.setLineWidth(0.3);
    doc.line(sigBoxX + 8, sigBoxY + 15.5, sigBoxX + sigBoxWidth - 8, sigBoxY + 15.5);
  }

  // 6. FOOTER SECTION - Adapts directly to the content of the page
  currentY = Math.max(termsEndY, sigBoxY + sigBoxHeight) + 5;

  // Custom footer image / banner if provided
  if (footerPng) {
    try {
      const footerImgWidth = contentWidth;
      const footerImgHeight = 14;
      doc.addImage(footerPng, 'PNG', marginX, currentY, footerImgWidth, footerImgHeight);
      currentY += footerImgHeight + 3;
    } catch (e) {
      console.warn('Error adding footer banner', e);
    }
  }

  // Custom footer text (e.g. Bank Account / RIB, RCCM, legal notices) if provided
  if (data.settings.footerText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const splitFooter = doc.splitTextToSize(data.settings.footerText, contentWidth);
    doc.text(splitFooter, pageWidth / 2, currentY + 3, { align: 'center' });
    currentY += splitFooter.length * 3.4 + 2;
  }

  // 7. ANNEXES DES SCANS NUMÉRISÉS (Association des pages scannées en document complet)
  if (data.scannedPagesUrls && data.scannedPagesUrls.length > 0) {
    for (let pIdx = 0; pIdx < data.scannedPagesUrls.length; pIdx++) {
      const scanUrl = data.scannedPagesUrls[pIdx];
      const rasterizedScan = await rasterizeImageToDataUrl(scanUrl);
      if (rasterizedScan) {
        doc.addPage();

        // En-tête bandeau de l'annexe
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(marginX, 12, contentWidth, 10, 1.5, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(
          `ANNEXE : SCAN NUMÉRISÉ DU DOCUMENT ORIGINAL (FEUILLET ${pIdx + 1} / ${data.scannedPagesUrls.length})`,
          marginX + 4,
          18.5
        );

        // Affichage de l'image scannée centrée et ajustée
        const imgMaxW = contentWidth;
        const imgMaxH = 245;
        try {
          doc.addImage(rasterizedScan, 'PNG', marginX, 26, imgMaxW, imgMaxH, undefined, 'FAST');
        } catch (e) {
          console.warn('Could not add scanned page image to PDF:', e);
        }
      }
    }
  }

  return doc;
}

/**
 * Generates the PDF file name based on document type and number
 */
export function getPdfFileName(documentType: 'quote' | 'invoice', number: string): string {
  const prefix = documentType === 'quote' ? 'Devis' : 'Facture';
  const cleanNum = (number || '001').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${prefix}_${cleanNum}.pdf`;
}

/**
 * Triggers direct browser download of the PDF file
 */
export async function downloadDocumentPdf(data: DocumentPdfData): Promise<string> {
  const doc = await buildDocumentPdf(data);
  const fileName = getPdfFileName(data.documentType, data.number);
  doc.save(fileName);
  return fileName;
}

/**
 * Returns a Blob and File object for sharing via Web Share API
 */
export async function getDocumentPdfBlob(data: DocumentPdfData): Promise<{ blob: Blob; file: File; fileName: string }> {
  const doc = await buildDocumentPdf(data);
  const fileName = getPdfFileName(data.documentType, data.number);
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });
  return { blob, file, fileName };
}

/**
 * Generates a formatted text summary for sharing via WhatsApp, Email, or Clipboard
 */
export function getDocumentShareSummary(data: DocumentPdfData): { subject: string; body: string; whatsappText: string } {
  const isQuote = data.documentType === 'quote';
  const typeLabel = isQuote ? 'Devis' : 'Facture';
  const company = data.settings.name || 'Mon Entreprise';
  const clientName = data.client?.name || 'Client';
  const totalStr = formatCurrency(data.total, data.settings.currency);

  const subject = `${typeLabel} N° ${data.number} - ${company}`;

  const body = `Bonjour ${clientName},

Veuillez trouver ci-joint les détails de votre ${typeLabel.toLowerCase()} N° ${data.number} émise par ${company}.

• Document : ${typeLabel} N° ${data.number}
• Date d'émission : ${formatDate(data.date)}
• ${isQuote ? 'Validité' : 'Échéance'} : ${formatDate(data.dueDateOrExpiration)}
• Nombre d'articles : ${data.items.length}
• Montant total : ${totalStr}

${data.paymentMode ? `• Mode de paiement : ${data.paymentMode}\n` : ''}${data.terms ? `• Conditions : ${data.terms}\n` : ''}
Pour toute question, n'hésitez pas à nous contacter par téléphone au ${data.settings.phone || 'notre service client'} ou par email à ${data.settings.email || ''}.

Cordialement,
${company}`;

  const whatsappText = `*${typeLabel.toUpperCase()} N° ${data.number}*
*${company}*
Client : *${clientName}*
Émis le : ${formatDate(data.date)}
${isQuote ? 'Expiration' : 'Échéance'} : ${formatDate(data.dueDateOrExpiration)}
------------------------------------
*TOTAL : ${totalStr}*
------------------------------------
${data.paymentMode ? `Paiement : ${data.paymentMode}\n` : ''}Merci pour votre confiance !`;

  return { subject, body, whatsappText };
}
