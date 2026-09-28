import React, { useState } from 'react';
import { User, Calendar, Plus, Trash2, Eye, Save, Camera, ChevronDown, Mic } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Client, Article, DocumentItem, DiscountType, Quote, CompanySettings } from '../../types';
import { formatCurrency, getTodayFormatted, getFutureDateFormatted } from '../../utils/formatting';
import { calculateDocumentTotals } from '../../utils/calculations';
import { VoiceDictationModal } from '../../components/VoiceDictationModal/VoiceDictationModal';
import { DocumentPdfData } from '../../utils/pdfGenerator';

interface QuoteFormScreenProps {
  initialQuote?: Quote | null;
  clients: Client[];
  articles: Article[];
  settings: CompanySettings;
  onSave: (quote: Quote) => void;
  onBack: () => void;
  onOpenPreview: (data: DocumentPdfData) => void;
  onOpenPhotoScan: () => void;
}

export const QuoteFormScreen: React.FC<QuoteFormScreenProps> = ({
  initialQuote,
  clients,
  articles,
  settings,
  onSave,
  onBack,
  onOpenPreview,
  onOpenPhotoScan,
}) => {
  const [quoteNumber, setQuoteNumber] = useState(
    initialQuote ? initialQuote.number : `DEV-${String(Math.floor(Math.random() * 9000) + 1000)}`
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialQuote ? initialQuote.clientId : clients[0]?.id || ''
  );
  const [date, setDate] = useState<string>(
    initialQuote ? initialQuote.date : getTodayFormatted()
  );
  const [expirationDate, setExpirationDate] = useState<string>(
    initialQuote ? initialQuote.expirationDate : getFutureDateFormatted(30)
  );

  const [items, setItems] = useState<DocumentItem[]>(
    initialQuote ? initialQuote.items : []
  );

  const [discountType, setDiscountType] = useState<DiscountType>(
    initialQuote ? initialQuote.discountType : 'fixed'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialQuote ? initialQuote.discountValue : 0
  );
  const [taxRate, setTaxRate] = useState<number>(
    initialQuote ? initialQuote.taxRate : 0
  );
  const [selectedTaxOption, setSelectedTaxOption] = useState<string>('none');
  const [paymentMode, setPaymentMode] = useState<string>(
    initialQuote ? initialQuote.paymentMode || '' : settings.paymentModes[0] || ''
  );
  const [terms, setTerms] = useState<string>(
    initialQuote ? initialQuote.terms || '' : settings.termsAndConditions[0] || ''
  );

  const [isArticlePickerOpen, setIsArticlePickerOpen] = useState(false);
  const [isVoiceDictationOpen, setIsVoiceDictationOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [customItemQty, setCustomItemQty] = useState<number>(1);

  // Calculations
  const totals = calculateDocumentTotals(items, discountType, discountValue, taxRate);

  const handleAddCatalogArticle = (art: Article) => {
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      articleId: art.id,
      name: art.name,
      description: art.description,
      quantity: 1,
      unitPrice: art.unitPrice,
      total: art.unitPrice,
    };
    setItems((prev) => [...prev, newItem]);
    setIsArticlePickerOpen(false);
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      name: customItemName.trim(),
      quantity: Math.max(1, customItemQty),
      unitPrice: Math.max(0, customItemPrice),
      total: Math.max(1, customItemQty) * Math.max(0, customItemPrice),
    };
    setItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemPrice(0);
    setCustomItemQty(1);
    setIsArticlePickerOpen(false);
  };

  const handleUpdateItemQuantity = (id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, newQty),
              total: Math.max(1, newQty) * item.unitPrice,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    const newQuote: Quote = {
      id: initialQuote ? initialQuote.id : crypto.randomUUID(),
      number: quoteNumber,
      clientId: selectedClientId,
      date,
      expirationDate,
      items,
      subtotal: totals.subtotal,
      discountType,
      discountValue,
      taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      paymentMode,
      terms,
      status: initialQuote ? initialQuote.status : 'pending',
      scannedPagesUrls: initialQuote?.scannedPagesUrls,
      createdAt: initialQuote ? initialQuote.createdAt : new Date().toISOString(),
    };
    onSave(newQuote);
  };

  const handleOpenApercu = () => {
    const selectedClient = clients.find((c) => c.id === selectedClientId);
    onOpenPreview({
      documentType: 'quote',
      number: quoteNumber,
      client: selectedClient,
      date,
      dueDateOrExpiration: expirationDate,
      items,
      subtotal: totals.subtotal,
      discountType,
      discountValue,
      discountAmount: totals.discountAmount,
      taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      paymentMode,
      terms,
      settings,
      scannedPagesUrls: initialQuote?.scannedPagesUrls,
    });
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {/* Document Number Banner (Matching screenshot 6) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5  flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Devis N°
            </span>
            <input
              type="text"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="text-base font-extrabold text-slate-700 bg-transparent focus:outline-none focus:border-b-2 focus:border-amber-600 w-36"
            />
          </div>
          <button
            type="button"
            onClick={onOpenPhotoScan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold transition-all "
          >
            <Camera className="w-3.5 h-3.5 text-amber-600" />
            <span>Scanner photo</span>
          </button>
        </div>

        {initialQuote?.scannedPagesUrls && initialQuote.scannedPagesUrls.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium">
                {initialQuote.scannedPagesUrls.length} pages
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Devis issu d'un scan multi-pages ({initialQuote.scannedPagesUrls.length} feuillets)
                </p>
                <p className="text-[11px] text-amber-700">
                  Tous les feuillets originaux sont annexés au devis PDF complet.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenApercu}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 shadow-2xs transition-colors shrink-0"
            >
              Aperçu
            </button>
          </div>
        )}

        {/* Client Selector (Matching screenshot 6) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5  space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Client
          </label>
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 px-3 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {clients.length === 0 && (
                <option value="">Client inconnu</option>
              )}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          {selectedClient && (
            <p className="text-[11px] text-slate-400 px-1">
              {selectedClient.phone || 'Email non fourni'} • {selectedClient.address || 'Abidjan'}
            </p>
          )}
        </div>

        {/* Dates Row (Matching screenshot 6: Date d'émission & Expiration) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-slate-200 p-3  space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>Date d'émission</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-bold text-xs text-slate-900 bg-transparent focus:outline-none"
              placeholder="14/09/2026"
            />
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-3  space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>Expiration</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="text"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full font-bold text-xs text-slate-900 bg-transparent focus:outline-none"
              placeholder="14/10/2026"
            />
          </div>
        </div>

        {/* Articles/Services Section (Matching screenshot 6) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5  space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Articles/Services</h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsVoiceDictationOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md text-xs font-bold active:scale-95 transition-all "
                title="Dictée Vocale Rapide Chantier"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Dicter</span>
              </button>
              <button
                type="button"
                onClick={() => setIsArticlePickerOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold active:scale-95 transition-all "
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-md">
              <p className="text-xs text-slate-400 italic">Aucun article ajouté.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Cliquez sur + Ajouter ou scannez une photo
              </p>
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatCurrency(item.unitPrice, settings.currency)} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-extrabold text-slate-900 min-w-[70px] text-right">
                      {formatCurrency(item.total, settings.currency)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Adjustments (Matching screenshots 6, 11) */}
        <div className="bg-white rounded-lg border border-slate-200 p-4  space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
            <span>Sous-total:</span>
            <span className="text-sm font-extrabold text-slate-900">
              {formatCurrency(totals.subtotal, settings.currency)}
            </span>
          </div>

          {/* Remise */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 min-w-[60px]">Remise:</span>
            <div className="flex items-center gap-1.5 flex-1 max-w-[220px]">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-700 focus:outline-none"
              >
                <option value="fixed">Montant fixe</option>
                <option value="percent">Pourcentage</option>
              </select>
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-right text-slate-900 focus:outline-none"
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {discountType === 'fixed' ? settings.currency : '%'}
              </span>
            </div>
          </div>

          {/* Taux de TVA */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">Taux de TVA:</span>
            <div className="flex items-center gap-1.5 max-w-[130px]">
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate || ''}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-right text-slate-900 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          {/* Montant TVA */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Montant TVA:</span>
            <span className="font-bold text-slate-800">
              {formatCurrency(totals.taxAmount, settings.currency)}
            </span>
          </div>

          {/* Taxe / Impôt selector */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-slate-500">Taxe / Impôt</label>
            <select
              value={selectedTaxOption}
              onChange={(e) => {
                setSelectedTaxOption(e.target.value);
                if (e.target.value === '18') setTaxRate(18);
                else if (e.target.value === '5') setTaxRate(5);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-xs text-slate-700"
            >
              <option value="none">Aucune taxe (ajoutez-en via Paramètres &gt; Impôts / Taxes)</option>
              <option value="18">TVA standard (18%)</option>
              <option value="5">Prestation de service (5%)</option>
            </select>
          </div>

          {/* TOTAL (Matching screenshot 11) */}
          <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              TOTAL:
            </span>
            <span className="text-lg font-black text-slate-700">
              {formatCurrency(totals.total, settings.currency)}
            </span>
          </div>
        </div>

        {/* Mode de paiement & Termes et conditions (Matching screenshot 11) */}
        <div className="bg-white rounded-lg border border-slate-200 p-4  space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Mode de paiement</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 px-3 text-xs text-slate-800"
            >
              {settings.paymentModes.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Termes et conditions</label>
            <select
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 px-3 text-xs text-slate-800"
            >
              {settings.termsAndConditions.map((t, i) => (
                <option key={i} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 shadow-lg flex items-center gap-3 z-30">
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={handleOpenApercu}
          icon={Eye}
          className="font-bold text-slate-700"
        >
          Aperçu
        </Button>

        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleSave}
          icon={Save}
          className="font-bold shadow-md bg-slate-900 hover:bg-slate-800"
        >
          Enregistrer
        </Button>
      </div>

      {/* Article Picker Sheet */}
      {isArticlePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-lg shadow-xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <span className="text-sm font-bold">Sélectionner un article</span>
              <button
                type="button"
                onClick={() => setIsArticlePickerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Catalogue existant ({articles.length})
                </span>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md">
                  {articles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleAddCatalogArticle(art)}
                      className="p-2.5 hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{art.name}</p>
                        <p className="text-[10px] text-slate-400">{art.description}</p>
                      </div>
                      <span className="font-extrabold text-slate-700">
                        {formatCurrency(art.unitPrice, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Or Quick Create Custom item */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Ou ajouter un article personnalisé
                </span>
                <input
                  type="text"
                  placeholder="Nom de l'article"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Prix unitaire"
                    value={customItemPrice || ''}
                    onChange={(e) => setCustomItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Quantité"
                    value={customItemQty || ''}
                    onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={handleAddCustomItem}
                  disabled={!customItemName.trim()}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  Ajouter cet article
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Voice Dictation Modal for Hands-free Job Site Input */}
      <VoiceDictationModal
        isOpen={isVoiceDictationOpen}
        onClose={() => setIsVoiceDictationOpen(false)}
        documentType="quote"
        currency={settings.currency}
        onAddItems={(newItems) => setItems((prev) => [...prev, ...newItems])}
      />
    </div>
  );
};
