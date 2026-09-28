import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
import { Webhook } from 'standardwebhooks';
// Correct import based on what we found in the exports
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import {
  adminSupabase,
  authenticateBearerToken,
  completeReservation,
  getCreditPlans,
  getWallet,
  refundReservation,
  reserveCredits,
  verifyGeniusPaySignature,
  AuthenticatedUser,
  CreditOperation,
} from './credits.ts';
import {
  clientKey,
  createRateLimiter,
  requestIdMiddleware,
  userOrClientKey,
  writeSecurityAudit,
} from './security.ts';

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(requestIdMiddleware);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  },
}));
app.use('/webhooks/geniuspay', express.raw({ type: 'application/json' }));
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buffer) => {
    (req as Request & { rawBody?: string }).rawBody = buffer.toString('utf8');
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
const genai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const authHookRateLimiter = createRateLimiter('auth-hook', {
  windowMs: 5 * 60_000,
  max: 30,
  key: clientKey,
});
const webhookRateLimiter = createRateLimiter('payment-webhook', {
  windowMs: 5 * 60_000,
  max: 120,
  key: clientKey,
});
const authenticatedRateLimiter = createRateLimiter('authenticated', {
  windowMs: 60_000,
  max: 90,
  key: userOrClientKey,
});
const aiRateLimiter = createRateLimiter('ai', {
  windowMs: 60_000,
  max: 12,
  key: userOrClientKey,
});
const paymentRateLimiter = createRateLimiter('payment', {
  windowMs: 10 * 60_000,
  max: 10,
  key: userOrClientKey,
});
const sensitiveIpRateLimiter = createRateLimiter('sensitive-ip', {
  windowMs: 60_000,
  max: 120,
  key: clientKey,
});

app.use(['/api', '/ai'], sensitiveIpRateLimiter);

type AuthenticatedRequest = Request & { user: AuthenticatedUser };
type RawBodyRequest = Request & { rawBody?: string };
type AuthEmailHookPayload = {
  user?: { email?: string; created_at?: string };
  email_data?: {
    token?: string;
    email_action_type?: string;
    redirect_to?: string;
  };
};

function constantTimeSecretMatch(value: string | undefined, expected: string | undefined): boolean {
  if (!value || !expected) return false;
  const provided = Buffer.from(value);
  const configured = Buffer.from(expected);
  return provided.length === configured.length && crypto.timingSafeEqual(provided, configured);
}

async function sendAuthEmail(to: string, token: string, actionType: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Resend auth email is not configured');

  const isSignup = actionType === 'signup';
  const subject = isSignup ? 'Bienvenue sur ArchiFact — votre code de connexion' : 'Votre code OTP ArchiFact';
  const title = isSignup ? 'Bienvenue sur ArchiFact' : 'Code OTP de connexion';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_NAME ? `${process.env.RESEND_FROM_NAME} <${from}>` : from,
      to: [to],
      subject,
      html: `
        <div style="background:#f4f8ff;padding:40px 20px;font-family:Arial,sans-serif;color:#0b1f3b">
          <div style="max-width:520px;margin:auto;background:#fff;border:1px solid #dbeafe;border-radius:20px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#007bff,#00d1ff);padding:28px 36px;color:#fff;font-size:24px;font-weight:700">ArchiFact</div>
            <div style="padding:36px">
              <h1 style="font-size:26px;margin:0 0 14px">${title}</h1>
              <p style="font-size:16px;line-height:1.6;color:#64748b">Utilisez ce code pour finaliser votre connexion à ArchiFact :</p>
              <div style="background:#0b1f3b;color:#fff;border-radius:14px;font-size:34px;letter-spacing:10px;text-align:center;padding:18px 12px;margin:26px 0;font-weight:700">${token}</div>
              <p style="color:#64748b;font-size:14px;line-height:1.6">Ce code expire dans 10 minutes et n’est valable qu’une seule fois.</p>
              <p style="color:#94a3b8;font-size:13px;line-height:1.6">Si vous n’êtes pas à l’origine de cette tentative, ignorez ce message.</p>
              <p style="color:#94a3b8;font-size:12px;margin:30px 0 0">ArchiFact — Devis &amp; factures professionnels</p>
            </div>
          </div>
        </div>
      `,
    }),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const user = token ? await authenticateBearerToken(token) : null;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  (req as AuthenticatedRequest).user = user;
  next();
}

function getAuthenticatedUser(req: Request): AuthenticatedUser {
  return (req as AuthenticatedRequest).user;
}

function creditErrorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('INSUFFICIENT_CREDITS')) return 402;
  if (message.includes('UNKNOWN_AI_OPERATION')) return 400;
  if (message.includes('NOT_CONFIGURED')) return 503;
  return 500;
}

const creditOperations = new Set<CreditOperation>([
  'AI_QUOTE_FROM_IMAGE',
  'AI_INVOICE_FROM_IMAGE',
  'AI_ARTICLE_FROM_IMAGE',
  'AI_VOICE_COMMAND',
  'AI_OCR_ANALYSIS',
]);

const acceptedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isValidBase64(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxLength &&
    /^[A-Za-z0-9+/]*={0,2}$/.test(value);
}

type ImageInput = { base64: string; mimeType: string };

function isImageInput(value: unknown): value is ImageInput {
  if (!value || typeof value !== 'object') return false;
  const image = value as Record<string, unknown>;
  return isValidBase64(image.base64, 8_000_000) &&
    typeof image.mimeType === 'string' &&
    acceptedImageMimeTypes.has(image.mimeType);
}

function isValidPhoneNumber(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9+()\s.-]{7,24}$/.test(value);
}

async function reserveForRequest(
  req: Request,
  operation: CreditOperation,
  reference: string
) {
  return reserveCredits(getAuthenticatedUser(req).id, operation, reference);
}

app.post('/auth/hooks/send-email', authHookRateLimiter, async (req: Request, res: Response) => {
  const rawBody = (req as RawBodyRequest).rawBody || JSON.stringify(req.body || {});
  const hookSecret = process.env.AUTH_HOOK_SECRET;
  let payload: AuthEmailHookPayload;

  try {
    const webhookHeaders = {
      'webhook-id': req.header('webhook-id') || '',
      'webhook-timestamp': req.header('webhook-timestamp') || '',
      'webhook-signature': req.header('webhook-signature') || '',
    };
    if (hookSecret && webhookHeaders['webhook-id'] && webhookHeaders['webhook-timestamp'] && webhookHeaders['webhook-signature']) {
      payload = new Webhook(hookSecret).verify(rawBody, webhookHeaders) as AuthEmailHookPayload;
    } else {
      const authorization = req.header('authorization')?.replace(/^Bearer\s+/i, '');
      if (!constantTimeSecretMatch(authorization, hookSecret)) {
        void writeSecurityAudit({ req, eventType: 'auth.email_hook_rejected', success: false });
        res.status(401).json({ error: 'Invalid auth hook signature' });
        return;
      }
      payload = req.body as AuthEmailHookPayload;
    }
  } catch {
    void writeSecurityAudit({ req, eventType: 'auth.email_hook_rejected', success: false });
    res.status(401).json({ error: 'Invalid auth hook signature' });
    return;
  }

  const email = payload.user?.email;
  const token = payload.email_data?.token;
  const actionType = payload.email_data?.email_action_type || 'magic_link';
  if (!email || !token) {
    void writeSecurityAudit({ req, eventType: 'auth.email_hook_invalid_payload', success: false });
    res.status(400).json({ error: 'Invalid auth email payload' });
    return;
  }

  try {
    await sendAuthEmail(email, token, actionType);
    void writeSecurityAudit({ req, eventType: 'auth.otp_email_sent', metadata: { action_type: actionType } });
    res.status(200).json({});
  } catch (error) {
    console.error('Error sending auth email:', error instanceof Error ? error.message : 'unknown error');
    void writeSecurityAudit({ req, eventType: 'auth.otp_email_failed', success: false, metadata: { action_type: actionType } });
    res.status(502).json({ error: 'Unable to send auth email' });
  }
});

