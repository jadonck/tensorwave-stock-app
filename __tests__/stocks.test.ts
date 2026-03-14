/**
 * Stock Metadata Validation Tests
 *
 * Validates the static STOCKS array that drives the homepage cards:
 *   - Exactly 15 stocks (matches assignment requirement)
 *   - No duplicate symbols (prevents routing collisions)
 *   - Every entry has all required fields (symbol, name, sector, logo)
 *   - Symbols are uppercase (consistency with API conventions)
 *   - Logo URLs are valid (prevents broken images on homepage)
 *   - Key stocks are present (NVDA, AMD, MSFT, GOOGL, AMZN)
 *   - Alphabetical ordering (consistent UI presentation)
 *
 * Why: This data is the source of truth for the entire homepage. A missing
 * field or broken URL would cause a visible UI defect without any API call.
 */

import { STOCKS, StockMeta } from "@/lib/stocks";

describe("STOCKS list", () => {
  it("contains exactly 15 stocks", () => {
    expect(STOCKS).toHaveLength(15);
  });

  it("has no duplicate symbols", () => {
    const symbols = STOCKS.map((s) => s.symbol);
    const unique = new Set(symbols);
    expect(unique.size).toBe(symbols.length);
  });

  it("every stock has all required fields", () => {
    STOCKS.forEach((stock: StockMeta) => {
      expect(stock.symbol).toBeTruthy();
      expect(stock.name).toBeTruthy();
      expect(stock.sector).toBeTruthy();
      expect(stock.logo).toBeTruthy();
    });
  });

  it("every symbol is uppercase", () => {
    STOCKS.forEach((stock) => {
      expect(stock.symbol).toBe(stock.symbol.toUpperCase());
    });
  });

  it("every logo URL is a valid URL", () => {
    STOCKS.forEach((stock) => {
      expect(() => new URL(stock.logo)).not.toThrow();
    });
  });

  it("contains expected key stocks (NVDA, AMD, MSFT, GOOGL, AMZN)", () => {
    const symbols = STOCKS.map((s) => s.symbol);
    expect(symbols).toContain("NVDA");
    expect(symbols).toContain("AMD");
    expect(symbols).toContain("MSFT");
    expect(symbols).toContain("GOOGL");
    expect(symbols).toContain("AMZN");
  });

  it("stocks are sorted alphabetically by symbol", () => {
    const symbols = STOCKS.map((s) => s.symbol);
    const sorted = [...symbols].sort();
    expect(symbols).toEqual(sorted);
  });
});
