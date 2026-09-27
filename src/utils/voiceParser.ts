/**
 * Voice Parser for French Construction & Artisan Job Site Dictation
 * Parses spoken phrases like:
 * "Ajoute 5 pots de peinture blanche à 28 000 et 3 rouleaux"
 * "10 sacs de ciment à 5 500 et 2 brouettes à 35000"
 */

import { DocumentItem } from '../types';

interface ParsedVoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  'dix-sept': 17,
  'dix-huit': 18,
  'dix-neuf': 19,
  vingt: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  cent: 100,
  cents: 100,
  mille: 1000,
};

/**
 * Converts spelled-out numbers like "vingt-huit mille" or "5 mille" into numeric value
 */
export function parseSpokenNumber(text: string): number | null {
  const clean = text.trim().toLowerCase().replace(/\s+/g, ' ');
  // If it's a direct number or number with spaces like "28 000" or "28000"
  const digitsOnly = clean.replace(/\s+/g, '').replace(/,/g, '.');
  if (/^\d+(\.\d+)?$/.test(digitsOnly)) {
    return parseFloat(digitsOnly);
  }

  // Complex spoken number parser (e.g. "vingt huit mille", "cinq cents", "trois mille cinq cents")
  const tokens = clean.split(/[\s-]+/);
  let total = 0;
  let current = 0;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      current += parseInt(token, 10);
    } else if (NUMBER_WORDS[token] !== undefined) {
      const val = NUMBER_WORDS[token];
      if (val === 100) {
        current = (current === 0 ? 1 : current) * 100;
      } else if (val === 1000) {
        current = (current === 0 ? 1 : current) * 1000;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }

  const result = total + current;
  return result > 0 ? result : null;
}

/**
 * Cleans leading verbal triggers from voice command
 */
function cleanIntro(rawText: string): string {
  let text = rawText.trim();
  text = text.replace(/^(ajoute|ajoutes|ajoutez|rajoute|rajoutez|mets|mettez|écris|note|inclus|insère)\s+/i, '');
  text = text.replace(/^(s'il te plaît|s'il vous plaît|stp|svp)\s*,?\s*/i, '');
  return text.trim();
}

/**
 * Splits continuous voice transcript into distinct item segments
 * e.g. "5 pots de peinture à 28 000 et 3 rouleaux" -> ["5 pots de peinture à 28 000", "3 rouleaux"]
 */
function splitIntoItemSegments(text: string): string[] {
  // Replace conjunctions used as item separators:
  // " et 3 rouleaux", " puis 2 sacs", " plus 1 marteau", " , "
  // Be careful not to split inside numbers like "vingt et un"
  const prepared = text
    .replace(/\b(vingt|trente|quarante|cinquante|soixante)\s+et\s+un\b/gi, '$1-et-un')
    .replace(/\s+(?:puis|ensuite|plus|également)\s+/gi, ' ### ')
    .replace(/,\s*(?=(?:\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\b)/gi, ' ### ')
    .replace(/\s+et\s+(?=(?:\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\b)/gi, ' ### ');

  return prepared
    .split('###')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parses a single item segment like:
 * "5 pots de peinture blanche à 28 000"
 * "3 rouleaux"
 * "10 sacs de ciment au prix de 5500"
 */
function parseSingleSegment(segment: string): ParsedVoiceItem | null {
  let seg = segment.trim();
  if (!seg) return null;

  // Extract Price if present (e.g. "à 28 000 fcfa", "au prix de 28 000", "pour 15000", "à 5000")
  let unitPrice = 0;
  const priceRegex = /(?:à|au prix de|pour|tarif de|coût de)\s+([0-9\s]+(?:[.,]\d+)?|\b(?:[a-zéèê-]+(?:\s+[a-zéèê-]+)*)\s+mille|\b(?:[a-zéèê-]+))\s*(?:fcfa|f cfa|francs?|cfa|euros?|€|\$)?\s*$/i;
  const priceMatch = seg.match(priceRegex);

  if (priceMatch) {
    const rawPriceStr = priceMatch[1].trim();
    const parsedPrice = parseSpokenNumber(rawPriceStr);
    if (parsedPrice && parsedPrice > 0) {
      unitPrice = parsedPrice;
    }
    // Remove the price part from description
    seg = seg.substring(0, priceMatch.index).trim();
  }

  // Extract Quantity if present at start (e.g. "5 pots de...", "trois rouleaux", "1 sac...")
  let quantity = 1;
  const qtyRegex = /^([0-9]+|\b(?:un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt|trente|quarante|cinquante|cent)\b)\s+(.*)$/i;
  const qtyMatch = seg.match(qtyRegex);

  let rawName = seg;
  if (qtyMatch) {
    const rawQtyStr = qtyMatch[1].trim();
    const parsedQty = parseSpokenNumber(rawQtyStr);
    if (parsedQty && parsedQty > 0) {
      quantity = parsedQty;
      rawName = qtyMatch[2].trim();
    }
  }

  // Capitalize first letter of item name
  let name = rawName.replace(/^de\s+/i, '').trim();
  if (!name) {
    name = 'Fourniture / Article';
  }
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  };
}

/**
 * Main export: parses spoken text into an array of DocumentItems
 */
export function parseVoiceDictation(spokenText: string): DocumentItem[] {
  const cleaned = cleanIntro(spokenText);
  if (!cleaned) return [];

  const segments = splitIntoItemSegments(cleaned);
  const items: DocumentItem[] = [];

  segments.forEach((seg, idx) => {
    const parsed = parseSingleSegment(seg);
    if (parsed && parsed.name) {
      items.push({
        id: `voice-item-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: parsed.name,
        quantity: parsed.quantity,
        unitPrice: parsed.unitPrice,
        total: parsed.total,
        description: 'Ajouté par dictée vocale chantier',
      });
    }
  });

  return items;
}
