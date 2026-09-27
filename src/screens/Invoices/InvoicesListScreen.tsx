import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Camera,
  ChevronRight,
  Calendar,
  User,
  Trash2,
  FileDown,
  Clock,
  AlertCircle,
  Search,
  MessageCircle,
  MoveRight,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Invoice, Client, CompanySettings } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { SwipeableCard } from '../../components/Swipeable/SwipeableCard';
import { PaymentCelebrationModal } from '../../components/GratificationModal/PaymentCelebrationModal';

interface InvoicesListScreenProps {
  invoices: Invoice[];
  clients: Client[];
  settings?: CompanySettings;
  onNewInvoice: () => void;
  onScanPhoto: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onDuplicateInvoice?: (invoice: Invoice) => void;
  onUpdateInvoiceStatus?: (id: string, newStatus: 'paid' | 'pending' | 'overdue') => void;
  onPreviewInvoice?: (invoice: Invoice) => void;
  onDownloadExcel?: (invoice: Invoice) => void;
}

export const InvoicesListScreen: React.FC<InvoicesListScreenProps> = ({
  invoices,
  clients,
  settings,
  onNewInvoice,
  onScanPhoto,
  onSelectInvoice,
  onDeleteInvoice,
  onDuplicateInvoice,
  onUpdateInvoiceStatus,
  onPreviewInvoice,
  onDownloadExcel,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [celebrationData, setCelebrationData] = useState<{
    invoiceNumber: string;
    clientName: string;
    amount: number;
  } | null>(null);

  const getClient = (clientId: string) => {
    return clients.find((item) => item.id === clientId);
  };

  const getClientName = (clientId: string) => {
    const c = getClient(clientId);
    return c ? c.name : 'Client inconnu';
  };

  const handleTogglePaid = (inv: Invoice) => {
    if (!onUpdateInvoiceStatus) return;
    const isNowPaid = inv.status !== 'paid';
    const nextStatus = isNowPaid ? 'paid' : 'pending';
    onUpdateInvoiceStatus(inv.id, nextStatus);

    if (isNowPaid) {
      setCelebrationData({
        invoiceNumber: inv.number,
        clientName: getClientName(inv.clientId),
        amount: inv.total,
      });
    }
  };

  // KPI Calculations
  const currency = settings?.currency || 'FCFA';
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((acc, cur) => acc + cur.total, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((acc, cur) => acc + cur.total, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((acc, cur) => acc + cur.total, 0);

  // Quick WhatsApp message trigger
  const handleQuickWhatsApp = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    const client = getClient(inv.clientId);
    const clientName = client?.name || 'Client';
    const cleanPhone = (client?.phone || '').replace(/[^0-9+]/g, '');
    const companyName = settings?.name || 'ArchiFact';

    let message = '';
    if (inv.status === 'paid') {
      message = `Bonjour ${clientName},\n\nNous vous confirmons la bonne réception du paiement pour la facture N° *${inv.number}* d'un montant de *${formatCurrency(inv.total, currency)}*.\n\nMerci pour votre confiance !\n${companyName}`;
    } else {
      message = `Bonjour ${clientName},\n\nVeuillez trouver le rappel pour votre facture N° *${inv.number}* d'un montant de *${formatCurrency(inv.total, currency)}* émise par *${companyName}*.\nÉchéance : ${formatDate(inv.dueDate)}.\n\nMerci de nous tenir informés du règlement. Cordialement,\n${companyName}`;
    }

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    const a = document.createElement('a');
    a.href = whatsappUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter = filterStatus === 'all' || inv.status === filterStatus;
    const clientName = getClientName(inv.clientId).toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // If empty initial state
  if (invoices.length === 0) {
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
          <FileText className="w-8 h-8 stroke-[1.5]" />
        </div>

        <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
          Aucune facture pour l'instant
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          Créez votre première facture manuellement ou à partir d'un scan photo.
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={onNewInvoice}
          icon={Plus}
        >
          Créer une facture
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3 relative pb-24">
      {/* Top Action Bar with Quick Photo Scan */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-900">Numérisation rapide</p>
          <p className="text-[11px] text-slate-500">Scanner un bon, reçu ou devis existant</p>
        </div>
        <button
          type="button"
          onClick={onScanPhoto}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-md text-xs font-medium transition-colors"
        >
          <Camera className="w-3.5 h-3.5 text-slate-600" />
          <span>Scanner photo</span>
        </button>
      </div>

      {/* Pilotage & Trésorerie KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Encaissé</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {formatCurrency(totalPaid, currency)}
          </p>
          <span className="text-[10px] text-slate-400">
            {invoices.filter((i) => i.status === 'paid').length} payée(s)
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider">En attente</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {formatCurrency(totalPending, currency)}
          </p>
          <span className="text-[10px] text-slate-400">
            {invoices.filter((i) => i.status === 'pending').length} en cours
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider">En retard</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {formatCurrency(totalOverdue, currency)}
          </p>
          <span className="text-[10px] text-slate-400">
            {invoices.filter((i) => i.status === 'overdue').length} relance(s)
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2 pt-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° facture ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
          {(
            [
              { key: 'all', label: `Toutes (${invoices.length})` },
              { key: 'pending', label: 'En attente' },
              { key: 'paid', label: 'Payées' },
              { key: 'overdue', label: 'En retard' },
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

      {/* Gesture Hint Banner for Quick Field Actions */}
      <div className="border border-slate-200 bg-white rounded-md p-2 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MoveRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Glisser vers la droite pour marquer payé, à gauche pour supprimer</span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-2">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-6 text-center text-slate-400 text-xs">
            Aucune facture ne correspond à votre recherche.
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <SwipeableCard
              key={inv.id}
              rightActionText={inv.status === 'paid' ? 'Remettre en attente' : 'Marquer comme payé'}
              rightActionIcon={<Check className="w-4 h-4 text-white" />}
              rightActionBg="bg-slate-900"
              onSwipeRight={() => handleTogglePaid(inv)}
              leftActionText="Supprimer"
              leftActionIcon={<Trash2 className="w-4 h-4 text-white" />}
              leftActionBg="bg-rose-600"
              onSwipeLeft={() => {
                if (confirm(`Voulez-vous supprimer la facture ${inv.number} ?`)) {
                  onDeleteInvoice(inv.id);
                }
              }}
              onClick={() => onSelectInvoice(inv)}
            >
              <div className="bg-white rounded-lg border border-slate-200 p-3.5 hover:border-slate-300 transition-colors flex flex-col gap-2 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {inv.number}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePaid(inv);
                      }}
                      title="Cliquer pour basculer le statut"
                      className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500'
                            : inv.status === 'overdue'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-medium">
                        {inv.status === 'paid'
                          ? 'Payée'
                          : inv.status === 'overdue'
                          ? 'En retard'
                          : 'En attente'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick WhatsApp Reminder button */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickWhatsApp(e, inv)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Partager par WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>

                    {onPreviewInvoice && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewInvoice(inv);
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
                          void onDownloadExcel(inv);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md text-[11px] font-medium transition-colors"
                        title="Télécharger la facture Excel"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Excel</span>
                      </button>
                    )}

                    {onDuplicateInvoice && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateInvoice(inv);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Dupliquer la facture"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Voulez-vous supprimer cette facture ?')) {
                          onDeleteInvoice(inv.id);
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

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div>
                    <p className="font-medium text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {getClientName(inv.clientId)}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(inv.date)} • Échéance : {formatDate(inv.dueDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(inv.total, currency)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {inv.items.length} {inv.items.length > 1 ? 'articles' : 'article'}
                    </p>
                  </div>
                </div>
              </div>
            </SwipeableCard>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-16 right-5 z-20">
        <Button
          variant="primary"
          size="md"
          onClick={onNewInvoice}
          icon={Plus}
          className="shadow-md font-medium"
        >
          Nouvelle facture
        </Button>
      </div>

      {/* Payment Celebration / Gratification Modal */}
      {celebrationData && (
        <PaymentCelebrationModal
          isOpen={!!celebrationData}
          onClose={() => setCelebrationData(null)}
          invoiceNumber={celebrationData.invoiceNumber}
          clientName={celebrationData.clientName}
          amount={celebrationData.amount}
          currency={currency}
        />
      )}
    </div>
  );
};
