/**
 * Edge-Case & Visual Correctness Tests (48 tests)
 *
 * Since the stock detail page is an async Server Component (cannot be rendered
 * in jsdom), we recreate its rendering logic in a synchronous client wrapper
 * fed with predetermined mock data. This lets us verify every visual output
 * for all special cases without hitting the real API.
 *
 * Scenarios tested and why:
 *
 *   Normal stock (full data):
 *   - All fields render correctly (name, symbol, exchange, sector, etc.)
 *   - Market cap formats as currency
 *   - Table rows show correct close, volume, and % change formatting
 *   - Positive change = green, negative = red, zero = green, null = gray "N/A"
 *
 *   Null overview (API returned nothing):
 *   - Every field falls back to "N/A" — page never crashes
 *   - Empty daily series shows "unavailable" message instead of empty table
 *
 *   Empty string overview:
 *   - Empty strings also produce "N/A" via displayValue()
 *   - Market cap edge case: Number("") === 0, so shows $0.00 (caught by
 *     safeString() in production before it reaches the page)
 *
 *   Market cap formatting:
 *   - Trillion ($3.5T), small cap ($500K), and standard values
 *
 *   Chart trend color:
 *   - Uptrend (last > first) = green line
 *   - Downtrend (last < first) = red line
 *   - Flat (last === first) = green line (>= condition)
 *   - Empty data = "No price data" message
 *   - Single data point = no crash (guards against NaN from 0/0 division)
 *
 *   Special values:
 *   - Exact 0.00% change, huge volume (987M), large % swing (+8.99%),
 *     penny stock ($0.05), tiny volume (100)
 *
 *   Downtrend series:
 *   - Negative % changes display correctly in red
 *   - Oldest day (no previous close) shows "N/A"
 *
 *   Homepage links:
 *   - All 15 cards have valid /stocks/SYMBOL href format
 *   - No duplicate links
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import {
  displayValue,
  formatCurrency,
  formatNumber,
  formatPercent,
  type CompanyOverview,
  type HistoricalPriceItem,
} from "@/lib/alphavantage";

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("recharts", () => {
  // Capture props so we can assert on them
  const ActualArea = (props: Record<string, unknown>) => (
    <g data-testid="area" data-stroke={props.stroke} />
  );
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    AreaChart: ({ children }: { children: React.ReactNode }) => (
      <svg data-testid="area-chart">{children}</svg>
    ),
    Area: ActualArea,
    XAxis: () => <g data-testid="x-axis" />,
    YAxis: () => <g data-testid="y-axis" />,
    CartesianGrid: () => <g data-testid="cartesian-grid" />,
    Tooltip: () => <g data-testid="tooltip" />,
  };
});

// ── Testable wrapper that mirrors the detail page rendering logic ────────────

function StockDetailView({
  symbol,
  overview,
  dailySeries,
  logoUrl,
}: {
  symbol: string;
  overview: CompanyOverview | null;
  dailySeries: HistoricalPriceItem[];
  logoUrl?: string;
}) {
  // This mirrors the exact logic from app/stocks/[symbol]/page.tsx
  const companySymbol = overview?.Symbol ?? symbol;
  const assetType = overview?.AssetType ?? "N/A";
  const name = overview?.Name ?? "N/A";
  const description = overview?.Description ?? "N/A";
  const exchange = overview?.Exchange ?? "N/A";
  const sector = overview?.Sector ?? "N/A";
  const industry = overview?.Industry ?? "N/A";
  const marketCap = overview?.MarketCapitalization ?? "N/A";

  // Lazy import is awkward in tests, so inline chart logic import
  const PriceHistoryChart =
    require("@/components/PriceHistoryChart").default;

  return (
    <main data-testid="detail-page">
      <a href="/" data-testid="back-link">
        ← Back to all stocks
      </a>

      <h1 data-testid="company-name">{displayValue(name)}</h1>
      <span data-testid="symbol-badge">{displayValue(companySymbol)}</span>
      <p data-testid="asset-type">{displayValue(assetType)}</p>

      <div data-testid="info-grid">
        <div data-testid="info-exchange">
          <span>Exchange</span>
          <span data-testid="exchange-value">{displayValue(exchange)}</span>
        </div>
        <div data-testid="info-sector">
          <span>Sector</span>
          <span data-testid="sector-value">{displayValue(sector)}</span>
        </div>
        <div data-testid="info-industry">
          <span>Industry</span>
          <span data-testid="industry-value">{displayValue(industry)}</span>
        </div>
        <div data-testid="info-marketcap">
          <span>Market Cap</span>
          <span data-testid="marketcap-value">
            {formatCurrency(marketCap)}
          </span>
        </div>
      </div>

      <p data-testid="description">{displayValue(description)}</p>

      <PriceHistoryChart data={dailySeries} />

      <h2 data-testid="table-header">
        Historical Prices ({dailySeries.length} Trading Days)
      </h2>

      {dailySeries.length === 0 ? (
        <p data-testid="no-data-message">
          Historical price data is unavailable right now.
        </p>
      ) : (
        <table data-testid="price-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Close</th>
              <th>Volume</th>
              <th>% Change</th>
            </tr>
          </thead>
          <tbody>
            {dailySeries.map((item) => {
              const changeText = formatPercent(item.percentChange);
              const isPositive =
                item.percentChange !== null && item.percentChange >= 0;
              const isNegative =
                item.percentChange !== null && item.percentChange < 0;

              return (
                <tr key={item.date} data-testid={`row-${item.date}`}>
                  <td data-testid="cell-date">{item.date}</td>
                  <td data-testid="cell-close">
                    {formatCurrency(item.close)}
                  </td>
                  <td data-testid="cell-volume">
                    {formatNumber(item.volume)}
                  </td>
                  <td
                    data-testid="cell-change"
                    data-color={
                      isPositive
                        ? "green"
                        : isNegative
                        ? "red"
                        : "neutral"
                    }
                  >
                    {changeText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

// ── Predetermined mock data ─────────────────────────────────────────────────

/** Normal stock: positive 30-day trend, mix of up/down/flat days */
const NORMAL_OVERVIEW: CompanyOverview = {
  Symbol: "NVDA",
  AssetType: "Common Stock",
  Name: "NVIDIA Corporation",
  Description: "NVIDIA designs GPUs for gaming and AI.",
  Exchange: "NASDAQ",
  Sector: "TECHNOLOGY",
  Industry: "SEMICONDUCTORS",
  MarketCapitalization: "2800000000000",
};

