import React, { useState } from 'react';
import {
  Plus,
  FileSpreadsheet,
  Camera,
  ChevronRight,
  Calendar,
  User,
  Trash2,
  ArrowRightCircle,
  FileDown,
  Clock,
  Search,
  MessageCircle,
  MoveRight,
  Copy,
} from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Quote, Client, CompanySettings } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { SwipeableCard } from '../../components/Swipeable/SwipeableCard';

interface QuotesListScreenProps {
  quotes: Quote[];
  clients: Client[];
  settings?: CompanySettings;
  onNewQuote: () => void;
  onScanPhoto: () => void;
  onSelectQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onDuplicateQuote?: (quote: Quote) => void;
  onUpdateQuoteStatus?: (id: string, newStatus: 'pending' | 'accepted' | 'declined') => void;
  onConvertToInvoice: (quote: Quote) => void;
  onPreviewQuote?: (quote: Quote) => void;
  onDownloadExcel?: (quote: Quote) => void;
}

export const QuotesListScreen: React.FC<QuotesListScreenProps> = ({
  quotes,
  clients,
  settings,
  onNewQuote,
  onScanPhoto,
  onSelectQuote,
  onDeleteQuote,
  onDuplicateQuote,
  onUpdateQuoteStatus,
  onConvertToInvoice,
  onPreviewQuote,
  onDownloadExcel,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getClient = (clientId: string) => {
    return clients.find((c) => c.id === clientId);
  };

  const getClientName = (clientId: string) => {
    const client = getClient(clientId);
    return client ? client.name : 'Client inconnu';
  };

  // KPI Calculations
  const currency = settings?.currency || 'FCFA';
  const totalQuoted = quotes.reduce((acc, q) => acc + q.total, 0);
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
  const pendingQuotes = quotes.filter((q) => q.status === 'pending');
  const totalAccepted = acceptedQuotes.reduce((acc, q) => acc + q.total, 0);
  const totalPending = pendingQuotes.reduce((acc, q) => acc + q.total, 0);

  // Quick WhatsApp message link generator
  const generateWhatsAppQuoteLink = (quote: Quote) => {
    const client = getClient(quote.clientId);
    const clientName = client?.name || 'Client';
    const cleanPhone = (client?.phone || '').replace(/[^0-9+]/g, '');
    const companyName = settings?.name || 'ArchiFact';

    const message = `Bonjour ${clientName},\n\nVeuillez trouver les détails de votre proposition de devis N° *${quote.number}* d'un montant de *${formatCurrency(quote.total, currency)}* émise par *${companyName}*.\nDate d'expiration : ${formatDate(quote.expirationDate)}.\n\nRestant à votre entière disposition pour tout ajustement,\n${companyName}`;

    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  // Filtered quotes
  const filteredQuotes = quotes.filter((quote) => {
    const matchesFilter = filterStatus === 'all' || quote.status === filterStatus;
    const clientName = getClientName(quote.clientId).toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      quote.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // If empty state
  if (quotes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 relative select-none">
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={onScanPhoto}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scanner photo</span>
          </button>
        </div>

        <div className="w-16 h-16 mb-4 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400">
          <FileSpreadsheet className="w-8 h-8 stroke-[1.5]" />
        </div>

        <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
          Aucun devis pour l'instant
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          Créez votre première proposition ou scannez un brouillon papier.
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={onNewQuote}
          icon={Plus}
        >
          Créer un devis
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3 relative pb-24">
      {/* Top Action Bar with Quick Photo Scan */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-900">Numérisation devis</p>
          <p className="text-[11px] text-slate-500">Convertir des notes ou un devis papier</p>
        </div>
        <button
          type="button"
          onClick={onScanPhoto}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-md text-xs font-medium transition-colors"
        >
          <Camera className="w-3.5 h-3.5 text-slate-600" />
          <span>Scanner devis</span>
        </button>
      </div>

      {/* KPI Dashboard / Pilotage Devis */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Devisé</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {formatCurrency(totalQuoted, currency)}
          </p>
          <span className="text-[10px] text-slate-400">{quotes.length} au total</span>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Accepté</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {formatCurrency(totalAccepted, currency)}
          </p>
          <span className="text-[10px] text-slate-400">{acceptedQuotes.length} signé(s)</span>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider">En attente</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {formatCurrency(totalPending, currency)}
          </p>
          <span className="text-[10px] text-slate-400">{pendingQuotes.length} en attente</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2 pt-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par client, numéro de devis..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
          {(
            [
              { key: 'all', label: `Tous (${quotes.length})` },
              { key: 'pending', label: 'En attente' },
              { key: 'accepted', label: 'Acceptés' },
              { key: 'declined', label: 'Refusés' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`flex-1 py-1 text-center rounded text-xs transition-colors cursor-pointer ${
                filterStatus === tab.key
                  ? 'bg-white text-slate-900 font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gesture Hint Banner */}
      <div className="border border-slate-200 bg-white rounded-md p-2 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MoveRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Glisser vers la droite pour convertir en facture, à gauche pour supprimer</span>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-2">
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-6 text-center text-slate-400 text-xs">
            Aucun devis ne correspond à votre recherche.
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const client = getClient(quote.clientId);
            return (
              <SwipeableCard
                key={quote.id}
                rightActionText="Transformer en Facture"
                rightActionIcon={<ArrowRightCircle className="w-4 h-4 text-white" />}
                rightActionBg="bg-slate-900"
                onSwipeRight={() => onConvertToInvoice(quote)}
                leftActionText="Supprimer"
                leftActionIcon={<Trash2 className="w-4 h-4 text-white" />}
                leftActionBg="bg-rose-600"
                onSwipeLeft={() => {
                  if (confirm(`Voulez-vous supprimer le devis ${quote.number} ?`)) {
                    onDeleteQuote(quote.id);
                  }
                }}
                onClick={() => onSelectQuote(quote)}
              >
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 hover:border-slate-300 transition-colors flex flex-col gap-2 cursor-pointer">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {quote.number}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            quote.status === 'accepted'
                              ? 'bg-emerald-500'
                              : quote.status === 'declined'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-medium">
                          {quote.status === 'accepted'
                            ? 'Accepté'
                            : quote.status === 'declined'
                            ? 'Refusé'
                            : 'En attente'}
                        </span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Direct WhatsApp Share */}
                      {client?.phone && (
                        <a
                          href={generateWhatsAppQuoteLink(quote)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Envoyer via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {onPreviewQuote && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewQuote(quote);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md text-[11px] font-medium transition-colors"
                          title="Aperçu & Exporter PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-slate-500" />
                          <span>PDF</span>
                        </button>
                      )}

                      {onDownloadExcel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void onDownloadExcel(quote);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md text-[11px] font-medium transition-colors"
                          title="Télécharger le devis Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Excel</span>
                        </button>
                      )}

                      {onDuplicateQuote && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateQuote(quote);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Dupliquer le devis"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConvertToInvoice(quote);
                        }}
                        className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Convertir en Facture"
                      >
                        <ArrowRightCircle className="w-3 h-3" />
                        <span>Facturer</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Voulez-vous supprimer ce devis ?')) {
                            onDeleteQuote(quote.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Middle Info */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {getClientName(quote.clientId)}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(quote.date)} • Expiration : {formatDate(quote.expirationDate)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(quote.total, currency)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {quote.items.length} {quote.items.length > 1 ? 'articles' : 'article'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Status Toggle Bar */}
                  {onUpdateQuoteStatus && (
                    <div
                      className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] text-slate-400">Statut :</span>
                      <div className="flex items-center gap-1">
                        {quote.status !== 'accepted' && (
                          <button
                            type="button"
                            onClick={() => onUpdateQuoteStatus(quote.id, 'accepted')}
                            className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            Accepter
                          </button>
                        )}
                        {quote.status !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => onUpdateQuoteStatus(quote.id, 'pending')}
                            className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            En attente
                          </button>
                        )}
                        {quote.status !== 'declined' && (
                          <button
                            type="button"
                            onClick={() => onUpdateQuoteStatus(quote.id, 'declined')}
                            className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            Refuser
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SwipeableCard>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-16 right-5 z-20">
        <Button
          variant="primary"
          size="md"
          onClick={onNewQuote}
          icon={Plus}
          className="shadow-md font-medium"
        >
          Nouveau devis
        </Button>
      </div>
    </div>
  );
};
