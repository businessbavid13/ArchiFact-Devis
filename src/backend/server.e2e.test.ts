import { createHmac } from 'node:crypto';
import { createServer, IncomingMessage, request as httpRequest, Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const rpc = vi.fn(async (name: string) => {
    if (name === 'reserve_ai_credits_as_user') {
      return {
        data: {
          reservation_id: '11111111-1111-4111-8111-111111111111',
          transaction_id: '22222222-2222-4222-8222-222222222222',
          operation: 'AI_OCR_ANALYSIS',
          credits: 100,
          balance: 900,
        },
        error: null,
      };
    }
    if (name === 'confirm_geniuspay_payment') {
      return { data: { status: 'CONFIRMED', idempotent: false }, error: null };
    }
    return { data: 'audit-id', error: null };
  });

  const paymentTable = {
    insert: vi.fn(async () => ({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: { provider_reference: 'GP-TEST-001', plan_id: 'starter', amount_fcfa: 1000, status: 'PENDING' },
            error: null,
          })),
        })),
      })),
    })),
  };

  return {
    rpc,
    from: vi.fn(() => paymentTable),
    authenticateBearerToken: vi.fn(async (token: string) =>
      token === 'valid-token' ? { id: '33333333-3333-4333-8333-333333333333' } : null
    ),
    getCreditPlans: vi.fn(async () => [
      { id: 'starter', name: 'Starter', price_fcfa: 1000, credits: 10 },
    ]),
    getWallet: vi.fn(async () => ({
      plan: 'free',
      credits_total: 1000,
      credits_balance: 900,
    })),
    reserveCredits: vi.fn(async () => ({
      reservation_id: '11111111-1111-4111-8111-111111111111',
      transaction_id: '22222222-2222-4222-8222-222222222222',
      operation: 'AI_OCR_ANALYSIS',
      credits: 100,
      balance: 900,
    })),
    completeReservation: vi.fn(async () => ({ status: 'COMPLETED' })),
    refundReservation: vi.fn(async () => ({ status: 'REFUNDED' })),
  };
});