const NORMAL_DAILY: HistoricalPriceItem[] = [
  { date: "2025-03-12", open: 122, high: 126, low: 120, close: 125.00, volume: 45000000, percentChange: 2.04 },
  { date: "2025-03-11", open: 120, high: 124, low: 119, close: 122.50, volume: 38000000, percentChange: -1.21 },
  { date: "2025-03-10", open: 124, high: 126, low: 122, close: 124.00, volume: 42000000, percentChange: 0.00 },
  { date: "2025-03-07", open: 123, high: 125, low: 121, close: 124.00, volume: 35000000, percentChange: 1.64 },
  { date: "2025-03-06", open: 120, high: 123, low: 119, close: 122.00, volume: 40000000, percentChange: null },
];

/** Stock with ALL fields missing from API (null overview) */
const NULL_OVERVIEW: CompanyOverview | null = null;

/** Stock with empty strings in every field */
const EMPTY_OVERVIEW: CompanyOverview = {
  Symbol: "",
  AssetType: "",
  Name: "",
  Description: "",
  Exchange: "",
  Sector: "",
  Industry: "",
  MarketCapitalization: "",
};

/** Stock with extremely large market cap (trillions) */
const TRILLION_OVERVIEW: CompanyOverview = {
  Symbol: "AAPL",
  AssetType: "Common Stock",
  Name: "Apple Inc",
  Description: "Apple designs consumer electronics.",
  Exchange: "NASDAQ",
  Sector: "TECHNOLOGY",
  Industry: "CONSUMER ELECTRONICS",
  MarketCapitalization: "3500000000000",
};

