import { useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { CreditPlan, PhotoScanExtract } from '../types';
import { supabase } from '../lib/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

interface CreditWallet {
  plan: string;
  credits_total: number;
  credits_balance: number;
}

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'PURCHASE' | 'AI_USAGE' | 'BONUS' | 'REFUND' | 'ADJUSTMENT';
  operation: string | null;
  status: 'RESERVED' | 'COMPLETED' | 'REFUNDED' | 'CONFIRMED';
  created_at: string;
}

interface CreditReservation {
  reservation_id: string;
  transaction_id: string;
  operation: string;
  credits: number;
  balance: number;
}

async function apiRequest<T>(session: Session, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Erreur du service de crédits');
  return body as T;
}

export function useCredits(session: Session | null) {
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!session) {
      setTransactions([]);
      return;
    }
    setTransactionsLoading(true);
    const { data, error: queryError } = await supabase
      .from('credit_transactions')
      .select('id, amount, type, operation, status, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (queryError) {
      setTransactionsError("Impossible de charger l'historique");
    } else {
      setTransactions((data ?? []) as CreditTransaction[]);
      setTransactionsError(null);
    }
    setTransactionsLoading(false);
  }, [session]);

  const refresh = useCallback(async () => {
    if (!session) {
      setWallet(null);
      setPlans([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [walletResult, plansResult] = await Promise.all([
        apiRequest<CreditWallet>(session, '/api/me/credits'),
        apiRequest<{ plans: Array<{ id: string; name: string; price_fcfa: number; credits: number }> }>(
          session,
          '/api/credits/plans'
        ),
      ]);
      setWallet(walletResult);
      setPlans(plansResult.plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceFcfa: plan.price_fcfa,
        credits: plan.credits,
      })));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les crédits');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reserveCredits = useCallback(async (
    operation: 'AI_QUOTE_FROM_IMAGE' | 'AI_INVOICE_FROM_IMAGE' | 'AI_ARTICLE_FROM_IMAGE' | 'AI_VOICE_COMMAND' | 'AI_OCR_ANALYSIS'
  ): Promise<CreditReservation> => {
    if (!session) throw new Error('Session utilisateur absente');
    const reservation = await apiRequest<CreditReservation>(session, '/api/credits/reserve', {
      method: 'POST',
      body: JSON.stringify({ operation }),
    });
    setWallet((current) => current ? { ...current, credits_balance: reservation.balance } : current);
    return reservation;
  }, [session]);

  const completeReservation = useCallback(async (reservationId: string) => {
    if (!session) return;
    await apiRequest(session, '/api/credits/complete', {
      method: 'POST',
      body: JSON.stringify({ reservationId }),
    });
    await refresh();
  }, [refresh, session]);

  const refundReservation = useCallback(async (reservationId: string) => {
    if (!session) return;
    await apiRequest(session, '/api/credits/refund', {
      method: 'POST',
      body: JSON.stringify({ reservationId }),
    });
    await refresh();
  }, [refresh, session]);

  const createPayment = useCallback(async (planId: string) => {
    if (!session) throw new Error('Session utilisateur absente');
    return apiRequest<{ reference: string; checkoutUrl: string | null }>(session, '/api/payments/geniuspay/create', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }, [session]);

  const checkPayment = useCallback(async (reference: string) => {
    if (!session) throw new Error('Session utilisateur absente');
    const result = await apiRequest<{ reference: string; status: PaymentStatus }>(
      session,
      `/api/payments/geniuspay/${encodeURIComponent(reference)}`
    );
    if (result.status === 'CONFIRMED') await refresh();
    return result;
  }, [refresh, session]);

  const analyzeImages = useCallback(async (files: File[]): Promise<PhotoScanExtract> => {
    if (!session) throw new Error('Session utilisateur absente');
    const images = await Promise.all(files.map(async (file) => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error || new Error('Lecture image impossible'));
        reader.readAsDataURL(file);
      });
      return { base64: dataUrl.split(',')[1] || '', mimeType: file.type };
    }));
    const result = await apiRequest<{ data: PhotoScanExtract }>(session, '/ai/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ images }),
    });
    await refresh();
    return result.data;
  }, [refresh, session]);

  return {
    credits: wallet?.credits_balance ?? 0,
    plan: wallet?.plan ?? 'free',
    creditsTotal: wallet?.credits_total ?? 0,
    plans,
    isLoading,
    error,
    refresh,
    transactions,
    transactionsLoading,
    transactionsError,
    loadTransactions,
    reserveCredits,
    completeReservation,
    refundReservation,
    createPayment,
    checkPayment,
    analyzeImages,
  };
}
