export interface FormatDZDOptions {
  showCurrency?: boolean;
  currencyCode?: string;
  useNonBreakingSpace?: boolean;
  locale?: string;
}

/**
 * Formats monetary amounts in Algerian Dinars (DZD / DA / د.ج) according to Algerian retail conventions.
 * Defaults to integer formatting with non-breaking spaces to prevent awkward line breaks on mobile.
 * Supports locale-aware formatting:
 *   - 'fr' (default): "18 500 DA"
 *   - 'en':           "18,500 DZD"
 *   - 'ar':           "18 500 د.ج" (using Western Arabic numerals 0-9 as standard in Algerian retail)
 */
export function formatDZD(
  amount: number | null | undefined,
  options: FormatDZDOptions = {}
): string {
  const {
    showCurrency = true,
    currencyCode,
    useNonBreakingSpace = true,
    locale = 'fr',
  } = options;

  // Resolve localized currency symbol if not explicitly provided
  const resolvedCurrencyCode =
    currencyCode ||
    (locale === 'ar' ? 'د.ج' : locale === 'en' ? 'DZD' : 'DA');

  const space = useNonBreakingSpace ? '\u00A0' : ' ';

  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return showCurrency ? `0${space}${resolvedCurrencyCode}` : '0';
  }

  const rounded = Math.sign(amount) * Math.round(Math.abs(amount));
  const isNegative = rounded < 0;
  const absString = Math.abs(rounded).toString();

  // Group thousands: ',' for en, non-breaking space for fr/ar
  const thousandSep = locale === 'en' ? ',' : space;
  const formattedNumber = absString.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  const signedNumber = isNegative ? `-${formattedNumber}` : formattedNumber;

  if (!showCurrency) {
    return signedNumber;
  }

  return `${signedNumber}${space}${resolvedCurrencyCode}`;
}

/**
 * Parses a formatted DZD string back into a numeric amount.
 * Example: "18 500 DA" => 18500
 */
export function parseDZD(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== 'string') return 0;
  if (!value.trim()) return 0;

  const cleaned = value.replace(/[^\d.-]/g, '');
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
