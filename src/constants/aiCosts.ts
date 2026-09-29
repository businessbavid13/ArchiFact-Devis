export const AI_CREDIT_COSTS = {
  AI_QUOTE_FROM_IMAGE: 2,
  AI_INVOICE_FROM_IMAGE: 2,
  AI_ARTICLE_FROM_IMAGE: 1,
  AI_VOICE_COMMAND: 1,
  AI_OCR_ANALYSIS: 2,
} as const;

export type AiCreditOperation = keyof typeof AI_CREDIT_COSTS;
