import crypto from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
}

export type CreditOperation =
  | 'AI_QUOTE_FROM_IMAGE'
  | 'AI_INVOICE_FROM_IMAGE'
  | 'AI_ARTICLE_FROM_IMAGE'
  | 'AI_VOICE_COMMAND'
  | 'AI_OCR_ANALYSIS';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface CreditPlan {
  id: string;
  name: string;
  price_fcfa: number;
  credits: number;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const authSupabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const adminSupabase: SupabaseClient | null =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export async function authenticateBearerToken(token: string): Promise<AuthenticatedUser | null> {
  if (!authSupabase) return null;
  const { data, error } = await authSupabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

export async function getCreditPlans(): Promise<CreditPlan[]> {
  if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const { data, error } = await adminSupabase
    .from('credit_plans')
    .select('id,name,price_fcfa,credits')
    .eq('active', true)
    .order('price_fcfa', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getWallet(userId: string): Promise<{
  plan: string;
  credits_total: number;
  credits_balance: number;
}> {
  if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const { data, error } = await adminSupabase
    .from('credits')
    .select('plan,credits_total,balance')
    .eq('user_id', userId)
    .single();
  if (error || !data) throw error || new Error('CREDIT_WALLET_NOT_FOUND');
  return {
    plan: data.plan,
    credits_total: data.credits_total,
    credits_balance: data.balance,
  };
}

export async function reserveCredits(userId: string, operation: CreditOperation, reference?: string) {
  if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const { data, error } = await adminSupabase.rpc('reserve_ai_credits_as_user', {
    p_user_id: userId,
    p_operation: operation,
    p_reference: reference || null,
  });
  if (error) throw error;
  return data as {
    reservation_id: string;
    transaction_id: string;
    operation: string;
    credits: number;
    balance: number;
  };
}

export async function completeReservation(userId: string, reservationId: string) {
  if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const { data, error } = await adminSupabase.rpc('complete_ai_credit_reservation_as_user', {
    p_user_id: userId,
    p_reservation_id: reservationId,
  });
  if (error) throw error;
  return data;
}

export async function refundReservation(userId: string, reservationId: string) {
  if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const { data, error } = await adminSupabase.rpc('refund_ai_credit_reservation_as_user', {
    p_user_id: userId,
    p_reservation_id: reservationId,
  });
  if (error) throw error;
  return data;
}

export function verifyGeniusPaySignature(
  rawBody: string,
  signature: string | undefined,
  timestamp: string | undefined,
): boolean {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp || !/^\d+$/.test(timestamp)) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature.replace(/^sha256=/i, ''));
  return expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
