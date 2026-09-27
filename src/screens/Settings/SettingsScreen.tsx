import React, { useState } from 'react';
import {
  Building2,
  Palette,
  CreditCard,
  Percent,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Coins,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Layout,
  X,
  Zap,
  LogOut,
} from 'lucide-react';
import { CompanySettings } from '../../types';

interface SettingsScreenProps {
  settings: CompanySettings;
  creditsBalance: number;
  onUpdateSettings: (newSettings: Partial<CompanySettings>) => void;
  onOpenCustomization: () => void;
  onOpenCreditsStore: () => void;
  onSignOut?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  creditsBalance,
  onUpdateSettings,
  onOpenCustomization,
  onOpenCreditsStore,
  onSignOut,
}) => {
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null);

  // Company Form State
  const [companyName, setCompanyName] = useState(settings.name || '');
  const [companyPhone, setCompanyPhone] = useState(settings.phone || '');
  const [companyEmail, setCompanyEmail] = useState(settings.email || '');
  const [companyAddress, setCompanyAddress] = useState(settings.address || '');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      name: companyName,
      phone: companyPhone,
      email: companyEmail,
      address: companyAddress,
    });
    setIsCompanyModalOpen(false);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Credits Status & Purchase Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                Crédits numérisation
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {creditsBalance} crédits disponibles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCreditsStore}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            Recharger
          </button>
        </div>

        {/* SECTION ENTREPRISE */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Entreprise
          </h3>

          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {/* Informations sur l'entreprise */}
            <div
              onClick={() => setIsCompanyModalOpen(true)}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    Informations sur l'entreprise
                  </p>
                  <p className="text-[11px] text-slate-500">{settings.name || 'Non défini'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Personnaliser */}
            <div
              onClick={onOpenCustomization}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Personnaliser les documents</p>
                  <p className="text-[11px] text-slate-500">Modèles, en-tête, pied de page & cachet</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border border-slate-200"
                  style={{ backgroundColor: settings.invoiceColor }}
                />
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Impôts / Taxes */}
            <div
              onClick={() =>
                setInfoModal({
                  title: 'Impôts et Taxes',
                  content: 'Taxes configurées :\n• TVA standard : 18%\n• Prestation de service : 5%\n\nVous pouvez choisir d’appliquer la TVA sur chaque devis ou facture lors de sa création.',
                })
              }
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Impôts / Taxes</p>
                  <p className="text-[11px] text-slate-500">TVA par défaut (0% ou 18%)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Modes de paiement */}
            <div
              onClick={() =>
                setInfoModal({
                  title: 'Modes de paiement',
                  content: `Modes de règlement proposés à vos clients :\n• ${settings.paymentModes.join('\n• ')}`,
                })
              }
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Modes de paiement</p>
                  <p className="text-[11px] text-slate-500">
                    {settings.paymentModes.length} modes configurés
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* SECTION FACTURE */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Facture & Devis
          </h3>

          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {/* Termes dus */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Échéance par défaut</p>
                  <p className="text-[11px] text-slate-500">
                    {settings.invoiceDueDays} jours après émission
                  </p>
                </div>
              </div>
              <select
                value={settings.invoiceDueDays}
                onChange={(e) =>
                  onUpdateSettings({ invoiceDueDays: parseInt(e.target.value) })
                }
                className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs font-medium text-slate-700"
              >
                <option value={7}>7 jours</option>
                <option value={15}>15 jours</option>
                <option value={30}>30 jours</option>
                <option value={45}>45 jours</option>
              </select>
            </div>

            {/* Afficher Statut paiement */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    Statut de paiement sur PDF
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mention Payée ou En attente sur les PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    showPaymentStatus: !settings.showPaymentStatus,
                  })
                }
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  settings.showPaymentStatus ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.showPaymentStatus ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Noms des documents */}
            <div
              onClick={() =>
                setInfoModal({
                  title: 'Numérotation des documents',
                  content: 'Préfixes standards utilisés :\n• Devis : DEV-XXXX\n• Factures : FACT-XXXX\n\nChaque numéro est incrémenté automatiquement.',
                })
              }
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    Numérotation des documents
                  </p>
                  <p className="text-[11px] text-slate-500">DEV-, FACT-</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Modèles de documents (3 Choix) */}
            <div className="p-3.5 flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={onOpenCustomization}
              >
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    Modèle de rendu PDF
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {settings.documentTemplate || 'Moderne & Épuré'}
                  </p>
                </div>
              </div>
              <select
                value={
                  settings.documentTemplate?.toLowerCase().includes('btp') ||
                  settings.documentTemplate?.toLowerCase().includes('chantier')
                    ? 'BTP & Chantier'
                    : settings.documentTemplate?.toLowerCase().includes('elegant') ||
                      settings.documentTemplate?.toLowerCase().includes('élégant') ||
                      settings.documentTemplate?.toLowerCase().includes('prestation')
                    ? 'Élégant / Prestation'
                    : 'Moderne & Épuré'
                }
                onChange={(e) => onUpdateSettings({ documentTemplate: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs font-medium text-slate-800 cursor-pointer"
              >
                <option value="Moderne & Épuré">Moderne & Épuré</option>
                <option value="BTP & Chantier">BTP & Chantier</option>
                <option value="Élégant / Prestation">Élégant / Prestation</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION GÉNÉRAL */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Général
          </h3>

          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {/* Langue */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Langue</p>
                  <p className="text-[11px] text-slate-500">Français</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">Français</span>
            </div>

            {/* Devise par défaut */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    Devise par défaut
                  </p>
                  <p className="text-[11px] text-slate-500">{settings.currency}</p>
                </div>
              </div>
              <select
                value={settings.currency}
                onChange={(e) => onUpdateSettings({ currency: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs font-medium text-slate-700"
              >
                <option value="FCFA">FCFA (XOF)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {/* Format de date */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    Format de date
                  </p>
                  <p className="text-[11px] text-slate-500">JJ/MM/AAAA</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">JJ/MM/AAAA</span>
            </div>
          </div>
        </div>

        {/* Security & Version footer */}
        <div className="text-center py-2 text-slate-400 space-y-1">
          <p className="text-[11px] flex items-center justify-center gap-1.5 font-normal">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            ArchiFact • Données stockées localement
          </p>
        </div>
      </div>

      {/* Info Details Modal */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">{infoModal.title}</h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {infoModal.content}
              </p>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">Informations sur l'entreprise</h3>
              <button
                type="button"
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Nom commercial
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Email professionnel
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Logout Button */}
      {onSignOut && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      )}
    </>
  );
};
