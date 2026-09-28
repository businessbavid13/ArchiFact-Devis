export const AI_CREDIT_COSTS = {
  AI_QUOTE_FROM_IMAGE: 100,
  AI_INVOICE_FROM_IMAGE: 100,
  AI_ARTICLE_FROM_IMAGE: 50,
  AI_VOICE_COMMAND: 25,
  AI_OCR_ANALYSIS: 100,
} as const;

export type AiCreditOperation = keyof typeof AI_CREDIT_COSTS;