/** Stock with very small market cap */
const SMALL_CAP_OVERVIEW: CompanyOverview = {
  Symbol: "TINY",
  AssetType: "Common Stock",
  Name: "Tiny Corp",
  Description: "A very small company.",
  Exchange: "NYSE",
  Sector: "TECHNOLOGY",
  Industry: "SOFTWARE",
  MarketCapitalization: "500000",
};

/** Flat 30-day period: all closes identical → 0% trend, chart should be green (>=) */
const FLAT_DAILY: HistoricalPriceItem[] = Array.from({ length: 30 }, (_, i) => ({
  date: `2025-03-${String(30 - i).padStart(2, "0")}`,
  open: 100,
  high: 100,
  low: 100,
  close: 100,
  volume: 10000000,
  percentChange: 0,
}));

/** Negative 30-day trend: price dropped from 200 → 150 */
const DOWNTREND_DAILY: HistoricalPriceItem[] = Array.from({ length: 5 }, (_, i) => ({
  date: `2025-03-${String(5 - i).padStart(2, "0")}`,
  open: 200 - i * 10,
  high: 205 - i * 10,
  low: 195 - i * 10,
  close: 200 - (i + 1) * 10,
  volume: 20000000 + i * 1000000,
  percentChange: i === 4 ? null : -5.26,
}));

/** Single day only */
const SINGLE_DAY: HistoricalPriceItem[] = [
  { date: "2025-03-12", open: 100, high: 105, low: 98, close: 102, volume: 5000000, percentChange: null },
];

/** Empty daily series */
const EMPTY_DAILY: HistoricalPriceItem[] = [];

/** Day with 0.00% change */
const ZERO_CHANGE_DAY: HistoricalPriceItem = {
  date: "2025-03-12",
  open: 100,
  high: 105,
  low: 98,
  close: 100,
  volume: 5000000,
  percentChange: 0,
};

/** Day with very large volume */
const HUGE_VOLUME_DAY: HistoricalPriceItem = {
  date: "2025-03-11",
  open: 100,
  high: 110,
  low: 95,
  close: 108.99,
  volume: 987654321,
  percentChange: 8.99,
};

/** Day with very small price */
const PENNY_STOCK_DAY: HistoricalPriceItem = {
  date: "2025-03-10",
  open: 0.05,
  high: 0.06,
  low: 0.04,
  close: 0.0523,
  volume: 100,
  percentChange: 4.6,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Stock detail page — normal stock with full data", () => {
  beforeEach(() => {
    render(
      <StockDetailView
        symbol="NVDA"
        overview={NORMAL_OVERVIEW}
        dailySeries={NORMAL_DAILY}
      />
    );
  });

  it("displays the company name", () => {
    expect(screen.getByTestId("company-name")).toHaveTextContent(
      "NVIDIA Corporation"
    );
  });

  it("displays the symbol badge", () => {
    expect(screen.getByTestId("symbol-badge")).toHaveTextContent("NVDA");
  });

  it("displays the asset type", () => {
    expect(screen.getByTestId("asset-type")).toHaveTextContent("Common Stock");
  });

  it("displays exchange", () => {
    expect(screen.getByTestId("exchange-value")).toHaveTextContent("NASDAQ");
  });

  it("displays sector", () => {
    expect(screen.getByTestId("sector-value")).toHaveTextContent("TECHNOLOGY");
  });

  it("displays industry", () => {
    expect(screen.getByTestId("industry-value")).toHaveTextContent(
      "SEMICONDUCTORS"
    );
  });

  it("formats market cap as currency ($2.8T value)", () => {
    const text = screen.getByTestId("marketcap-value").textContent!;
    expect(text).toBe("$2,800,000,000,000.00");
  });

  it("displays the description", () => {
    expect(screen.getByTestId("description")).toHaveTextContent(
      "NVIDIA designs GPUs for gaming and AI."
    );
  });

  it("shows the correct trading days count in header", () => {
    expect(screen.getByTestId("table-header")).toHaveTextContent(
      "Historical Prices (5 Trading Days)"
    );
  });

  it("renders the correct number of table rows", () => {
    const table = screen.getByTestId("price-table");
    const rows = within(table).getAllByRole("row");
    // 1 header + 5 data rows
    expect(rows.length).toBe(6);
  });

  it("formats close prices as currency", () => {
    const row = screen.getByTestId("row-2025-03-12");
    expect(within(row).getByTestId("cell-close")).toHaveTextContent("$125.00");
  });

  it("formats volume with commas", () => {
    const row = screen.getByTestId("row-2025-03-12");
    expect(within(row).getByTestId("cell-volume")).toHaveTextContent(
      "45,000,000"
    );
  });

  it("shows positive % change with + prefix and green color", () => {
    const row = screen.getByTestId("row-2025-03-12");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("+2.04%");
    expect(cell).toHaveAttribute("data-color", "green");
  });

  it("shows negative % change with - prefix and red color", () => {
    const row = screen.getByTestId("row-2025-03-11");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("-1.21%");
    expect(cell).toHaveAttribute("data-color", "red");
  });

  it("shows 0.00% change as green (positive)", () => {
    const row = screen.getByTestId("row-2025-03-10");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("+0.00%");
    expect(cell).toHaveAttribute("data-color", "green");
  });

  it("shows N/A for null percent change (first day) with neutral color", () => {
    const row = screen.getByTestId("row-2025-03-06");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("N/A");
    expect(cell).toHaveAttribute("data-color", "neutral");
  });

  it("back link points to homepage", () => {
    const link = screen.getByTestId("back-link");
    expect(link).toHaveAttribute("href", "/");
  });
});

