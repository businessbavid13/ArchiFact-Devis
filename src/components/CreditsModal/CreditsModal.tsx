import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Check, CheckCircle, ShieldCheck, ArrowRight, Loader2, AlertCircle, RefreshCw, History, X, Clock } from 'lucide-react';
import { Button } from '../Button/Button';
import { CreditPlan } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { DialogPanel } from '../Dialog/DialogPanel';
import { AnimatedNumber } from '../AnimatedNumber/AnimatedNumber';
import { AI_CREDIT_COSTS } from '../../constants/aiCosts';
import type { CreditTransaction, PaymentStatus } from '../../hooks/useCredits';

const TRANSACTION_LABELS: Record<CreditTransaction['type'], string> = {
  PURCHASE: 'Achat de crédits',
  AI_USAGE: 'Utilisation IA',
  BONUS: 'Bonus',
  REFUND: 'Remboursement',
  ADJUSTMENT: 'Ajustement',
};

export const PENDING_PAYMENT_STORAGE_KEY = 'archifact.pendingPaymentReference';
const PAYMENT_POLL_INTERVAL_MS = 3000;
const PAYMENT_POLL_ATTEMPTS = 20;

export interface PaymentReturn {
  outcome: 'success' | 'failed';
  reference: string | null;
}

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  plans: CreditPlan[];
  isLoading: boolean;
  loadError: string | null;
  onCreatePayment: (planId: string) => Promise<{ reference: string; checkoutUrl: string | null }>;
  onCheckPayment: (reference: string) => Promise<{ status: PaymentStatus }>;
  paymentReturn: PaymentReturn | null;
  onRefreshCredits: () => Promise<void>;
  transactions: CreditTransaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  onLoadTransactions: () => Promise<void>;
}

type ReturnState = 'checking' | 'confirmed' | 'pending' | 'failed';

