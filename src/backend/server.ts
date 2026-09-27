import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
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
} from './credits';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use('/webhooks/geniuspay', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
const genai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type AuthenticatedRequest = Request & { user: AuthenticatedUser };
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
  const subject = isSignup ? 'Bienvenue sur ArchiFact — votre code de connexion' : 'Votre code de connexion ArchiFact';
  const title = isSignup ? 'Bienvenue sur ArchiFact' : 'Votre code de connexion';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_NAME ? `${process.env.RESEND_FROM_NAME} <${from}>` : from,
      to: [to],
      subject,
      html: `
        <div style="background:#fafaf8;padding:40px 20px;font-family:Arial,sans-serif;color:#171717">
          <div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e6e6e1;border-radius:20px;padding:36px">
            <div style="color:#d97757;font-size:20px;font-weight:700">✦ ArchiFact</div>
            <h1 style="font-size:28px;margin:28px 0 12px">${title}</h1>
            <p style="font-size:16px;line-height:1.6">Utilisez le code ci-dessous pour continuer :</p>
            <div style="background:#171717;color:#fff;border-radius:12px;font-size:32px;letter-spacing:10px;text-align:center;padding:18px 12px;margin:24px 0">${token}</div>
            <p style="color:#666;font-size:14px;line-height:1.6">Ce code expire selon la configuration de votre projet Supabase. Ne le partagez avec personne.</p>
            <p style="color:#999;font-size:12px;margin-top:32px">ArchiFact — Devis et factures professionnels</p>
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

async function reserveForRequest(
  req: Request,
  operation: CreditOperation,
  reference: string
) {
  return reserveCredits(getAuthenticatedUser(req).id, operation, reference);
}

app.post('/auth/hooks/send-email', async (req: Request, res: Response) => {
  const authorization = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!constantTimeSecretMatch(authorization, process.env.AUTH_HOOK_SECRET)) {
    res.status(401).json({ error: 'Invalid auth hook secret' });
    return;
  }

  const payload = req.body as AuthEmailHookPayload;
  const email = payload.user?.email;
  const token = payload.email_data?.token;
  const actionType = payload.email_data?.email_action_type || 'magic_link';
  if (!email || !token) {
    res.status(400).json({ error: 'Invalid auth email payload' });
    return;
  }

  try {
    await sendAuthEmail(email, token, actionType);
    res.status(200).json({});
  } catch (error) {
    console.error('Error sending auth email:', error);
    res.status(502).json({ error: 'Unable to send auth email' });
  }
});

app.post('/webhooks/geniuspay', async (req: Request, res: Response) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
  if (!verifyGeniusPaySignature(rawBody, req.header('x-geniuspay-signature'))) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  try {
    if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    const payload = JSON.parse(rawBody) as {
      status?: string;
      reference?: string;
      transaction_id?: string;
      data?: { status?: string; reference?: string; transaction_id?: string };
    };
    const event = payload.data || payload;
    const providerReference = event.reference || event.transaction_id;
    if (!providerReference) {
      res.status(400).json({ error: 'Missing payment reference' });
      return;
    }
    if (String(event.status || '').toLowerCase() !== 'success') {
      res.status(200).json({ received: true, ignored: true });
      return;
    }
    const { data, error } = await adminSupabase.rpc('confirm_geniuspay_payment', {
      p_provider_reference: providerReference,
    });
    if (error) throw error;
    res.status(200).json({ received: true, result: data });
  } catch (error) {
    console.error('Error in GeniusPay webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/me/credits', requireAuth, async (req: Request, res: Response) => {
  try {
    res.json(await getWallet(getAuthenticatedUser(req).id));
  } catch (error) {
    res.status(creditErrorStatus(error)).json({ error: 'Unable to load credit wallet' });
  }
});

app.get('/api/credits/plans', requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json({ plans: await getCreditPlans() });
  } catch (error) {
    res.status(creditErrorStatus(error)).json({ error: 'Unable to load credit plans' });
  }
});

app.post('/api/credits/reserve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { operation, reference } = req.body as { operation?: CreditOperation; reference?: string };
    if (!operation) {
      res.status(400).json({ error: 'operation is required' });
      return;
    }
    res.json(await reserveForRequest(req, operation, reference || crypto.randomUUID()));
  } catch (error) {
    res.status(creditErrorStatus(error)).json({ error: 'Unable to reserve credits' });
  }
});

app.post('/api/credits/:action', requireAuth, async (req: Request, res: Response) => {
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
    res.json(result);
  } catch (error) {
    res.status(creditErrorStatus(error)).json({ error: 'Unable to update credit reservation' });
  }
});

app.post('/api/payments/geniuspay/create', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!adminSupabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    const { planId, paymentMethod, phoneNumber } = req.body as {
      planId?: string;
      paymentMethod?: string;
      phoneNumber?: string;
    };
    const plans = await getCreditPlans();
    const plan = plans.find((item) => item.id === planId);
    if (!plan) {
      res.status(400).json({ error: 'Unknown plan' });
      return;
    }
    const providerUrl = process.env.GENIUSPAY_API_URL;
    const providerKey = process.env.GENIUSPAY_API_KEY;
    if (!providerUrl || !providerKey) {
      res.status(503).json({ error: 'GeniusPay is not configured on the backend' });
      return;
    }
    const reference = `ARCHI_${crypto.randomUUID()}`;
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
      headers: { 'content-type': 'application/json', authorization: `Bearer ${providerKey}` },
      body: JSON.stringify({
        amount: plan.price_fcfa,
        currency: 'XOF',
        reference,
        payment_method: paymentMethod,
        customer_phone: phoneNumber,
        callback_url: `${process.env.APP_URL || ''}/webhooks/geniuspay`,
      }),
    });
    if (!providerResponse.ok) {
      res.status(502).json({ error: 'GeniusPay payment initialization failed' });
      return;
    }
    res.status(201).json({ reference, plan, provider: await providerResponse.json() });
  } catch (error) {
    console.error('Error creating GeniusPay payment:', error);
    res.status(creditErrorStatus(error)).json({ error: 'Unable to initialize payment' });
  }
});

// AI Analysis Endpoints

// Analyze image(s) for document extraction
app.post('/ai/analyze-image', requireAuth, async (req: Request, res: Response) => {
  let reservationId: string | undefined;
  try {
    if (!genai) {
      return res.status(500).json({ error: 'Gemini AI not initialized' });
    }

    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    // Validate each image
    for (const img of images) {
      if (!img.base64 || !img.mimeType) {
        return res.status(400).json({ error: 'Each image must have base64 and mimeType' });
      }
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
    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    if (reservationId) {
      await refundReservation(getAuthenticatedUser(req).id, reservationId).catch(() => undefined);
    }
    console.error('Error in analyze-image:', error);
    res.status(creditErrorStatus(error)).json({ error: 'Internal server error' });
  }
});

// Transcribe audio to text
app.post('/ai/transcribe-audio', requireAuth, async (req: Request, res: Response) => {
  let reservationId: string | undefined;
  try {
    if (!genai) {
      return res.status(500).json({ error: 'Gemini AI not initialized' });
    }

    const { audioBase64, mimeType } = req.body;

    if (!audioBase64 || !mimeType) {
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
    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    if (reservationId) {
      await refundReservation(getAuthenticatedUser(req).id, reservationId).catch(() => undefined);
    }
    console.error('Error in transcribe-audio:', error);
    res.status(creditErrorStatus(error)).json({ error: 'Internal server error' });
  }
});

// Parse business command from text
app.post('/ai/parse-command', requireAuth, async (req: Request, res: Response) => {
  let reservationId: string | undefined;
  try {
    if (!genai) {
      return res.status(500).json({ error: 'Gemini AI not initialized' });
    }

    const { text } = req.body;

    if (!text) {
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
    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    if (reservationId) {
      await refundReservation(getAuthenticatedUser(req).id, reservationId).catch(() => undefined);
    }
    console.error('Error in parse-command:', error);
    res.status(creditErrorStatus(error)).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`AI Service running on port ${port}`);
});

export default app;