app.post('/webhooks/geniuspay', webhookRateLimiter, async (req: Request, res: Response) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
  const webhookEvent = req.header('x-webhook-event') || '';
  if (!verifyGeniusPaySignature(
    rawBody,
    req.header('x-webhook-signature'),
    req.header('x-webhook-timestamp'),
  )) {
    void writeSecurityAudit({ req, eventType: 'payment.webhook_rejected', success: false });
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  try {
    if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    const payload = JSON.parse(rawBody) as {
      event?: string;
      status?: string;
      reference?: string;
      transaction_id?: string;
      metadata?: { order_id?: string };
      data?: {
        status?: string;
        reference?: string;
        transaction_id?: string;
        metadata?: { order_id?: string };
      };
    };
    const event = payload.data || payload;
    const providerReference = event.reference || event.transaction_id || event.metadata?.order_id;
    if (!providerReference) {
      res.status(400).json({ error: 'Missing payment reference' });
      return;
    }
    const eventName = webhookEvent || payload.event || '';
    const status = String(event.status || '').toLowerCase();
    if (eventName && eventName !== 'payment.success' && status !== 'completed') {
      res.status(200).json({ received: true, ignored: true });
      return;
    }
    if (status && !['success', 'completed', 'paid'].includes(status) && eventName !== 'payment.success') {
      res.status(200).json({ received: true, ignored: true });
      return;
    }
    const { data, error } = await adminSupabase.rpc('confirm_geniuspay_payment', {
      p_provider_reference: providerReference,
    });
    if (error) throw error;
    void writeSecurityAudit({ req, eventType: 'payment.webhook_processed', metadata: { provider: 'geniuspay' } });
    res.status(200).json({ received: true, result: data });
  } catch (error) {
    console.error('Error in GeniusPay webhook:', error instanceof Error ? error.message : 'unknown error');
    void writeSecurityAudit({ req, eventType: 'payment.webhook_failed', success: false });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/me/credits', requireAuth, authenticatedRateLimiter, async (req: Request, res: Response) => {
  try {
    res.json(await getWallet(getAuthenticatedUser(req).id));
  } catch (error) {
    res.status(creditErrorStatus(error)).json({ error: 'Unable to load credit wallet' });
  }
});

app.get('/api/credits/plans', requireAuth, authenticatedRateLimiter, async (_req: Request, res: Response) => {
  try {
    res.json({ plans: await getCreditPlans() });
  } catch (error) {
    res.status(creditErrorStatus(error)).json({ error: 'Unable to load credit plans' });
  }
});

app.post('/api/credits/reserve', requireAuth, authenticatedRateLimiter, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const operation = body.operation;
    const reference = body.reference;
    if (typeof operation !== 'string' || !creditOperations.has(operation as CreditOperation)) {
      res.status(400).json({ error: 'operation is required' });
      return;
    }
    if (reference !== undefined && !isBoundedString(reference, 128)) {
      res.status(400).json({ error: 'reference is invalid' });
      return;
    }
    const result = await reserveForRequest(req, operation as CreditOperation, typeof reference === 'string' ? reference : crypto.randomUUID());
    void writeSecurityAudit({ req, eventType: 'credits.reserved', metadata: { operation } });
    res.json(result);
  } catch (error) {
    void writeSecurityAudit({ req, eventType: 'credits.reserve_failed', success: false });
    res.status(creditErrorStatus(error)).json({ error: 'Unable to reserve credits' });
  }
});

app.post('/api/credits/:action', requireAuth, authenticatedRateLimiter, async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.body as { reservationId?: string };
    if (!reservationId || !['complete', 'refund'].includes(req.params.action)) {
      res.status(400).json({ error: 'Invalid credit action' });
      return;
    }
    const userId = getAuthenticatedUser(req).id;
    const result = req.params.action === 'complete'
      ? await completeReservation(userId, reservationId)
      : await refundReservation(userId, reservationId);
    void writeSecurityAudit({ req, eventType: `credits.${req.params.action}`, metadata: { reservation_id: reservationId } });
    res.json(result);
  } catch (error) {
    void writeSecurityAudit({ req, eventType: `credits.${req.params.action}_failed`, success: false });
    res.status(creditErrorStatus(error)).json({ error: 'Unable to update credit reservation' });
  }
});

