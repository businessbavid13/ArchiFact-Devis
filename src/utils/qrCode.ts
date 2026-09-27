import QRCode from 'qrcode';

export interface PaymentQrInfo {
  companyName: string;
  documentType: 'quote' | 'invoice';
  number: string;
  total: number;
  currency: string;
  phone?: string;
  paymentMode?: string;
}

/**
 * Generates a Data URL QR Code representing payment instructions for the document.
 */
export async function generatePaymentQrDataUrl(info: PaymentQrInfo): Promise<string> {
  const cleanPhone = (info.phone || '').replace(/\s+/g, '');
  
  // Format payload readable by mobile cameras and banking apps
  const qrPayload = `PAIEMENT ${info.documentType === 'invoice' ? 'FACTURE' : 'DEVIS'} ${info.number}
Entreprise: ${info.companyName}
Montant: ${info.total.toLocaleString('fr-FR')} ${info.currency}
Mode: ${info.paymentMode || 'Wave / Mobile Money'}
Contact: ${cleanPhone || 'Non renseigné'}`;

  try {
    const dataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate payment QR code:', err);
    return '';
  }
}