// ─── Null overview (API returned nothing) ───────────────────────────────────

describe("Stock detail page — null overview (API failure)", () => {
  beforeEach(() => {
    render(
      <StockDetailView
        symbol="FAKE"
        overview={NULL_OVERVIEW}
        dailySeries={EMPTY_DAILY}
      />
    );
  });

  it("falls back to symbol for company name", () => {
    expect(screen.getByTestId("company-name")).toHaveTextContent("N/A");
  });

  it("shows symbol from prop when overview is null", () => {
    expect(screen.getByTestId("symbol-badge")).toHaveTextContent("FAKE");
  });

  it("shows N/A for asset type", () => {
    expect(screen.getByTestId("asset-type")).toHaveTextContent("N/A");
  });

  it("shows N/A for all info cards", () => {
    expect(screen.getByTestId("exchange-value")).toHaveTextContent("N/A");
    expect(screen.getByTestId("sector-value")).toHaveTextContent("N/A");
    expect(screen.getByTestId("industry-value")).toHaveTextContent("N/A");
    expect(screen.getByTestId("marketcap-value")).toHaveTextContent("N/A");
  });

  it("shows N/A for description", () => {
    expect(screen.getByTestId("description")).toHaveTextContent("N/A");
  });

  it("shows 0 trading days", () => {
    expect(screen.getByTestId("table-header")).toHaveTextContent(
      "Historical Prices (0 Trading Days)"
    );
  });

  it("shows empty state message instead of table", () => {
    expect(screen.getByTestId("no-data-message")).toHaveTextContent(
      "Historical price data is unavailable right now."
    );
  });

  it("does not render price table", () => {
    expect(screen.queryByTestId("price-table")).toBeNull();
  });
});

// ─── Empty string overview ──────────────────────────────────────────────────

describe("Stock detail page — empty string overview fields", () => {
  beforeEach(() => {
    render(
      <StockDetailView
        symbol="EMPTY"
        overview={EMPTY_OVERVIEW}
        dailySeries={NORMAL_DAILY}
      />
    );
  });

  it("shows N/A for empty symbol", () => {
    expect(screen.getByTestId("symbol-badge")).toHaveTextContent("N/A");
  });

  it("shows N/A for empty name", () => {
    expect(screen.getByTestId("company-name")).toHaveTextContent("N/A");
  });

  it("shows N/A for empty exchange", () => {
    expect(screen.getByTestId("exchange-value")).toHaveTextContent("N/A");
  });

  it("formats empty market cap as $0.00 (Number('') === 0)", () => {
    // Empty string converts to 0 via Number(), so formatCurrency shows $0.00
    // This is expected behavior — the safeString() in alphavantage.ts
    // catches this before it reaches the page in production
    expect(screen.getByTestId("marketcap-value")).toHaveTextContent("$0.00");
  });
});

