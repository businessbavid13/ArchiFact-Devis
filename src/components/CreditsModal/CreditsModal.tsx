import React, { useEffect, useState } from 'react';
import { X, Sparkles, Check, CreditCard, Smartphone, CheckCircle, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../Button/Button';
import { CreditPlan } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { DialogPanel } from '../Dialog/DialogPanel';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  plans: CreditPlan[];
  isLoading: boolean;
  loadError: string | null;
  onCreatePayment: (planId: string, paymentMethod: string, phoneNumber: string) => Promise<{ reference: string }>;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  onClose,
  currentCredits,
  plans,
  isLoading,
  loadError,
  onCreatePayment,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange_money' | 'mtn_momo' | 'card'>('wave');
  const [phoneNumber, setPhoneNumber] = useState('07 00 00 00 00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successResult, setSuccessResult] = useState<{ credits: number; tx: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlan && plans.length > 0) setSelectedPlan(plans[0]);
  }, [plans, selectedPlan]);

  if (!isOpen) return null;

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (!selectedPlan) throw new Error('Aucun forfait disponible');
      const res = await onCreatePayment(selectedPlan.id, paymentMethod, phoneNumber);
      setSuccessResult({ credits: selectedPlan.credits, tx: res.reference });
    } catch (error) {
      setSuccessResult(null);
      setErrorMessage(error instanceof Error ? error.message : 'Paiement indisponible');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAll = () => {
    setSuccessResult(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" role="presentation">
      <DialogPanel onClose={handleCloseAll} aria-labelledby="credits-modal-title" className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-modal-enter">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="credits-modal-title" className="text-sm font-bold tracking-tight text-white">Boutique de Crédits</h3>
              <p className="text-[11px] text-slate-400 font-normal">Numérisation et extraction instantanée</p>
            </div>
          </div>
          <button
            onClick={handleCloseAll}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-md active:scale-95 transition-all duration-150"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Paiement initié
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Réf. #{successResult.tx}
                </p>
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-normal leading-relaxed">
                  Les crédits seront ajoutés après confirmation sécurisée du webhook GeniusPay.
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleCloseAll}
              >
                Continuer
              </Button>
            </div>
          ) : (
            <>
              {/* Current balance card */}
              <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Solde actuel
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold font-mono tracking-tight text-white">{currentCredits}</span>
                    <span className="text-xs font-medium text-slate-300">crédits</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 leading-snug">
                  <p>Le coût dépend de l'opération IA</p>
                  <p className="text-slate-500">Le scan OCR coûte 100 crédits</p>
                </div>
              </div>

              {/* Offers list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-tight text-slate-900 uppercase">
                    Choisir un forfait
                  </label>
                  <span className="text-[11px] text-slate-500 font-normal">Sans abonnement</span>
                </div>

                {(errorMessage || loadError) && (
                  <div role="alert" className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage || loadError}</span>
                  </div>
                )}

                {isLoading ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600">
                    Chargement des forfaits...
                  </div>
                ) : plans.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600">
                    Impossible de charger les forfaits pour le moment. Réessayez dans quelques instants.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plans.map((offer) => {
                    const isSelected = selectedPlan?.id === offer.id;
                    return (
                      <div
                        key={offer.id}
                        onClick={() => setSelectedPlan(offer)}
                        className={`relative p-3.5 rounded-lg border transition-all duration-200 ease-out active:scale-[0.99] cursor-pointer flex items-center justify-between min-h-[56px] ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150 ${
                              isSelected
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight text-slate-900">
                              {offer.credits} crédits
                            </p>
                            <p className="text-xs text-slate-500 font-normal">
                              Soit {Math.round(offer.priceFcfa / offer.credits)} FCFA / scan
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold font-mono tracking-tight text-slate-900">
                            {formatCurrency(offer.priceFcfa)}
                          </span>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>

              {/* Payment methods */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold tracking-tight text-slate-900 uppercase">
                  Moyen de paiement GeniusPay
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wave')}
                    className={`min-h-[44px] px-3 py-2 rounded-md border text-xs font-medium flex items-center gap-2 transition-all duration-150 ease-out active:scale-95 cursor-pointer ${
                      paymentMethod === 'wave'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span className="truncate">Wave Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('orange_money')}
                    className={`min-h-[44px] px-3 py-2 rounded-md border text-xs font-medium flex items-center gap-2 transition-all duration-150 ease-out active:scale-95 cursor-pointer ${
                      paymentMethod === 'orange_money'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span className="truncate">Orange Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mtn_momo')}
                    className={`min-h-[44px] px-3 py-2 rounded-md border text-xs font-medium flex items-center gap-2 transition-all duration-150 ease-out active:scale-95 cursor-pointer ${
                      paymentMethod === 'mtn_momo'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span className="truncate">MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`min-h-[44px] px-3 py-2 rounded-md border text-xs font-medium flex items-center gap-2 transition-all duration-150 ease-out active:scale-95 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span className="truncate">Carte Bancaire</span>
                  </button>
                </div>

                <div className="pt-1 space-y-1">
                  <label className="text-xs font-medium text-slate-600 block">
                    Numéro mobile ou identifiant
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full min-h-[44px] bg-white border border-slate-200 rounded-md px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    placeholder="Ex: 07 00 00 00 00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-slate-700 flex-shrink-0" />
                <span>Paiement sécurisé et instantané • Aucun engagement</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!successResult && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handleCloseAll}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleConfirmPurchase}
              disabled={isProcessing || isLoading || !selectedPlan || plans.length === 0}
              icon={isProcessing ? undefined : ArrowRight}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement...
                </span>
              ) : (
                selectedPlan ? `Acheter (${formatCurrency(selectedPlan.priceFcfa)})` : 'Choisir un forfait'
              )}
            </Button>
          </div>
        )}
      </DialogPanel>
    </div>
  );
};
