/**
 * Currency and number formatting utilities for Swiss freelancers.
 * Default currency: CHF with Swiss formatting conventions.
 */

const CHF_FORMATTER = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("de-CH", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Format amount as CHF currency string, e.g. "CHF 12'345.00" */
export function formatCHF(amount: number): string {
  return CHF_FORMATTER.format(amount);
}

/** Format amount as compact CHF, e.g. "CHF 12.3K" for large values */
export function formatCHFCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `CHF ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 10_000) {
    return `CHF ${(amount / 1_000).toFixed(1)}K`;
  }
  return CHF_FORMATTER.format(amount);
}

/** Format as integer with Swiss thousand separators */
export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/** Format as percentage, e.g. 0.22 → "22.0%" */
export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

/** Format date as "Jan 2025" */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-CH", {
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Format date as "15 Jan 2025" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format date as YYYY-MM-DD for form inputs */
export function formatDateInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}
