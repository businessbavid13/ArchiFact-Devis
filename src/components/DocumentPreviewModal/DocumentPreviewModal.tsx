import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Mail,
  MessageCircle,
  FileDown,
  FileSpreadsheet,
  Loader2,
  ExternalLink,
  SlidersHorizontal,
  Image as ImageIcon,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../Button/Button';
import { CompanySettings, DocumentItem, Client } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import {
  DocumentPdfData,
  downloadDocumentPdf,
  getDocumentPdfBlob,
  getDocumentShareSummary,
  getPdfFileName,
  resolveDocumentTemplate,
} from '../../utils/pdfGenerator';
import { downloadDocumentExcel } from '../../utils/excelGenerator';
import { generatePaymentQrDataUrl } from '../../utils/qrCode';
import {
  SAMPLE_LOGO_BTP,
  SAMPLE_STAMP_OFFICIAL,
} from '../../utils/documentAssets';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  additionalTaxAmount?: number;
  total: number;
  paymentMode?: string;
  terms?: string;
  settings: CompanySettings;
  onUpdateSettings?: (newSettings: Partial<CompanySettings>) => void;
  scannedPagesUrls?: string[];
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documentType,
  number,
  client,
  date,
  dueDateOrExpiration,
  items,
  subtotal,
  discountType,
  discountValue,
  discountAmount,
  taxRate,
  taxAmount,
  additionalTaxName,
  additionalTaxAmount,
  total,
  paymentMode,
  terms,
  settings,
  onUpdateSettings,
  scannedPagesUrls,
}) => {
  // Local mutable settings to allow instant live preview tuning and testing
  const [currentSettings, setCurrentSettings] = useState<CompanySettings>(settings);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isSharingNative, setIsSharingNative] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHeaderFooterCustomizer, setShowHeaderFooterCustomizer] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string>('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  useEffect(() => {
    generatePaymentQrDataUrl({
      companyName: currentSettings.name || 'ArchiFact Studio',
      documentType,
      number,
      total,
      currency: currentSettings.currency || 'FCFA',
      phone: currentSettings.phone,
      paymentMode,
    }).then(setPaymentQrUrl);
  }, [
    currentSettings.name,
    currentSettings.currency,
    currentSettings.phone,
    documentType,
    number,
    total,
    paymentMode,
  ]);

  const updateSettingField = (updates: Partial<CompanySettings>) => {
    setCurrentSettings((prev) => ({ ...prev, ...updates }));
    if (onUpdateSettings) {
      onUpdateSettings(updates);
    }
  };

  if (!isOpen) return null;

  const isQuote = documentType === 'quote';
  const themeColor = isQuote
    ? currentSettings.quoteColor || '#2563EB'
    : currentSettings.invoiceColor || '#2563EB';
  const docTitle = isQuote ? 'DEVIS' : 'FACTURE';
  const dateDueLabel = isQuote ? 'Date d’expiration' : 'Date d’échéance';

  const pdfData: DocumentPdfData = {
    documentType,
    number,
    client,
    date,
    dueDateOrExpiration,
    items,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxRate,
    taxAmount,
    additionalTaxName,
    additionalTaxAmount,
    total,
    paymentMode,
    terms,
    settings: currentSettings,
    scannedPagesUrls,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await new Promise((r) => setTimeout(r, 80));
      await downloadDocumentPdf(pdfData);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsGeneratingExcel(true);
      await downloadDocumentExcel(pdfData);
    } catch (err) {
      console.error('Error generating Excel:', err);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsSharingNative(true);
      const { file } = await getDocumentPdfBlob(pdfData);
      const { subject, whatsappText } = getDocumentShareSummary(pdfData);

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: subject,
          text: `${docTitle} N° ${number} - ${currentSettings.name || 'Mon Entreprise'}`,
        });
        setShowShareModal(false);
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: subject,
          text: whatsappText,
        });
        setShowShareModal(false);
      } else {
        setShowShareModal(true);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled share — do nothing
      } else {
        console.error('Share failed:', err);
        setShowShareModal(true);
      }
    } finally {
      setIsSharingNative(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof CompanySettings
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateSettingField({ [field]: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleWhatsAppShare = () => {
    const { whatsappText } = getDocumentShareSummary(pdfData);
    let url = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    if (client?.phone) {
      const clean = client.phone.replace(/[^0-9]/g, '');
      if (clean) {
        url = `https://wa.me/${clean}?text=${encodeURIComponent(whatsappText)}`;
      }
    }
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleEmailShare = () => {
    const { subject, body } = getDocumentShareSummary(pdfData);
    const targetEmail = client?.email ? encodeURIComponent(client.email) : '';
    const mailto = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleCopySummary = async () => {
    const { whatsappText } = getDocumentShareSummary(pdfData);
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const hasLogo = Boolean(currentSettings.logoUrl || currentSettings.headerImageUrl);
  const hasHeaderText = Boolean(currentSettings.headerText);
  const hasFooterText = Boolean(currentSettings.footerText);
  const hasFooterImage = Boolean(currentSettings.footerImageUrl);
  const hasSignatureImage = Boolean(currentSettings.signatureImageUrl);

  return (
    <>
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-document, #printable-document * {
            visibility: visible;
          }
          #printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Hidden file inputs for direct uploads */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'logoUrl')}
      />
      <input
        ref={stampInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'signatureImageUrl')}
      />
      <input
        ref={footerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'footerImageUrl')}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] relative">
          
          {/* Notification Banner for PDF Download */}
          {downloadSuccess && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>PDF téléchargé avec succès !</span>
            </div>
          )}

          {/* Modal Header Toolbar */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">
                Aperçu {isQuote ? 'Devis' : 'Facture'}
              </span>
              <span
                className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                style={{ backgroundColor: themeColor }}
              >
                {number}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Quick toggle for dynamic header/footer customization */}
              <button
                type="button"
                onClick={() => setShowHeaderFooterCustomizer(!showHeaderFooterCustomizer)}
                className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold px-2.5 ${
                  showHeaderFooterCustomizer
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Personnaliser en-tête et pied de page"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">En-tête & Pied</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition-all"
                title="Télécharger le PDF"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition-all"
                title="Partager le document"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition-all"
                title="Imprimer"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg active:scale-95 transition-all ml-1"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3 Styles Selector (Moderne & Épuré, BTP & Chantier, Élégant / Prestation) */}
          <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-1 overflow-x-auto text-xs shrink-0 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Modèle PDF :
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => updateSettingField({ documentTemplate: 'Moderne & Épuré' })}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                  resolveDocumentTemplate(currentSettings.documentTemplate) === 'modern'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Moderne & Épuré
              </button>
              <button
                type="button"
                onClick={() => updateSettingField({ documentTemplate: 'BTP & Chantier' })}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                  resolveDocumentTemplate(currentSettings.documentTemplate) === 'btp'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                BTP & Chantier
              </button>
              <button
                type="button"
                onClick={() => updateSettingField({ documentTemplate: 'Élégant / Prestation' })}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                  resolveDocumentTemplate(currentSettings.documentTemplate) === 'elegant'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Élégant / Prestation
              </button>
            </div>
          </div>

          {/* Quick Header/Footer Customizer Drawer (Collapsible) */}
          {showHeaderFooterCustomizer && (
            <div className="bg-slate-50 border-b border-slate-200 p-3.5 space-y-3 animate-in slide-in-from-top duration-200 max-h-60 overflow-y-auto text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  En-tête & Pied de page adaptatifs
                </span>
                <span className="text-[11px] text-slate-500 italic">
                  Sans contenu inséré, le document s'adapte sans vide
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. En-tête (Logo + Slogan) */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Logo / En-tête</span>
                    {hasLogo && (
                      <button
                        type="button"
                        onClick={() => updateSettingField({ logoUrl: '', headerImageUrl: '' })}
                        className="text-red-500 hover:text-red-700 flex items-center gap-0.5 text-[10px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3 text-slate-500" />
                      {hasLogo ? 'Changer logo' : 'Ajouter logo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSettingField({ logoUrl: SAMPLE_LOGO_BTP })}
                      className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold"
                    >
                      Exemple BTP
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Texte / Slogan d'en-tête (optionnel) :
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: BTP, Rénovation & Prestations"
                      value={currentSettings.headerText || ''}
                      onChange={(e) => updateSettingField({ headerText: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. Pied de page (Texte & Image) */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Pied de page</span>
                    {(hasFooterText || hasFooterImage) && (
                      <button
                        type="button"
                        onClick={() => updateSettingField({ footerText: '', footerImageUrl: '' })}
                        className="text-red-500 hover:text-red-700 flex items-center gap-0.5 text-[10px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        Vider
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => footerInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3 text-slate-500" />
                      {hasFooterImage ? 'Changer bandeau' : 'Bandeau bas'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettingField({
                          footerText: 'RIB : CI092 01001 02345678901 23 • RCCM : CI-ABJ-2024-B-12345',
                        })
                      }
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold"
                    >
                      Exemple RIB
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Texte pied de page (RIB, RCCM...) :
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: RIB, Coordonnées bancaires, RCCM"
                      value={currentSettings.footerText || ''}
                      onChange={(e) => updateSettingField({ footerText: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Signature & Cachet quick controls */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">Cachet & Signature</span>
                  <span className="text-[10px] text-slate-400">
                    {hasSignatureImage
                      ? 'Cachet officiel actif'
                      : 'Signature automatique cursive sans caractères parasites'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSignatureImage && (
                    <button
                      type="button"
                      onClick={() => updateSettingField({ signatureImageUrl: '' })}
                      className="text-red-500 hover:text-red-700 text-[10px] font-medium"
                    >
                      Effacer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => stampInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                  >
                    Téléverser cachet
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettingField({ signatureImageUrl: SAMPLE_STAMP_OFFICIAL })}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold"
                  >
                    Exemple Cachet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Printable / Rendered Invoice Sheet */}
          <div className="p-4 sm:p-5 overflow-y-auto bg-slate-100 flex-1">
            <div
              id="printable-document"
              className="bg-white rounded-xl shadow-md border border-slate-200 p-5 text-slate-800 text-xs space-y-4 max-w-lg mx-auto transition-opacity"
              style={{
                opacity: (currentSettings.invoiceOpacity ?? 100) / 100,
              }}
            >
              {/* Header info (Adaptive with or without logo & header text) */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Dynamic Logo if provided */}
                  {hasLogo && (
                    <div className="shrink-0">
                      <img
                        src={currentSettings.logoUrl || currentSettings.headerImageUrl}
                        alt="Logo entreprise"
                        className="w-14 h-11 object-contain rounded-md border border-slate-200 bg-white p-0.5"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-slate-900 leading-tight truncate">
                      {currentSettings.name || 'Mon Entreprise'}
                    </h2>
                    {/* Dynamic Header Text if provided */}
                    {currentSettings.headerText && (
                      <p
                        className="text-[11px] font-bold mt-0.5 leading-tight"
                        style={{ color: themeColor }}
                      >
                        {currentSettings.headerText}
                      </p>
                    )}
                    {currentSettings.legalStatus && (
                      <p className="text-[10px] text-slate-400">{currentSettings.legalStatus}</p>
                    )}
                    {currentSettings.address && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{currentSettings.address}</p>
                    )}
                    {currentSettings.phone && (
                      <p className="text-[11px] text-slate-500">{currentSettings.phone}</p>
                    )}
                    {currentSettings.email && (
                      <p className="text-[11px] text-slate-500">{currentSettings.email}</p>
                    )}
                    {currentSettings.taxId && (
                      <p className="text-[10px] text-slate-400">NIF/SIRET : {currentSettings.taxId}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className="px-3 py-1 rounded text-white font-extrabold text-xs tracking-wider inline-block shadow-2xs"
                    style={{ backgroundColor: themeColor }}
                  >
                    {docTitle} N° {number}
                  </div>
                </div>
              </div>

              {/* Client & Date Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {isQuote ? 'Devis pour :' : 'Facturé à :'}
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {client ? client.name : 'Client'}
                  </p>
                  {client?.phone && <p className="text-[11px] text-slate-500">{client.phone}</p>}
                  {client?.email && <p className="text-[11px] text-slate-500">{client.email}</p>}
                  {client?.address && <p className="text-[11px] text-slate-500">{client.address}</p>}
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Date d’émission
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{formatDate(date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {dateDueLabel}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {formatDate(dueDateOrExpiration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className="text-white text-[11px] font-bold"
                      style={{ backgroundColor: themeColor }}
                    >
                      <th className="py-2 px-2.5 rounded-l">Désignation</th>
                      <th className="py-2 px-2 text-center">Qté</th>
                      <th className="py-2 px-2 text-right">Prix Unit</th>
                      <th className="py-2 px-2.5 text-right rounded-r">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                          Aucun article ajouté
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-medium text-slate-800">
                            <div>{item.name}</div>
                            {item.description && (
                              <div className="text-[10px] text-slate-400">{item.description}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600 font-semibold">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-600">
                            {formatCurrency(item.unitPrice, currentSettings.currency)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                            {formatCurrency(item.total || item.quantity * item.unitPrice, currentSettings.currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-60 space-y-1 text-right text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total :</span>
                    <span className="font-semibold">{formatCurrency(subtotal, currentSettings.currency)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>
                        Remise ({discountType === 'percent' ? `${discountValue}%` : 'Fixe'}) :
                      </span>
                      <span>-{formatCurrency(discountAmount, currentSettings.currency)}</span>
                    </div>
                  )}

                  {taxRate > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>TVA ({taxRate}%) :</span>
                      <span className="font-semibold">{formatCurrency(taxAmount, currentSettings.currency)}</span>
                    </div>
                  )}

                  {additionalTaxAmount && additionalTaxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{additionalTaxName || 'Taxe'} :</span>
                      <span className="font-semibold">
                        {formatCurrency(additionalTaxAmount, currentSettings.currency)}
                      </span>
                    </div>
                  )}

                  <div
                    className="flex justify-between text-xs font-black pt-2 border-t-2 text-white px-2 py-1.5 rounded"
                    style={{ backgroundColor: themeColor }}
                  >
                    <span className="uppercase">{isQuote ? 'TOTAL' : 'TOTAL À PAYER'} :</span>
                    <span>{formatCurrency(total, currentSettings.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Payment terms & conditions */}
              <div className="pt-2 border-t border-slate-100 text-[10px] space-y-1">
                {paymentMode && (
                  <p>
                    <span className="font-bold text-slate-600">Mode de paiement : </span>
                    <span className="text-slate-800">{paymentMode}</span>
                  </p>
                )}
                {terms && (
                  <p>
                    <span className="font-bold text-slate-600">Conditions : </span>
                    <span className="text-slate-800">{terms}</span>
                  </p>
                )}
              </div>

              {/* Signature, Flash Code QR & Conditions */}
              <div className="pt-2 flex justify-between items-end border-t border-slate-100 gap-2">
                <div className="text-[10px] text-slate-500 space-y-1 flex-1">
                  <p className="font-semibold text-slate-700">Règlement direct & instantané</p>
                  <p className="text-[9px] text-slate-400">Scannez le QR Code pour régler par Wave ou Mobile Money</p>
                </div>

                {/* QR Code Flash Paiement Mobile */}
                {paymentQrUrl && (
                  <div className="text-center w-28 border border-slate-200 rounded-lg p-1.5 bg-white shadow-2xs shrink-0 flex flex-col items-center">
                    <span className="text-[8px] uppercase font-bold text-slate-600 block mb-0.5">
                      Scanner pour payer
                    </span>
                    <img
                      src={paymentQrUrl}
                      alt="QR Paiement"
                      className="w-14 h-14 object-contain rounded"
                    />
                    <span className="text-[7.5px] font-medium text-slate-400 mt-0.5">
                      Wave • Mobile Money
                    </span>
                  </div>
                )}

                <div className="text-center w-36 border border-dashed border-slate-300 rounded-lg p-2 bg-slate-50/50 shrink-0">
                  <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">
                    Signature & Cachet
                  </span>
                  {hasSignatureImage ? (
                    <img
                      src={currentSettings.signatureImageUrl}
                      alt="Cachet de l'entreprise"
                      className="max-h-11 mx-auto object-contain"
                      style={{
                        transform: `scale(${Math.max(0.4, (currentSettings.signatureScale ?? 100) / 100)})`,
                      }}
                    />
                  ) : (
                    <div
                      className="mx-auto flex flex-col items-center justify-center font-serif italic text-xs h-9"
                      style={{
                        color: themeColor,
                        transform: `scale(${Math.max(0.4, (currentSettings.signatureScale ?? 100) / 100)})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <span className="leading-tight">{currentSettings.name || 'Signature'}</span>
                      <div
                        className="w-16 h-0.5 rounded mt-0.5 opacity-60"
                        style={{ backgroundColor: themeColor }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Adaptive Footer Section (only when user has custom text or banner image) */}
              {(hasFooterImage || hasFooterText) && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {/* Footer banner image if provided */}
                  {hasFooterImage && (
                    <div className="w-full flex justify-center">
                      <img
                        src={currentSettings.footerImageUrl}
                        alt="Bandeau pied de page"
                        className="max-h-12 w-full object-contain rounded"
                      />
                    </div>
                  )}

                  {/* Footer text if provided */}
                  {hasFooterText && (
                    <p className="text-[10px] text-slate-500 text-center leading-relaxed font-normal">
                      {currentSettings.footerText}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Scanned Pages Appendix preview (if document was created from multiple scans) */}
            {scannedPagesUrls && scannedPagesUrls.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {scannedPagesUrls.length} pages
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">
                      Annexes : Feuillets originaux associés au document
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Inclus dans le PDF final
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scannedPagesUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col p-2"
                    >
                      <div className="w-full h-36 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={url}
                          alt={`Scan original ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 mt-1.5 text-center">
                        Feuillet {idx + 1} numérisé
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer with Actions */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none text-slate-600"
                onClick={onClose}
              >
                Fermer
              </Button>

              <Button
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowShareModal(true)}
                icon={Share2}
              >
                Partager
              </Button>
            </div>

            <div className="flex-1 w-full">
              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={isGeneratingPdf || isGeneratingExcel}
                onClick={handleDownloadPdf}
                icon={isGeneratingPdf ? Loader2 : Download}
                className="shadow-sm font-bold bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingPdf ? 'Génération du PDF...' : 'Télécharger le PDF'}
              </Button>
              <Button
                variant="outline"
                size="md"
                fullWidth
                disabled={isGeneratingPdf || isGeneratingExcel}
                onClick={handleDownloadExcel}
                icon={isGeneratingExcel ? Loader2 : FileSpreadsheet}
                className="shadow-sm font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                {isGeneratingExcel ? 'Génération Excel...' : 'Télécharger Excel'}
              </Button>
            </div>
          </div>

          {/* Share Options Drawer / Modal */}
          {showShareModal && (
            <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
              <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3 animate-in slide-in-from-bottom-4 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Partager {docTitle.toLowerCase()} #{number}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {/* Native Share button (WhatsApp, AirDrop, Drive, etc.) */}
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isSharingNative}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        {isSharingNative ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <FileDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Partage d'applications (PDF)
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Envoyer le fichier PDF par WhatsApp, Drive, Mail...
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Direct WhatsApp Share */}
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Envoyer via WhatsApp</p>
                        <p className="text-[10px] text-slate-500">
                          Message formaté pour {client?.name || 'le client'}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Direct Email Share */}
                  <button
                    type="button"
                    onClick={handleEmailShare}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-xs">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Envoyer par Email</p>
                        <p className="text-[10px] text-slate-500">
                          {client?.email ? `À : ${client.email}` : 'Ouvrir l’application de messagerie'}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Copy Details to Clipboard */}
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                        {copiedToClipboard ? (
                          <Check className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {copiedToClipboard ? 'Copié dans le presse-papier !' : 'Copier le récapitulatif'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Texte prêt à coller dans vos messages
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setShowShareModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
