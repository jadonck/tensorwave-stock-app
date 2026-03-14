/**
 * Formatting Utility Tests
 *
 * Tests all display/formatting functions used across the app:
 *   - displayValue: safe string rendering with N/A fallback for null/undefined/empty
 *   - formatCurrency: USD currency formatting ($1,234.56)
 *   - formatNumber: comma-separated number formatting (1,234,567)
 *   - formatMarketCap: human-readable market cap ($2.80 trillion / billion / million)
 *   - formatPercent: signed percentage formatting (+2.35% / -1.50%)
 *
 * Why: These functions are the boundary between raw API data and what the user
 * sees. Incorrect formatting (e.g. showing "null" instead of "N/A", or
 * missing commas on large volumes) would be immediately visible on the page.
 */

import {
  displayValue,
  formatCurrency,
  formatNumber,
  formatMarketCap,
  formatPercent,
} from "@/lib/alphavantage";

// ─── displayValue ───────────────────────────────────────────────────────────

describe("displayValue", () => {
  it("returns the string when given a non-empty string", () => {
    expect(displayValue("NVIDIA")).toBe("NVIDIA");
  });

  it("returns 'N/A' for null", () => {
    expect(displayValue(null)).toBe("N/A");
  });

  it("returns 'N/A' for undefined", () => {
    expect(displayValue(undefined)).toBe("N/A");
  });

  it("returns 'N/A' for empty string", () => {
    expect(displayValue("")).toBe("N/A");
    expect(displayValue("   ")).toBe("N/A");
  });

  it("converts numbers to strings", () => {
    expect(displayValue(42)).toBe("42");
    expect(displayValue(0)).toBe("0");
  });
});

// ─── formatCurrency ─────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats a number as USD currency", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats a string number as USD currency", () => {
    expect(formatCurrency("9876543")).toBe("$9,876,543.00");
  });

  it("returns 'N/A' for null, undefined, and 'N/A'", () => {
    expect(formatCurrency(null)).toBe("N/A");
    expect(formatCurrency(undefined)).toBe("N/A");
    expect(formatCurrency("N/A")).toBe("N/A");
  });

  it("returns 'N/A' for non-numeric strings", () => {
    expect(formatCurrency("abc")).toBe("N/A");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

// ─── formatNumber ───────────────────────────────────────────────────────────

describe("formatNumber", () => {
  it("formats a number with commas", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formats a string number with commas", () => {
    expect(formatNumber("9876543")).toBe("9,876,543");
  });

  it("returns 'N/A' for null, undefined, and 'N/A'", () => {
    expect(formatNumber(null)).toBe("N/A");
    expect(formatNumber(undefined)).toBe("N/A");
    expect(formatNumber("N/A")).toBe("N/A");
  });

  it("returns 'N/A' for non-numeric strings", () => {
    expect(formatNumber("xyz")).toBe("N/A");
  });
});

// ─── formatMarketCap ────────────────────────────────────────────────────────

describe("formatMarketCap", () => {
  it("formats trillions", () => {
    expect(formatMarketCap(3.5e12)).toBe("$3.50 trillion");
  });

  it("formats billions", () => {
    expect(formatMarketCap(250e9)).toBe("$250.00 billion");
  });

  it("formats millions", () => {
    expect(formatMarketCap(75e6)).toBe("$75.00 million");
  });

  it("formats small values as currency", () => {
    expect(formatMarketCap(999)).toBe("$999.00");
  });

  it("returns 'N/A' for null, undefined, and 'N/A'", () => {
    expect(formatMarketCap(null)).toBe("N/A");
    expect(formatMarketCap(undefined)).toBe("N/A");
    expect(formatMarketCap("N/A")).toBe("N/A");
  });
});

// ─── formatPercent ──────────────────────────────────────────────────────────

describe("formatPercent", () => {
  it("formats positive percentages with +", () => {
    expect(formatPercent(2.345)).toBe("+2.35%");
  });

  it("formats negative percentages", () => {
    expect(formatPercent(-1.5)).toBe("-1.50%");
  });

  it("formats zero as +0.00%", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });

  it("returns 'N/A' for null and undefined", () => {
    expect(formatPercent(null)).toBe("N/A");
    expect(formatPercent(undefined)).toBe("N/A");
  });
});
