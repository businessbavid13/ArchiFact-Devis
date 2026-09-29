import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { DialogPanel } from '../Dialog/DialogPanel';

interface PaymentCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  currency?: string;
}

export const PaymentCelebrationModal: React.FC<PaymentCelebrationModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  clientName,
  amount,
  currency = 'FCFA',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Haptic feedback if available
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 80]);
      } catch {
        // ignore
      }
    }

    // Discreet celebratory confetti
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
      colors: ['#0f172a', '#334155', '#10b981', '#64748b'],
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <DialogPanel onClose={onClose} aria-labelledby="payment-celebration-title" className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 flex flex-col text-center p-6 space-y-4">
        {/* Checkmark icon badge */}
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>

        {/* Title & info */}
        <div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
            Encaissement validé
          </span>
          <h2 id="payment-celebration-title" className="text-lg font-bold text-slate-900 mt-2 tracking-tight">
            Paiement enregistré
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Facture <strong className="text-slate-800">{invoiceNumber}</strong> réglée par{' '}
            <strong className="text-slate-800">{clientName}</strong>.
          </p>
        </div>

        {/* Amount Box */}
        <div className="bg-slate-900 text-white rounded-lg p-4">
          <p className="text-[10px] uppercase font-medium tracking-wider text-slate-400">
            Montant Encaissé
          </p>
          <p className="text-2xl font-bold mt-1 tracking-tight">
            +{formatCurrency(amount, currency)}
          </p>
        </div>

        {/* Note */}
        <p className="text-xs text-slate-500">
          La facture a été marquée comme payée et votre trésorerie est à jour.
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Continuer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </DialogPanel>
    </div>
  );
};
