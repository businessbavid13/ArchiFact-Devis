import React from 'react';
import { ArrowRight, Camera, CloudCheck, FilePlus2, FileText, LockKeyhole, Receipt, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Client, CompanySettings, Invoice, InvoiceStatus, Quote, QuoteStatus } from '../../types';

const STATUS_STYLES: Record<InvoiceStatus | QuoteStatus, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  paid: { label: 'Payée', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  overdue: { label: 'En retard', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
  accepted: { label: 'Accepté', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  declined: { label: 'Refusé', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

const TRUST_POINTS = [
  { icon: LockKeyhole, title: 'Données privées', text: 'Accessibles uniquement depuis votre compte' },
  { icon: CloudCheck, title: 'Sauvegarde automatique', text: 'Synchronisée sur tous vos appareils' },
  { icon: ShieldCheck, title: 'Paiement sécurisé', text: 'Crédits réglés via GeniusPay' },
];

interface HomeScreenProps {
  invoices: Invoice[];
  quotes: Quote[];
  clients: Client[];
  settings: CompanySettings;
  credits: number;
  onNewInvoice: () => void;
  onNewQuote: () => void;
  onScanPhoto: () => void;
  onOpenInvoices: () => void;
  onOpenQuotes: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  invoices,
  quotes,
  clients,
  settings,
  credits,
  onNewInvoice,
  onNewQuote,
  onScanPhoto,
  onOpenInvoices,
  onOpenQuotes,
}) => {
  const recentDocuments = [
    ...invoices.map((document) => ({ ...document, kind: 'Facture' })),
    ...quotes.map((document) => ({ ...document, kind: 'Devis' })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-28 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-5 text-white shadow-sm sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/80">Espace de travail</p>
          <h1 className="relative mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Bonjour, {settings.name || 'artisan'}
          </h1>
          <p className="relative mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Créez un document en quelques secondes ou laissez l’IA préremplir vos données à partir d’une photo.
          </p>
          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button variant="inverse" size="md" onClick={onScanPhoto} icon={Camera} className="col-span-2 sm:col-span-1">
              Scanner un document
            </Button>
            <Button variant="glass" size="md" onClick={onNewQuote} icon={FilePlus2}>
              <span className="sm:hidden">Devis</span>
              <span className="hidden sm:inline">Nouveau devis</span>
            </Button>
            <Button variant="glass" size="md" onClick={onNewInvoice} icon={Receipt}>
              <span className="sm:hidden">Facture</span>
              <span className="hidden sm:inline">Nouvelle facture</span>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">Crédits IA</span>
              <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{credits}</p>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">Disponibles pour vos analyses</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">Documents</span>
              <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{invoices.length + quotes.length}</p>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">Devis et factures enregistrés</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">Clients</span>
              <Users className="h-4 w-4 shrink-0 text-violet-600" />
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{clients.length}</p>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">Dans votre carnet</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Derniers documents</h2>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">Reprenez rapidement votre activité récente.</p>
            </div>
            <button
              type="button"
              onClick={invoices.length >= quotes.length ? onOpenInvoices : onOpenQuotes}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
            >
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recentDocuments.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">Votre espace est prêt</p>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">Commencez par scanner un document ou créer un devis.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {recentDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{document.number}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{document.kind} · {document.total.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLES[document.status].className}`}>
                    {STATUS_STYLES[document.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Sécurité et confiance" className="grid gap-2 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
