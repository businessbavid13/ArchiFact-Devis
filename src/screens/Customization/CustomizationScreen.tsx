import React, { useState, useRef } from 'react';
import {
  Palette,
  Check,
  Sliders,
  SlidersHorizontal,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  FileText,
  Building,
  Stamp,
} from 'lucide-react';
import { CompanySettings } from '../../types';
import { COLOR_PALETTE } from '../../data/mockData';
import {
  SAMPLE_LOGO_BTP,
  SAMPLE_LOGO_COMMERCE,
  SAMPLE_STAMP_OFFICIAL,
  SAMPLE_FOOTER_BANNER,
} from '../../utils/documentAssets';

interface CustomizationScreenProps {
  settings: CompanySettings;
  onUpdateSettings: (newSettings: Partial<CompanySettings>) => void;
  onClose: () => void;
}

export const CustomizationScreen: React.FC<CustomizationScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'quote'>('invoice');
  const [activeSection, setActiveSection] = useState<'templates' | 'colors' | 'header' | 'footer' | 'signature'>('templates');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  const currentColor = activeTab === 'invoice' ? settings.invoiceColor : settings.quoteColor;

  const handleColorSelect = (hex: string) => {
    if (activeTab === 'invoice') {
      onUpdateSettings({ invoiceColor: hex });
    } else {
      onUpdateSettings({ quoteColor: hex });
    }
  };

  const handleOpacityChange = (val: number) => {
    onUpdateSettings({ invoiceOpacity: val });
  };

  const handleSignatureScaleChange = (val: number) => {
    onUpdateSettings({ signatureScale: val });
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
        onUpdateSettings({ [field]: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasLogo = Boolean(settings.logoUrl || settings.headerImageUrl);
  const hasHeaderText = Boolean(settings.headerText);
  const hasFooterText = Boolean(settings.footerText);
  const hasFooterImage = Boolean(settings.footerImageUrl);
  const hasSignatureImage = Boolean(settings.signatureImageUrl);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Hidden file inputs */}
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {/* Toggle between Invoice and Quote styling */}
        <div className="bg-slate-200/80 p-1 rounded-md flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'invoice'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Facture
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quote')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'quote'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Devis
          </button>
        </div>

        {/* Live Document Preview Card (Fully adaptive) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 text-[10px] space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Aperçu en direct du document
            </span>
            <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
              Adaptatif
            </span>
          </div>

          <div
            className="space-y-2.5 transition-opacity"
            style={{ opacity: (settings.invoiceOpacity ?? 100) / 100 }}
          >
            {/* Top row: Header with adaptive logo & text */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {hasLogo && (
                  <img
                    src={settings.logoUrl || settings.headerImageUrl}
                    alt="Logo"
                    className="w-10 h-9 object-contain rounded border border-slate-100 p-0.5 bg-white shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                    {settings.name || 'Mon Entreprise'}
                  </p>
                  {hasHeaderText && (
                    <p
                      className="text-[9px] font-bold leading-tight"
                      style={{ color: currentColor }}
                    >
                      {settings.headerText}
                    </p>
                  )}
                  <p className="text-slate-400 text-[9px]">{settings.address || 'Abidjan, Côte d’Ivoire'}</p>
                </div>
              </div>

              <div
                className="px-2 py-0.5 rounded text-white font-extrabold text-[9px] shrink-0"
                style={{ backgroundColor: currentColor }}
              >
                {activeTab === 'invoice' ? 'FACTURE N° FACT-0001' : 'DEVIS N° DEV-0001'}
              </div>
            </div>

            {/* Date & client */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">
                  {activeTab === 'invoice' ? 'Facturé à :' : 'Devis pour :'}
                </span>
                <p className="font-bold text-slate-800 text-[9px]">Client Exemple</p>
              </div>
              <div className="text-right">
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Date</span>
                <p className="font-semibold text-slate-700 text-[9px]">Aujourd'hui</p>
              </div>
            </div>

            {/* Table sample */}
            <table className="w-full text-left">
              <thead>
                <tr className="text-white font-bold text-[9px]" style={{ backgroundColor: currentColor }}>
                  <th className="py-1 px-1.5 rounded-l">Désignation</th>
                  <th className="py-1 px-1 text-center">Qté</th>
                  <th className="py-1 px-1 text-right">Prix Unit</th>
                  <th className="py-1 px-1.5 text-right rounded-r">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[9px]">
                <tr>
                  <td className="py-1 px-1.5 font-medium text-slate-800">Prestation Peinture</td>
                  <td className="py-1 px-1 text-center text-slate-500">2</td>
                  <td className="py-1 px-1 text-right text-slate-500">25 000 FCFA</td>
                  <td className="py-1 px-1.5 text-right font-bold text-slate-900">50 000 FCFA</td>
                </tr>
              </tbody>
            </table>

            {/* Total box */}
            <div className="flex justify-end pt-1">
              <div
                className="px-2 py-1 rounded text-white font-extrabold flex items-center justify-between gap-3 min-w-[140px] text-[10px]"
                style={{ backgroundColor: currentColor }}
              >
                <span>TOTAL :</span>
                <span>50 000 FCFA</span>
              </div>
            </div>

            {/* Signature & Cachet preview */}
            <div className="flex justify-between items-end pt-1 border-t border-slate-100">
              <p className="text-[8px] text-slate-400">Termes : Paiement à réception</p>
              <div className="text-center border border-dashed border-slate-200 rounded p-1 bg-slate-50/50 min-w-[90px]">
                <span className="text-[7px] uppercase text-slate-400 block">Signature</span>
                {hasSignatureImage ? (
                  <img
                    src={settings.signatureImageUrl}
                    alt="Cachet"
                    className="max-h-7 mx-auto object-contain"
                    style={{
                      transform: `scale(${Math.max(0.4, (settings.signatureScale ?? 100) / 100)})`,
                    }}
                  />
                ) : (
                  <div
                    className="font-serif italic text-[10px] h-5 flex flex-col items-center justify-center"
                    style={{
                      color: currentColor,
                      transform: `scale(${Math.max(0.4, (settings.signatureScale ?? 100) / 100)})`,
                      transformOrigin: 'center center',
                    }}
                  >
                    <span>{settings.name || 'Signature'}</span>
                    <span className="w-8 h-0.5 opacity-60 rounded" style={{ backgroundColor: currentColor }} />
                  </div>
                )}
              </div>
            </div>

            {/* Adaptive Footer Elements in Preview */}
            {(hasFooterImage || hasFooterText) && (
              <div className="pt-1.5 border-t border-slate-100 space-y-1">
                {hasFooterImage && (
                  <img
                    src={settings.footerImageUrl}
                    alt="Bandeau pied de page"
                    className="max-h-8 w-full object-contain rounded"
                  />
                )}
                {hasFooterText && (
                  <p className="text-[8px] text-slate-400 text-center leading-tight">
                    {settings.footerText}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs (Modèles, Couleurs, En-tête, Pied de page, Cachet) */}
        <div className="grid grid-cols-5 gap-1 bg-slate-200/70 p-1 rounded-md text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('templates')}
            className={`py-2 px-1 rounded-lg text-center transition-all ${
              activeSection === 'templates'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Modèles
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('colors')}
            className={`py-2 px-1 rounded-lg text-center transition-all ${
              activeSection === 'colors'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Couleurs
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('header')}
            className={`py-2 px-1 rounded-lg text-center transition-all ${
              activeSection === 'header'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            En-tête
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('footer')}
            className={`py-2 px-1 rounded-lg text-center transition-all ${
              activeSection === 'footer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pied page
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('signature')}
            className={`py-2 px-1 rounded-lg text-center transition-all ${
              activeSection === 'signature'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cachet
          </button>
        </div>

        {/* SECTION 0: Modèles de Documents PDF */}
        {activeSection === 'templates' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Styles de Documents PDF Personnalisables
              </h3>
              <p className="text-[11px] text-slate-500">
                Sélectionnez l'un des 3 modèles officiels adaptés à votre corps de métier :
              </p>
            </div>

            {/* Template 1: Moderne & Épuré */}
            <div
              onClick={() => onUpdateSettings({ documentTemplate: 'Moderne & Épuré' })}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer bg-white shadow-xs relative ${
                settings.documentTemplate?.toLowerCase().includes('btp') ||
                settings.documentTemplate?.toLowerCase().includes('elegant') ||
                settings.documentTemplate?.toLowerCase().includes('élégant')
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-900 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">Modèle « Moderne & Épuré »</h4>
                    {!(
                      settings.documentTemplate?.toLowerCase().includes('btp') ||
                      settings.documentTemplate?.toLowerCase().includes('elegant') ||
                      settings.documentTemplate?.toLowerCase().includes('élégant')
                    ) && (
                      <span className="text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    Bordures fines, style international très soigné. Typographie helvétique minimaliste et cartes épurées.
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">Bordures fines 0.25mm</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">Style International</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">Multi-activités</span>
              </div>
            </div>

            {/* Template 2: BTP & Chantier */}
            <div
              onClick={() => onUpdateSettings({ documentTemplate: 'BTP & Chantier' })}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer bg-white shadow-xs relative ${
                settings.documentTemplate?.toLowerCase().includes('btp') ||
                settings.documentTemplate?.toLowerCase().includes('chantier')
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">Modèle « BTP & Chantier »</h4>
                    {(settings.documentTemplate?.toLowerCase().includes('btp') ||
                      settings.documentTemplate?.toLowerCase().includes('chantier')) && (
                      <span className="text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    Structuré, avec détails techniques et colonnes claires (Réf, Unités m²/sac/j, Quantité, PU HT, Total HT, grille renforcée).
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">Bandeau Chantier BTP</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">Colonnes Réf & Unité</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">Maître d'ouvrage</span>
              </div>
            </div>

            {/* Template 3: Élégant / Prestation */}
            <div
              onClick={() => onUpdateSettings({ documentTemplate: 'Élégant / Prestation' })}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer bg-white shadow-xs relative ${
                settings.documentTemplate?.toLowerCase().includes('elegant') ||
                settings.documentTemplate?.toLowerCase().includes('élégant') ||
                settings.documentTemplate?.toLowerCase().includes('prestation')
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">Modèle « Élégant / Prestation »</h4>
                    {(settings.documentTemplate?.toLowerCase().includes('elegant') ||
                      settings.documentTemplate?.toLowerCase().includes('élégant') ||
                      settings.documentTemplate?.toLowerCase().includes('prestation')) && (
                      <span className="text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    En-tête avec accentuation colorée pour consultants et commerces. Typographie avec empattements raffinés et mise en page prestige.
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">Ruban Coloré</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">Typographie Prestige</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">Boutiques & Conseil</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: Couleurs & Style */}
        {activeSection === 'colors' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Color Palette (18 circular swatches) */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-slate-500" />
                  {activeTab === 'invoice' ? 'Couleur de la facture' : 'Couleur du devis'}
                </h3>
                <span
                  className="w-4 h-4 rounded-full border border-slate-200 shadow-xs"
                  style={{ backgroundColor: currentColor }}
                />
              </div>

              {/* Architectural Harmonies */}
              <div className="pt-1 pb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Harmonies Signature ArchiFact
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Atelier Émeraude', invoice: '#0F5132', quote: '#D97706' },
                    { name: 'Chantier Terracotta', invoice: '#C2410C', quote: '#1E3A8A' },
                    { name: 'Graphite & Bronze', invoice: '#1E293B', quote: '#B45309' },
                    { name: 'Bleu Canard Studio', invoice: '#0E7490', quote: '#D97706' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({
                          invoiceColor: preset.invoice,
                          quoteColor: preset.quote,
                        });
                      }}
                      className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition-all text-left group"
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: preset.invoice }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: preset.quote }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 18 Color Swatches in 6-column grid */}
              <div className="grid grid-cols-6 gap-3 py-1">
                {COLOR_PALETTE.map((hex: string) => {
                  const isSelected = currentColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleColorSelect(hex)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-3 ring-offset-2 ring-slate-800 scale-105 shadow-md'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-500" />
                Opacité d'affichage
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Opacité</span>
                  <span className="font-bold text-slate-900">{settings.invoiceOpacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={settings.invoiceOpacity ?? 100}
                  onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: En-tête & Logo */}
        {activeSection === 'header' && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                Logo et En-tête du document
              </h3>
              {hasLogo && (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ logoUrl: '', headerImageUrl: '' })}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer logo
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              L'en-tête s'adapte automatiquement : si aucun logo ni texte n'est renseigné, le PDF ne laisse aucun vide inutile et commence directement par vos informations d'entreprise.
            </p>

            {/* Logo display / upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Logo ou Image d'en-tête :</label>
              <div className="flex items-center gap-3">
                {hasLogo ? (
                  <img
                    src={settings.logoUrl || settings.headerImageUrl}
                    alt="Logo actuel"
                    className="w-16 h-14 object-contain rounded-md border border-slate-200 p-1 bg-white shadow-2xs"
                  />
                ) : (
                  <div className="w-16 h-14 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6 stroke-1" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all shadow-2xs"
                    >
                      {hasLogo ? 'Remplacer l’image' : 'Importer une image'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ logoUrl: SAMPLE_LOGO_BTP })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold"
                    >
                      Exemple BTP
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ logoUrl: SAMPLE_LOGO_COMMERCE })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold"
                    >
                      Exemple Commerce
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Text / Slogan */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">
                Texte d'en-tête / Slogan (optionnel) :
              </label>
              <input
                type="text"
                placeholder="Ex : Travaux BTP, Rénovation & Prestations de Services"
                value={settings.headerText || ''}
                onChange={(e) => onUpdateSettings({ headerText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Ce texte s'affiche juste sous le nom de votre entreprise dans la couleur du document.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: Pied de page & Mentions */}
        {activeSection === 'footer' && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Pied de page adaptatif
              </h3>
              {(hasFooterText || hasFooterImage) && (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ footerText: '', footerImageUrl: '' })}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Effacer
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Si aucun texte ou image n'est ajouté, le document se termine naturellement sans grand espace blanc.
            </p>

            {/* Footer Text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Texte de pied de page (RIB, RCCM, Mentions) :
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      footerText: 'RIB : CI092 01001 02345678901 23 • RCCM : CI-ABJ-2024-B-12345 • Siège : Abidjan Cocody',
                    })
                  }
                  className="text-[10px] font-bold text-emerald-700 hover:underline"
                >
                  Insérer modèle RIB
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Ex : Banque Atlantique - RIB : CI092 01001 02345678901 23&#10;RCCM : CI-ABJ-2024-B-12345"
                value={settings.footerText || ''}
                onChange={(e) => onUpdateSettings({ footerText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            {/* Footer Image Banner */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">
                Bandeau graphique de pied de page (optionnel) :
              </label>
              <div className="flex items-center gap-3">
                {hasFooterImage ? (
                  <img
                    src={settings.footerImageUrl}
                    alt="Bandeau bas de page"
                    className="max-h-12 w-32 object-contain rounded-lg border border-slate-200 p-1 bg-white"
                  />
                ) : (
                  <div className="w-32 h-10 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-[10px]">
                    Aucun bandeau
                  </div>
                )}

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => footerInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold"
                  >
                    {hasFooterImage ? 'Changer l’image' : 'Ajouter une image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ footerImageUrl: SAMPLE_FOOTER_BANNER })}
                    className="block px-2 py-0.5 text-blue-600 hover:underline text-[10px] font-semibold"
                  >
                    Exemple de bandeau
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Signature & Cachet */}
        {activeSection === 'signature' && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Stamp className="w-4 h-4 text-purple-600" />
                Cachet officiel et Signature
              </h3>
              {hasSignatureImage && (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ signatureImageUrl: '' })}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Retirer le cachet
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Téléversez le cachet officiel tamponné de votre entreprise ou votre signature manuscrite. Si aucune image n'est insérée, une signature cursive nette sera automatiquement générée sans aucun caractère parasite.
            </p>

            {/* Cachet image upload & preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {hasSignatureImage ? (
                  <div className="w-24 h-20 rounded-md border border-purple-200 bg-purple-50/30 p-2 flex items-center justify-center">
                    <img
                      src={settings.signatureImageUrl}
                      alt="Cachet actuel"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-20 rounded-md border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-[10px] p-2 text-center">
                    <Stamp className="w-5 h-5 mb-1 text-slate-300" />
                    Signature cursive automatique
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => stampInputRef.current?.click()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-bold transition-all shadow-2xs"
                  >
                    {hasSignatureImage ? 'Changer le cachet' : 'Importer le cachet (photo/PNG)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ signatureImageUrl: SAMPLE_STAMP_OFFICIAL })}
                    className="block px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[10px] font-bold"
                  >
                    Insérer exemple de Cachet Certifié
                  </button>
                </div>
              </div>
            </div>

            {/* Scale slider */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Échelle / Taille de la signature</span>
                <span className="font-bold text-slate-900">{settings.signatureScale ?? 100}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="150"
                value={settings.signatureScale ?? 100}
                onChange={(e) => handleSignatureScaleChange(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