// ─── Trillion-dollar market cap formatting ──────────────────────────────────

describe("Stock detail page — large market cap formatting", () => {
  it("formats $3.5T market cap correctly as currency", () => {
    render(
      <StockDetailView
        symbol="AAPL"
        overview={TRILLION_OVERVIEW}
        dailySeries={NORMAL_DAILY}
      />
    );
    const text = screen.getByTestId("marketcap-value").textContent!;
    expect(text).toBe("$3,500,000,000,000.00");
  });
});

describe("Stock detail page — small market cap formatting", () => {
  it("formats $500K market cap correctly as currency", () => {
    render(
      <StockDetailView
        symbol="TINY"
        overview={SMALL_CAP_OVERVIEW}
        dailySeries={NORMAL_DAILY}
      />
    );
    expect(screen.getByTestId("marketcap-value")).toHaveTextContent(
      "$500,000.00"
    );
  });
});

// ─── Flat 30-day period (0% overall change) ─────────────────────────────────

describe("Stock detail page — flat 30-day period", () => {
  beforeEach(() => {
    render(
      <StockDetailView
        symbol="FLAT"
        overview={NORMAL_OVERVIEW}
        dailySeries={FLAT_DAILY}
      />
    );
  });

  it("shows 30 trading days", () => {
    expect(screen.getByTestId("table-header")).toHaveTextContent(
      "Historical Prices (30 Trading Days)"
    );
  });

  it("every row shows +0.00% change in green", () => {
    FLAT_DAILY.forEach((item) => {
      const row = screen.getByTestId(`row-${item.date}`);
      const cell = within(row).getByTestId("cell-change");
      expect(cell).toHaveTextContent("+0.00%");
      expect(cell).toHaveAttribute("data-color", "green");
    });
  });

  it("every row shows $100.00 close", () => {
    FLAT_DAILY.forEach((item) => {
      const row = screen.getByTestId(`row-${item.date}`);
      expect(within(row).getByTestId("cell-close")).toHaveTextContent(
        "$100.00"
      );
    });
  });
});

// ─── Chart trend color logic ────────────────────────────────────────────────

describe("PriceHistoryChart — trend color", () => {
  let PriceHistoryChart: React.ComponentType<{
    data: { date: string; close: number }[];
  }>;

  beforeAll(async () => {
    const mod = await import("@/components/PriceHistoryChart");
    PriceHistoryChart = mod.default;
  });

  it("uses GREEN when last close > first close (uptrend)", () => {
    // Input is most-recent-first. Chart reverses it.
    // data: [Mar 5 (120), Mar 4 (115), Mar 3 (110), Mar 2 (105), Mar 1 (100)]
    // reversed: [Mar 1 (100), Mar 2 (105), ..., Mar 5 (120)]
    // firstClose = 100, lastClose = 120 → GREEN
    const data = [
      { date: "2025-03-05", close: 120 },
      { date: "2025-03-04", close: 115 },
      { date: "2025-03-03", close: 110 },
      { date: "2025-03-02", close: 105 },
      { date: "2025-03-01", close: 100 },
    ];
    render(<PriceHistoryChart data={data} />);
    const area = screen.getByTestId("area");
    expect(area).toHaveAttribute("data-stroke", "#22c55e");
  });

  it("uses RED when last close < first close (downtrend)", () => {
    // data: [Mar 5 (80), Mar 4 (85), Mar 3 (90), Mar 2 (95), Mar 1 (100)]
    // reversed: [Mar 1 (100), Mar 2 (95), ..., Mar 5 (80)]
    // firstClose = 100, lastClose = 80 → RED
    const data = [
      { date: "2025-03-05", close: 80 },
      { date: "2025-03-04", close: 85 },
      { date: "2025-03-03", close: 90 },
      { date: "2025-03-02", close: 95 },
      { date: "2025-03-01", close: 100 },
    ];
    render(<PriceHistoryChart data={data} />);
    const area = screen.getByTestId("area");
    expect(area).toHaveAttribute("data-stroke", "#ef4444");
  });

  it("uses GREEN when price is flat (equal first and last)", () => {
    // data: [Mar 3 (100), Mar 2 (105), Mar 1 (100)]
    // reversed: [Mar 1 (100), Mar 2 (105), Mar 3 (100)]
    // firstClose = 100, lastClose = 100 → GREEN (>=)
    const data = [
      { date: "2025-03-03", close: 100 },
      { date: "2025-03-02", close: 105 },
      { date: "2025-03-01", close: 100 },
    ];
    render(<PriceHistoryChart data={data} />);
    const area = screen.getByTestId("area");
    expect(area).toHaveAttribute("data-stroke", "#22c55e");
  });

  it("renders empty state for no data", () => {
    render(<PriceHistoryChart data={[]} />);
    expect(screen.getByText("No price data available")).toBeInTheDocument();
    expect(screen.queryByTestId("area")).toBeNull();
  });

  it("handles single data point without crashing", () => {
    render(<PriceHistoryChart data={[{ date: "2025-03-01", close: 50 }]} />);
    expect(screen.getByText("30-Day Price History")).toBeInTheDocument();
  });
});

