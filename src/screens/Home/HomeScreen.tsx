import React from 'react';
import { ArrowRight, Camera, FilePlus2, FileText, Receipt, Sparkles, Users } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Client, CompanySettings, Invoice, Quote } from '../../types';

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
        <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Espace de travail</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Bonjour, {settings.name || 'artisan'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Créez un document en quelques secondes ou laissez l’IA préremplir vos données à partir d’une photo.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" size="md" onClick={onScanPhoto} icon={Camera}>
              Scanner un document
            </Button>
            <Button variant="outline" size="md" onClick={onNewQuote} icon={FilePlus2}>
              Nouveau devis
            </Button>
            <Button variant="outline" size="md" onClick={onNewInvoice} icon={Receipt}>
              Nouvelle facture
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Crédits IA</span>
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{credits}</p>
            <p className="mt-1 text-xs text-slate-500">Disponibles pour vos analyses</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</span>
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{invoices.length + quotes.length}</p>
            <p className="mt-1 text-xs text-slate-500">Devis et factures enregistrés</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clients</span>
              <Users className="h-4 w-4 text-violet-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{clients.length}</p>
            <p className="mt-1 text-xs text-slate-500">Dans votre carnet</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Derniers documents</h2>
              <p className="mt-1 text-xs text-slate-500">Reprenez rapidement votre activité récente.</p>
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
              <p className="mt-1 text-xs text-slate-500">Commencez par scanner un document ou créer un devis.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {recentDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{document.number}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{document.kind} · {document.total.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {document.status === 'pending' ? 'En attente' : document.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