export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  onClose,
  currentCredits,
  plans,
  isLoading,
  loadError,
  onCreatePayment,
  onCheckPayment,
  paymentReturn,
  onRefreshCredits,
  transactions,
  transactionsLoading,
  transactionsError,
  onLoadTransactions,
}) => {
  const purchasablePlans = plans.filter((plan) => plan.priceFcfa > 0);
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [returnState, setReturnState] = useState<ReturnState | null>(
    paymentReturn ? (paymentReturn.outcome === 'failed' ? 'failed' : 'checking') : null
  );
  const checkPaymentRef = useRef(onCheckPayment);
  checkPaymentRef.current = onCheckPayment;

  useEffect(() => {
    if (!selectedPlan && purchasablePlans.length > 0) setSelectedPlan(purchasablePlans[0]);
  }, [purchasablePlans, selectedPlan]);

  useEffect(() => {
    if (isOpen) void onLoadTransactions();
  }, [isOpen, onLoadTransactions]);

  useEffect(() => {
    if (!paymentReturn) return;
    const reference = sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY) || paymentReturn.reference;
    if (paymentReturn.outcome === 'failed' || !reference) {
      setReturnState(paymentReturn.outcome === 'failed' ? 'failed' : 'pending');
      return;
    }
    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;
    const poll = async () => {
      attempts += 1;
      try {
        const { status } = await checkPaymentRef.current(reference);
        if (cancelled) return;
        if (status === 'CONFIRMED' || status === 'FAILED') {
          sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
          setReturnState(status === 'CONFIRMED' ? 'confirmed' : 'failed');
          void onLoadTransactions();
          return;
        }
      } catch {
        if (cancelled) return;
      }
      if (attempts >= PAYMENT_POLL_ATTEMPTS) {
        setReturnState('pending');
        return;
      }
      timer = window.setTimeout(poll, PAYMENT_POLL_INTERVAL_MS);
    };
    setReturnState('checking');
    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [paymentReturn, onLoadTransactions]);

  if (!isOpen) return null;

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([onRefreshCredits(), onLoadTransactions()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (!selectedPlan) throw new Error('Aucun forfait disponible');
      const { reference, checkoutUrl } = await onCreatePayment(selectedPlan.id);
      if (!checkoutUrl) throw new Error('GeniusPay n’a pas renvoyé de page de paiement. Réessayez.');
      sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, reference);
      window.location.assign(checkoutUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Paiement indisponible');
      setIsProcessing(false);
    }
  };

  const handleCloseAll = () => {
    setReturnState(null);
    setErrorMessage(null);
    onClose();
  };

  const returnContent: Record<ReturnState, { icon: React.ReactNode; title: string; text: string }> = {
    checking: {
      icon: <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />,
      title: 'Vérification du paiement…',
      text: 'Nous attendons la confirmation officielle de GeniusPay.',
    },
    confirmed: {
      icon: <CheckCircle className="h-8 w-8 text-emerald-600" aria-hidden="true" />,
      title: 'Paiement confirmé',
      text: 'Vos crédits ont été ajoutés à votre solde.',
    },
    pending: {
      icon: <Clock className="h-8 w-8" aria-hidden="true" />,
      title: 'Paiement en cours de traitement',
      text: 'Vos crédits seront ajoutés dès que GeniusPay confirmera le paiement. Vous pouvez actualiser dans quelques instants.',
    },
    failed: {
      icon: <AlertCircle className="h-8 w-8 text-rose-600" aria-hidden="true" />,
      title: 'Paiement non abouti',
      text: 'Aucun montant n’a été crédité. Vous pouvez choisir un forfait et réessayer.',
    },
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
          {returnState ? (
            <div className="text-center py-6 space-y-4" role="status" aria-live="polite">
              <div className="w-14 h-14 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                {returnContent[returnState].icon}
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  {returnContent[returnState].title}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{returnContent[returnState].text}</p>
                <div className="mt-3 flex items-center justify-between rounded-md bg-slate-900 p-3 text-white">
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Solde</span>
                    <div className="flex items-baseline gap-1.5" aria-live="polite">
                      <AnimatedNumber value={currentCredits} className="text-xl font-bold font-mono" />
                      <span className="text-xs text-slate-300">crédits</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                    className="flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                    Actualiser
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {returnState === 'failed' && (
                  <Button variant="outline" size="md" fullWidth onClick={() => setReturnState(null)}>
                    Voir les forfaits
                  </Button>
                )}
                <Button variant="primary" size="md" fullWidth onClick={handleCloseAll}>
                  Continuer
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Solde actuel
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <AnimatedNumber value={currentCredits} className="text-2xl font-bold font-mono tracking-tight text-white" />
                    <span className="text-xs font-medium text-slate-300">crédits</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 leading-snug">
                  <p>Photo → Devis : {AI_CREDIT_COSTS.AI_QUOTE_FROM_IMAGE} crédits</p>
                  <p className="text-slate-500">Photo → Article : {AI_CREDIT_COSTS.AI_ARTICLE_FROM_IMAGE} crédit</p>
                </div>
              </div>

              <div className="space-y-2" role="radiogroup" aria-labelledby="credit-plans-title">
                <div className="flex items-center justify-between">
                  <h4 id="credit-plans-title" className="text-xs font-semibold tracking-tight text-slate-900 uppercase">
                    Choisir un forfait
                  </h4>
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
                ) : purchasablePlans.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600">
                    Impossible de charger les forfaits pour le moment. Réessayez dans quelques instants.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {purchasablePlans.map((offer) => {
                      const isSelected = selectedPlan?.id === offer.id;
                      return (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          key={offer.id}
                          onClick={() => setSelectedPlan(offer)}
                          className={`relative w-full p-3.5 rounded-lg border text-left transition-all duration-200 ease-out active:scale-[0.99] cursor-pointer flex items-center justify-between min-h-[56px] ${
                            isSelected
                              ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150 ${
                                isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight text-slate-900">
                                {offer.name} · {offer.credits} crédits
                              </p>
                              <p className="text-xs text-slate-500 font-normal">
                                Soit {Math.round(offer.priceFcfa / offer.credits)} FCFA / crédit
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold font-mono tracking-tight text-slate-900">
                            {formatCurrency(offer.priceFcfa)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-1.5 text-xs text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-slate-700 flex-shrink-0" />
                <span>
                  Vous serez redirigé vers la page de paiement sécurisée GeniusPay pour choisir Wave, Orange Money, MTN MoMo, Moov ou carte bancaire.
                </span>
              </div>

              <section aria-labelledby="credit-history-title" className="space-y-2 pt-2">
                <h4 id="credit-history-title" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-tight text-slate-900">
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  Historique
                </h4>
                {transactionsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Chargement de l'historique...
                  </div>
                ) : transactionsError ? (
                  <div role="alert" className="flex items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                    <span>{transactionsError}</span>
                    <button type="button" onClick={() => void onLoadTransactions()} className="font-semibold underline">
                      Réessayer
                    </button>
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-xs text-slate-500">Aucune transaction pour le moment.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                    {transactions.map((transaction) => (
                      <li key={transaction.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{TRANSACTION_LABELS[transaction.type]}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(transaction.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {transaction.status === 'RESERVED' ? ' • En cours' : transaction.status === 'REFUNDED' ? ' • Remboursé' : ''}
                          </p>
                        </div>
                        <span className={`shrink-0 font-mono font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        {!returnState && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
            <Button variant="outline" size="md" fullWidth onClick={handleCloseAll} disabled={isProcessing}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleConfirmPurchase}
              disabled={isProcessing || isLoading || !selectedPlan || purchasablePlans.length === 0}
              icon={isProcessing ? undefined : ArrowRight}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirection...
                </span>
              ) : (
                selectedPlan ? `Payer ${formatCurrency(selectedPlan.priceFcfa)}` : 'Choisir un forfait'
              )}
            </Button>
          </div>
        )}
      </DialogPanel>
    </div>
  );
};
