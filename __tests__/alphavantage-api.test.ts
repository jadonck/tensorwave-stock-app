/**
 * AlphaVantage API Integration Tests
 *
 * Tests the two core data fetchers (getCompanyOverview, getDailySeries) using
 * mocked fetch — no real API calls are made.
 *
 * What is tested and why:
 *   - Successful responses: verifies correct parsing of Company Overview and
 *     Time Series Daily JSON into our typed data structures
 *   - Empty/missing data: ensures the app returns null/[] instead of crashing
 *     when the API returns an empty object or missing "Time Series" key
 *   - Error responses: API error messages and non-200 status codes are handled
 *     gracefully (returns null/[], never throws to the page)
 *   - Rate limit handling: the API "Note" and "Information" messages that
 *     indicate quota exhaustion return null so the caller can fall back to cache
 *   - URL construction: verifies the correct query params (function, symbol,
 *     apikey, outputsize) are sent to AlphaVantage
 *   - Caching: confirms a second call for the same symbol reuses the first
 *     result without making another fetch
 *   - Percent change calculation: validates the day-over-day % change math
 *     including the null case for the oldest day (no previous close)
 *
 * fs is mocked so the disk cache always misses — isolating API logic from I/O.
 * Console output (error/warn/log) is suppressed to keep test output clean.
 */

const MOCK_OVERVIEW_RESPONSE = {
  Symbol: "NVDA",
  AssetType: "Common Stock",
  Name: "NVIDIA Corporation",
  Description: "NVIDIA designs GPUs.",
  Exchange: "NASDAQ",
  Sector: "TECHNOLOGY",
  Industry: "SEMICONDUCTORS",
  MarketCapitalization: "2800000000000",
};

const MOCK_DAILY_RESPONSE = {
  "Meta Data": {
    "1. Information": "Daily Prices",
    "2. Symbol": "NVDA",
  },
  "Time Series (Daily)": {
    "2025-03-12": {
      "1. open": "120.00",
      "2. high": "125.00",
      "3. low": "118.00",
      "4. close": "123.50",
      "5. volume": "45000000",
    },
    "2025-03-11": {
      "1. open": "118.00",
      "2. high": "121.00",
      "3. low": "117.00",
      "4. close": "120.00",
      "5. volume": "38000000",
    },
    "2025-03-10": {
      "1. open": "115.00",
      "2. high": "119.00",
      "3. low": "114.00",
      "4. close": "118.00",
      "5. volume": "42000000",
    },
  },
};

// Mock fs so disk cache always misses (no real file I/O in tests)
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(""),
  writeFileSync: jest.fn(),
}));

// Set env var before importing the module
process.env.ALPHA_VANTAGE_API_KEY = "test-key";

// We need to clear the module cache between tests to reset the in-memory cache
let getCompanyOverview: typeof import("@/lib/alphavantage").getCompanyOverview;
let getDailySeries: typeof import("@/lib/alphavantage").getDailySeries;

beforeEach(async () => {
  // Clear module cache so each test starts with fresh in-memory cache
  jest.resetModules();
  // Re-apply fs mock after module reset
  jest.mock("fs", () => ({
    existsSync: jest.fn().mockReturnValue(false),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn().mockReturnValue(""),
    writeFileSync: jest.fn(),
  }));
  // Suppress expected console output from error-handling tests
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  const mod = await import("@/lib/alphavantage");
  getCompanyOverview = mod.getCompanyOverview;
  getDailySeries = mod.getDailySeries;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getCompanyOverview", () => {
  it("returns parsed overview data on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_OVERVIEW_RESPONSE,
    });

    const result = await getCompanyOverview("NVDA");

    expect(result).not.toBeNull();
    expect(result?.Symbol).toBe("NVDA");
    expect(result?.Name).toBe("NVIDIA Corporation");
    expect(result?.Exchange).toBe("NASDAQ");
    expect(result?.Sector).toBe("TECHNOLOGY");
    expect(result?.Industry).toBe("SEMICONDUCTORS");
    expect(result?.MarketCapitalization).toBe("2800000000000");
  });

  it("returns null when API returns empty object", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await getCompanyOverview("FAKE");
    expect(result).toBeNull();
  });

  it("returns null when API returns an error message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ErrorMessage: "Invalid API call",
      }),
    });

    const result = await getCompanyOverview("INVALID");
    expect(result).toBeNull();
  });

  it("returns null when API returns rate limit note", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Note: "Thank you for using Alpha Vantage! Please visit https://www.alphavantage.co/premium/ ...",
      }),
    });

    const result = await getCompanyOverview("NVDA");
    expect(result).toBeNull();
  });

  it("returns null when fetch fails with non-ok status", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await getCompanyOverview("NVDA");
    expect(result).toBeNull();
  });

  it("uses correct API URL parameters", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_OVERVIEW_RESPONSE,
    });

    await getCompanyOverview("nvda");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(url.searchParams.get("function")).toBe("OVERVIEW");
    expect(url.searchParams.get("symbol")).toBe("NVDA");
    expect(url.searchParams.get("apikey")).toBe("test-key");
  });
});

describe("getDailySeries", () => {
  it("returns parsed daily series data sorted by date descending", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_DAILY_RESPONSE,
    });

    const result = await getDailySeries("NVDA");

    expect(result.length).toBe(3);
    // Most recent first
    expect(result[0].date).toBe("2025-03-12");
    expect(result[1].date).toBe("2025-03-11");
    expect(result[2].date).toBe("2025-03-10");
  });

  it("parses OHLCV values correctly", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_DAILY_RESPONSE,
    });

    const result = await getDailySeries("NVDA");

    expect(result[0].open).toBe(120);
    expect(result[0].high).toBe(125);
    expect(result[0].low).toBe(118);
    expect(result[0].close).toBe(123.5);
    expect(result[0].volume).toBe(45000000);
  });

  it("calculates percent change from previous day", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_DAILY_RESPONSE,
    });

    const result = await getDailySeries("NVDA");

    // 2025-03-12: close=123.5, prev close=120 → (123.5-120)/120*100 = 2.9167%
    expect(result[0].percentChange).toBeCloseTo(2.9167, 2);

    // 2025-03-11: close=120, prev close=118 → (120-118)/118*100 = 1.6949%
    expect(result[1].percentChange).toBeCloseTo(1.6949, 2);

    // 2025-03-10: no previous day → null
    expect(result[2].percentChange).toBeNull();
  });

  it("returns empty array when API returns no series data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ "Meta Data": {} }),
    });

    const result = await getDailySeries("FAKE");
    expect(result).toEqual([]);
  });

  it("returns empty array when API returns error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ErrorMessage: "Invalid API call",
      }),
    });

    const result = await getDailySeries("INVALID");
    expect(result).toEqual([]);
  });

  it("uses correct API URL parameters including outputsize", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_DAILY_RESPONSE,
    });

    await getDailySeries("nvda");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(url.searchParams.get("function")).toBe("TIME_SERIES_DAILY");
    expect(url.searchParams.get("symbol")).toBe("NVDA");
    expect(url.searchParams.get("outputsize")).toBe("compact");
  });

  it("caches results and does not re-fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_DAILY_RESPONSE,
    });

    const result1 = await getDailySeries("NVDA");
    const result2 = await getDailySeries("NVDA");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result1).toEqual(result2);
  });
});