vi.mock('./credits', () => ({
  adminSupabase: { rpc: mocks.rpc, from: mocks.from },
  authenticateBearerToken: mocks.authenticateBearerToken,
  completeReservation: mocks.completeReservation,
  getCreditPlans: mocks.getCreditPlans,
  getWallet: mocks.getWallet,
  refundReservation: mocks.refundReservation,
  reserveCredits: mocks.reserveCredits,
  verifyGeniusPaySignature: (
    rawBody: string,
    signature: string | undefined,
    timestamp: string | undefined,
  ) => {
    if (!signature || !timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    const expected = createHmac('sha256', process.env.GENIUSPAY_WEBHOOK_SECRET || '')
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');
    return expected === signature;
  },
}));

process.env.VERCEL = '1';
process.env.GENIUSPAY_WEBHOOK_SECRET = 'e2e-secret';

const { default: app } = await import('./server');

function request(
  server: Server,
  method: string,
  path: string,
  body?: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: string }> {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server has no address');

  return new Promise((resolve, reject) => {
    const req = httpRequest({
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } : {}),
        ...headers,
      },
    }, (res: IncomingMessage) => {
      let responseBody = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => { responseBody += chunk; });
      res.on('end', () => resolve({ status: res.statusCode || 0, body: responseBody }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

let server: Server;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
});

beforeEach(() => {
  mocks.rpc.mockClear();
  mocks.from.mockClear();
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        reference: 'GP-TEST-001',
        checkout_url: 'https://geniuspay.ci/checkout/GP-TEST-001',
      },
    }),
  })));
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe('backend payment and AI credit E2E', () => {
  it('rejects protected requests without a bearer token', async () => {
    const response = await request(server, 'GET', '/api/me/credits');
    expect(response.status).toBe(401);
  });

  it('validates payment input before contacting GeniusPay', async () => {
    const response = await request(
      server,
      'POST',
      '/api/payments/geniuspay/create',
      JSON.stringify({ planId: 'starter', paymentMethod: 'invalid', phoneNumber: 'x' }),
      { authorization: 'Bearer valid-token' },
    );
    expect(response.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('reserves AI credits for an authenticated user', async () => {
    const response = await request(
      server,
      'POST',
      '/api/credits/reserve',
      JSON.stringify({ operation: 'AI_OCR_ANALYSIS' }),
      { authorization: 'Bearer valid-token' },
    );
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body).reservation_id).toBe('11111111-1111-4111-8111-111111111111');
    expect(mocks.reserveCredits).toHaveBeenCalledWith(
      '33333333-3333-4333-8333-333333333333',
      'AI_OCR_ANALYSIS',
      expect.any(String),
    );
  });

  it('creates a GeniusPay checkout with server-side credentials', async () => {
    process.env.GENIUSPAY_API_KEY = 'pk_test';
    process.env.GENIUSPAY_API_SECRET = 'sk_test';
    process.env.APP_URL = 'https://archi-fact-devis.vercel.app';

    const response = await request(
      server,
      'POST',
      '/api/payments/geniuspay/create',
      JSON.stringify({ planId: 'starter', paymentMethod: 'mtn_momo', phoneNumber: '+2250700000000' }),
      { authorization: 'Bearer valid-token' },
    );

    expect(response.status).toBe(201);
    expect(JSON.parse(response.body).checkoutUrl).toBe('https://geniuspay.ci/checkout/GP-TEST-001');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'pk_test',
          'X-API-Secret': 'sk_test',
        }),
      }),
    );
  });

  it('creates a hosted GeniusPay checkout when no payment method is chosen', async () => {
    process.env.GENIUSPAY_API_KEY = 'pk_test';
    process.env.GENIUSPAY_API_SECRET = 'sk_test';
    process.env.APP_URL = 'https://archi-fact-devis.vercel.app';

    const response = await request(
      server,
      'POST',
      '/api/payments/geniuspay/create',
      JSON.stringify({ planId: 'starter' }),
      { authorization: 'Bearer valid-token' },
    );

    expect(response.status).toBe(201);
    expect(JSON.parse(response.body).checkoutUrl).toBe('https://geniuspay.ci/checkout/GP-TEST-001');
    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const providerBody = JSON.parse(String(init?.body));
    expect(providerBody.payment_method).toBeUndefined();
    expect(providerBody.amount).toBe(1000);
    expect(providerBody.success_url).toMatch(/^https:\/\/archi-fact-devis\.vercel\.app\/#\/\?payment=success&reference=/);
  });

  it('confirms a payment after verifying it with the GeniusPay API', async () => {
    process.env.GENIUSPAY_API_KEY = 'pk_test';
    process.env.GENIUSPAY_API_SECRET = 'sk_test';
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          status: 'completed',
          amount: 1000,
          metadata: { user_id: '33333333-3333-4333-8333-333333333333', plan_id: 'starter' },
        },
      }),
    } as Response);

    const response = await request(
      server,
      'GET',
      '/api/payments/geniuspay/GP-TEST-001',
      undefined,
      { authorization: 'Bearer valid-token' },
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body).status).toBe('CONFIRMED');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/GP-TEST-001$/),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-API-Secret': 'sk_test' }) }),
    );
    expect(mocks.rpc).toHaveBeenCalledWith('confirm_geniuspay_payment', { p_provider_reference: 'GP-TEST-001' });
  });

  it('does not confirm a payment whose amount does not match', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          status: 'completed',
          amount: 200,
          metadata: { user_id: '33333333-3333-4333-8333-333333333333', plan_id: 'starter' },
        },
      }),
    } as Response);

    const response = await request(
      server,
      'GET',
      '/api/payments/geniuspay/GP-TEST-001',
      undefined,
      { authorization: 'Bearer valid-token' },
    );

    expect(JSON.parse(response.body).status).toBe('PENDING');
    expect(mocks.rpc).not.toHaveBeenCalledWith('confirm_geniuspay_payment', expect.anything());
  });

  it('accepts a signed current GeniusPay success webhook', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({
      event: 'payment.success',
      data: { reference: 'GP-TEST-001', status: 'completed' },
    });
    const signature = createHmac('sha256', 'e2e-secret')
      .update(`${timestamp}.${body}`)
      .digest('hex');

    const response = await request(
      server,
      'POST',
      '/webhooks/geniuspay',
      body,
      {
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp,
        'x-webhook-event': 'payment.success',
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'confirm_geniuspay_payment',
      { p_provider_reference: 'GP-TEST-001' },
    );
  });

  it('rejects stale webhook timestamps', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000) - 301);
    const body = JSON.stringify({
      event: 'payment.success',
      data: { reference: 'GP-TEST-001', status: 'completed' },
    });
    const signature = createHmac('sha256', 'e2e-secret')
      .update(`${timestamp}.${body}`)
      .digest('hex');

    const response = await request(
      server,
      'POST',
      '/webhooks/geniuspay',
      body,
      {
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp,
        'x-webhook-event': 'payment.success',
      },
    );

    expect(response.status).toBe(401);
  });
});
