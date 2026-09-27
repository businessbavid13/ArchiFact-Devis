import { describe, it, expect } from 'vitest';
import { parseVoiceDictation, parseSpokenNumber } from './voiceParser';

describe('parseSpokenNumber', () => {
  it('parses plain digits', () => {
    expect(parseSpokenNumber('5')).toBe(5);
    expect(parseSpokenNumber('28000')).toBe(28000);
  });

  it('parses digits with spaces (FCFA format)', () => {
    expect(parseSpokenNumber('28 000')).toBe(28000);
    expect(parseSpokenNumber('6 500')).toBe(6500);
    expect(parseSpokenNumber('1 500 000')).toBe(1500000);
  });

  it('parses French number words', () => {
    expect(parseSpokenNumber('cinq')).toBe(5);
    expect(parseSpokenNumber('dix')).toBe(10);
    expect(parseSpokenNumber('vingt')).toBe(20);
    expect(parseSpokenNumber('cent')).toBe(100);
  });

  it('parses compound French numbers', () => {
    expect(parseSpokenNumber('vingt-huit')).toBe(28);
    expect(parseSpokenNumber('trente cinq')).toBe(35);
  });

  it('parses "mille" combinations', () => {
    expect(parseSpokenNumber('mille')).toBe(1000);
    expect(parseSpokenNumber('cinq mille')).toBe(5000);
    expect(parseSpokenNumber('six mille cinq cents')).toBe(6500);
    expect(parseSpokenNumber('vingt-huit mille')).toBe(28000);
  });

  it('returns null for empty or unrecognized input', () => {
    expect(parseSpokenNumber('')).toBeNull();
    expect(parseSpokenNumber('bonjour')).toBeNull();
  });
});

describe('parseVoiceDictation', () => {
  // ── Single item with quantity and price ──

  it('parses "5 sacs de ciment à 6500"', () => {
    const items = parseVoiceDictation('5 sacs de ciment à 6500');
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
    expect(items[0].unitPrice).toBe(6500);
    expect(items[0].name.toLowerCase()).toContain('ciment');
  });

  it('parses "10 barres de fer à 3500"', () => {
    const items = parseVoiceDictation('10 barres de fer à 3500');
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(10);
    expect(items[0].unitPrice).toBe(3500);
  });

  it('parses item with spaced price "3 rouleaux à 28 000"', () => {
    const items = parseVoiceDictation('3 rouleaux à 28 000');
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
    expect(items[0].unitPrice).toBe(28000);
  });

  // ── Multiple items with "et" separator ──

  it('parses "5 pots de peinture à 28 000 et 3 rouleaux"', () => {
    const items = parseVoiceDictation('5 pots de peinture à 28 000 et 3 rouleaux');
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].quantity).toBe(5);
    expect(items[0].unitPrice).toBe(28000);
    expect(items[1].quantity).toBe(3);
  });

  it('parses "10 sacs de ciment à 5 500 et 2 brouettes à 35000"', () => {
    const items = parseVoiceDictation('10 sacs de ciment à 5 500 et 2 brouettes à 35000');
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].quantity).toBe(10);
    expect(items[0].unitPrice).toBe(5500);
    expect(items[1].quantity).toBe(2);
    expect(items[1].unitPrice).toBe(35000);
  });

  // ── With verbal intro (ajoute, mets, etc.) ──

  it('strips verbal intro "ajoute"', () => {
    const items = parseVoiceDictation('ajoute 5 sacs de ciment à 6500');
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it('strips verbal intro "mets"', () => {
    const items = parseVoiceDictation('mets 3 rouleaux de câble à 1500');
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  // ── Item without price ──

  it('parses item without price (price = 0)', () => {
    const items = parseVoiceDictation('5 sacs de ciment');
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
    expect(items[0].unitPrice).toBe(0);
  });

  // ── Empty / invalid input ──

  it('returns empty array for empty input', () => {
    expect(parseVoiceDictation('')).toEqual([]);
  });

  // ── Items have expected structure ──

  it('returns DocumentItem-shaped objects', () => {
    const items = parseVoiceDictation('3 tôles à 15000');
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('unitPrice');
    expect(item).toHaveProperty('total');
    expect(item.total).toBe(item.quantity * item.unitPrice);
  });

  // ── "puis" separator ──

  it('handles "puis" as item separator', () => {
    const items = parseVoiceDictation('5 sacs de ciment à 5000 puis 10 barres de fer à 3500');
    expect(items.length).toBeGreaterThanOrEqual(2);
  });
});