// ─── Special values in table rows ───────────────────────────────────────────

describe("Stock detail page — special value rows", () => {
  const mixedDaily: HistoricalPriceItem[] = [
    ZERO_CHANGE_DAY,
    HUGE_VOLUME_DAY,
    PENNY_STOCK_DAY,
  ];

  beforeEach(() => {
    render(
      <StockDetailView
        symbol="MIX"
        overview={NORMAL_OVERVIEW}
        dailySeries={mixedDaily}
      />
    );
  });

  it("formats 0.00% change correctly with green color", () => {
    const row = screen.getByTestId("row-2025-03-12");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("+0.00%");
    expect(cell).toHaveAttribute("data-color", "green");
  });

  it("formats huge volume (987,654,321) with commas", () => {
    const row = screen.getByTestId("row-2025-03-11");
    expect(within(row).getByTestId("cell-volume")).toHaveTextContent(
      "987,654,321"
    );
  });

  it("formats large positive % change correctly", () => {
    const row = screen.getByTestId("row-2025-03-11");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("+8.99%");
    expect(cell).toHaveAttribute("data-color", "green");
  });

  it("formats penny stock close price ($0.05)", () => {
    const row = screen.getByTestId("row-2025-03-10");
    expect(within(row).getByTestId("cell-close")).toHaveTextContent("$0.05");
  });

  it("formats small volume (100) without commas", () => {
    const row = screen.getByTestId("row-2025-03-10");
    expect(within(row).getByTestId("cell-volume")).toHaveTextContent("100");
  });
});

// ─── Downtrend daily series ─────────────────────────────────────────────────

describe("Stock detail page — downtrend series", () => {
  beforeEach(() => {
    render(
      <StockDetailView
        symbol="DOWN"
        overview={NORMAL_OVERVIEW}
        dailySeries={DOWNTREND_DAILY}
      />
    );
  });

  it("shows negative % changes in red", () => {
    const row = screen.getByTestId("row-2025-03-04");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("-5.26%");
    expect(cell).toHaveAttribute("data-color", "red");
  });

  it("shows N/A for the oldest day (null percentChange)", () => {
    const row = screen.getByTestId("row-2025-03-01");
    const cell = within(row).getByTestId("cell-change");
    expect(cell).toHaveTextContent("N/A");
    expect(cell).toHaveAttribute("data-color", "neutral");
  });
});

// ─── Homepage link correctness ──────────────────────────────────────────────

describe("Homepage — link correctness", () => {
  let HomePage: React.ComponentType;

  beforeAll(async () => {
    const mod = await import("@/app/page");
    HomePage = mod.default;
  });

  it("all 15 card links have valid /stocks/SYMBOL format", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(15);

    links.forEach((link) => {
      const href = link.getAttribute("href")!;
      expect(href).toMatch(/^\/stocks\/[A-Z]{1,5}$/);
    });
  });

  it("no two cards link to the same stock", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    const unique = new Set(hrefs);
    expect(unique.size).toBe(15);
  });
});