app.post('/api/payments/geniuspay/create', requireAuth, paymentRateLimiter, async (req: Request, res: Response) => {
  try {
    if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    const { planId, paymentMethod, phoneNumber } = req.body as {
      planId?: unknown;
      paymentMethod?: unknown;
      phoneNumber?: unknown;
    };
    const acceptedPaymentMethods = new Set(['wave', 'orange_money', 'mtn_momo', 'card']);
    if (!isBoundedString(planId, 80) ||
      typeof paymentMethod !== 'string' ||
      !acceptedPaymentMethods.has(paymentMethod) ||
      !isValidPhoneNumber(phoneNumber)) {
      res.status(400).json({ error: 'Invalid payment details' });
      return;
    }
    const plans = await getCreditPlans();
    const plan = plans.find((item) => item.id === planId);
    if (!plan) {
      res.status(400).json({ error: 'Unknown plan' });
      return;
    }
    const providerUrl = process.env.GENIUSPAY_API_URL || 'https://geniuspay.ci/api/v1/merchant/payments';
    const providerApiKey = process.env.GENIUSPAY_API_KEY;
    const providerApiSecret = process.env.GENIUSPAY_API_SECRET;
    if (!providerApiKey || !providerApiSecret) {
      res.status(503).json({ error: 'GeniusPay is not configured on the backend' });
      return;
    }
    const reference = `ARCHI_${crypto.randomUUID()}`;
    const providerPaymentMethod = paymentMethod === 'mtn_momo' ? 'mtn_money' : paymentMethod;
    const appUrl = process.env.APP_URL || process.env.VITE_AUTH_REDIRECT_URL;
    const { error: insertError } = await adminSupabase.from('payment_transactions').insert({
      user_id: getAuthenticatedUser(req).id,
      plan_id: plan.id,
      provider: 'geniuspay',
      provider_reference: reference,
      amount_fcfa: plan.price_fcfa,
      status: 'PENDING',
    });
    if (insertError) throw insertError;
    const providerResponse = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-API-Key': providerApiKey,
        'X-API-Secret': providerApiSecret,
      },
      body: JSON.stringify({
        amount: plan.price_fcfa,
        currency: 'XOF',
        payment_method: providerPaymentMethod,
        description: `Crédits IA ArchiFact — ${plan.name}`,
        customer: {
          phone: phoneNumber,
        },
        success_url: appUrl ? `${appUrl}/settings?payment=success&reference=${encodeURIComponent(reference)}` : undefined,
        error_url: appUrl ? `${appUrl}/settings?payment=failed&reference=${encodeURIComponent(reference)}` : undefined,
        metadata: {
          order_id: reference,
          plan_id: plan.id,
          user_id: getAuthenticatedUser(req).id,
        },
      }),
    });
    if (!providerResponse.ok) {
      void writeSecurityAudit({ req, eventType: 'payment.initialization_failed', success: false });
      res.status(502).json({ error: 'GeniusPay payment initialization failed' });
      return;
    }
    const providerPayload = await providerResponse.json() as {
      success?: boolean;
      data?: { reference?: string; payment_url?: string; checkout_url?: string };
    };
    const providerReference = providerPayload.data?.reference || reference;
    if (providerReference !== reference) {
      const { error: updateError } = await adminSupabase
        .from('payment_transactions')
        .update({ provider_reference: providerReference })
        .eq('provider_reference', reference);
      if (updateError) throw updateError;
    }
    void writeSecurityAudit({ req, eventType: 'payment.initialized', metadata: { provider: 'geniuspay', plan_id: plan.id } });
    res.status(201).json({
      reference: providerReference,
      plan,
      checkoutUrl: providerPayload.data?.checkout_url || providerPayload.data?.payment_url || null,
      provider: providerPayload,
    });
  } catch (error) {
    console.error('Error creating GeniusPay payment:', error instanceof Error ? error.message : 'unknown error');
    void writeSecurityAudit({ req, eventType: 'payment.create_failed', success: false });
    res.status(creditErrorStatus(error)).json({ error: 'Unable to initialize payment' });
  }
});

// AI Analysis Endpoints

// Analyze image(s) for document extraction
app.post('/ai/analyze-image', requireAuth, aiRateLimiter, async (req: Request, res: Response) => {
  let reservationId: string | undefined;
  try {
    if (!genai) {
      return res.status(500).json({ error: 'Gemini AI not initialized' });
    }

    const { images } = req.body as { images?: unknown };

    if (!Array.isArray(images) || images.length === 0 || images.length > 8 || !images.every(isImageInput)) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const reservation = await reserveForRequest(req, 'AI_OCR_ANALYSIS', crypto.randomUUID());
    reservationId = reservation.reservation_id;

    // Build contents array for Gemini: each image followed by the prompt at the end
    const contents = [];
    for (const img of images) {
      contents.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType
        }
      });
    }
    contents.push({
      text: 'Analyze these image(s) and extract the following information in JSON format: type (quote, invoice, or article), clientName (string), clientPhone (string), date (string in DD/MM/YYYY format), dueDate (string in DD/MM/YYYY format, optional), items (array of objects with name, description, quantity, unitPrice), notes (string). Return only valid JSON. If multiple pages, combine the information into a single coherent document.'
    });

    // Implement actual Gemini Vision API call
    const result = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents
    });

    const responseText = result.text ?? '';
    let parsedData;
    try {
      // Try to parse the response as JSON
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // If the response is not valid JSON, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // If still not JSON, return a structured response based on the text
          parsedData = {
            type: 'quote',
            clientName: '',
            clientPhone: '',
            date: '',
            dueDate: undefined,
            items: [],
            notes: 'Failed to parse AI response'
          };
        }
      } else {
        parsedData = {
          type: 'quote',
          clientName: '',
          clientPhone: '',
          date: '',
          dueDate: undefined,
          items: [],
          notes: 'Failed to parse AI response'
        };
      }
    }

    // Ensure items array has the correct type
    if (!parsedData.items) {
      parsedData.items = [];
    }

    await completeReservation(getAuthenticatedUser(req).id, reservationId);
    void writeSecurityAudit({
      req,
      eventType: 'ai.image_analysis_completed',
      metadata: { image_count: images.length },
    });
    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    if (reservationId) {
      await refundReservation(getAuthenticatedUser(req).id, reservationId).catch(() => undefined);
    }
    console.error('Error in analyze-image:', error instanceof Error ? error.message : 'unknown error');
    void writeSecurityAudit({ req, eventType: 'ai.image_analysis_failed', success: false });
    res.status(creditErrorStatus(error)).json({ error: 'Internal server error' });
  }
});

