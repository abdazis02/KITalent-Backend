import { DEFAULT_LOCALE, type Locale } from '@kitalent/types';

/**
 * Locale-aware formatters — PRD §10.34 #6.
 *   id-ID → "31 Mei 2026", "Rp10.000.000"
 *   en-US → "May 31, 2026", "IDR 10,000,000"
 * Uses Intl so behavior stays correct without bundling locale data manually.
 */

export function formatCurrency(
  amount: number,
  locale: Locale = DEFAULT_LOCALE,
  currency = 'IDR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(
  ratio: number,
  locale: Locale = DEFAULT_LOCALE,
  fractionDigits = 1,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

export function formatDate(
  date: Date | string,
  locale: Locale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale = DEFAULT_LOCALE): string {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
