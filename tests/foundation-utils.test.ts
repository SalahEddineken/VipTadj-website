import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';
import { formatDZD, parseDZD } from '@/lib/utils/formatDZD';

describe('Base Utilities', () => {
  describe('cn (Tailwind Merge & Clsx)', () => {
    it('combines multiple class strings', () => {
      expect(cn('font-serif', 'text-obsidian-950')).toBe('font-serif text-obsidian-950');
    });

    it('resolves conflicting Tailwind classes', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('text-black', 'text-white')).toBe('text-white');
    });

    it('ignores falsy values and conditions', () => {
      const isGold = false;
      expect(cn('base-class', isGold && 'text-gold-500', null, undefined)).toBe('base-class');
    });
  });

  describe('formatDZD (Algerian Currency Formatter)', () => {
    it('formats standard amounts with non-breaking space and DA suffix', () => {
      const result = formatDZD(18500);
      expect(result).toBe('18\u00A0500\u00A0DA');
    });

    it('handles zero cleanly', () => {
      expect(formatDZD(0)).toBe('0\u00A0DA');
    });

    it('handles null and undefined gracefully', () => {
      expect(formatDZD(null)).toBe('0\u00A0DA');
      expect(formatDZD(undefined)).toBe('0\u00A0DA');
    });

    it('formats large numbers across millions', () => {
      expect(formatDZD(1250000)).toBe('1\u00A0250\u00A0000\u00A0DA');
    });

    it('supports DZD currency code and suppression of currency symbol', () => {
      expect(formatDZD(4500, { currencyCode: 'DZD' })).toBe('4\u00A0500\u00A0DZD');
      expect(formatDZD(4500, { showCurrency: false })).toBe('4\u00A0500');
    });

    it('parses formatted strings back to numbers', () => {
      expect(parseDZD('18 500 DA')).toBe(18500);
      expect(parseDZD('18\u00A0500\u00A0DA')).toBe(18500);
      expect(parseDZD('0 DA')).toBe(0);
    });
  });
});