// Transcribe audio to text
app.post('/ai/transcribe-audio', requireAuth, aiRateLimiter, async (req: Request, res: Response) => {
  let reservationId: string | undefined;
  try {
    if (!genai) {
      return res.status(500).json({ error: 'Gemini AI not initialized' });
    }

    const { audioBase64, mimeType } = req.body as { audioBase64?: unknown; mimeType?: unknown };

    if (!isValidBase64(audioBase64, 8_000_000) ||
      typeof mimeType !== 'string' ||
      !mimeType.startsWith('audio/')) {
      return res.status(400).json({ error: 'Audio data and mimeType are required' });
    }

    const reservation = await reserveForRequest(req, 'AI_VOICE_COMMAND', crypto.randomUUID());
    reservationId = reservation.reservation_id;

    // Implement actual Gemini Audio API call
    const result = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType
          }
        },
        { text: 'Transcribe this audio to text. Return the transcription in JSON format with fields: text (the transcribed string), confidence (a number between 0 and 1), language (detected language code, e.g., fr-FR). Return only valid JSON.' }
      ]
    });

    const responseText = result.text ?? '';
    let parsedData;
    try {
      // Try to parse the response as JSON
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // If the response is not valid JSON, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // If still not JSON, return a structured response based on the text
          parsedData = {
            text: responseText.substring(0, 500),
            confidence: 0.5,
            language: 'fr-FR'
          };
        }
      } else {
        parsedData = {
          text: responseText.substring(0, 500),
          confidence: 0.5,
          language: 'fr-FR'
        };
      }
    }

    await completeReservation(getAuthenticatedUser(req).id, reservationId);
    void writeSecurityAudit({ req, eventType: 'ai.audio_transcription_completed' });
    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    if (reservationId) {
      await refundReservation(getAuthenticatedUser(req).id, reservationId).catch(() => undefined);
    }
    console.error('Error in transcribe-audio:', error instanceof Error ? error.message : 'unknown error');
    void writeSecurityAudit({ req, eventType: 'ai.audio_transcription_failed', success: false });
    res.status(creditErrorStatus(error)).json({ error: 'Internal server error' });
  }
});

// Parse business command from text
app.post('/ai/parse-command', requireAuth, aiRateLimiter, async (req: Request, res: Response) => {
  let reservationId: string | undefined;
  try {
    if (!genai) {
      return res.status(500).json({ error: 'Gemini AI not initialized' });
    }

    const { text } = req.body as { text?: unknown };

    if (!isBoundedString(text, 2_000)) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const reservation = await reserveForRequest(req, 'AI_VOICE_COMMAND', crypto.randomUUID());
    reservationId = reservation.reservation_id;

    // Implement actual Gemini Text API call for command parsing
    const result = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: `Parse this French business command into structured data. Return JSON with fields: action (string), items (array of objects with description, quantity, unit, unitPrice, total). The command is: "${text}". Return only valid JSON.` }
      ]
    });

    const responseText = result.text ?? '';
    let parsedData;
    try {
      // Try to parse the response as JSON
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // If the response is not valid JSON, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // If still not JSON, return a default structure
          parsedData = {
            action: 'unknown',
            items: []
          };
        }
      } else {
        parsedData = {
          action: 'unknown',
          items: []
        };
      }
    }

    await completeReservation(getAuthenticatedUser(req).id, reservationId);
    void writeSecurityAudit({ req, eventType: 'ai.command_parsing_completed' });
    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    if (reservationId) {
      await refundReservation(getAuthenticatedUser(req).id, reservationId).catch(() => undefined);
    }
    console.error('Error in parse-command:', error instanceof Error ? error.message : 'unknown error');
    void writeSecurityAudit({ req, eventType: 'ai.command_parsing_failed', success: false });
    res.status(creditErrorStatus(error)).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message);
  void writeSecurityAudit({ req, eventType: 'http.unhandled_error', success: false });
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`AI Service running on port ${port}`);
  });
}

export default app;