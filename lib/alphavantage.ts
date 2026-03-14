import fs from "fs";
import path from "path";

export type CompanyOverview = {
  Symbol?: string;
  AssetType?: string;
  Name?: string;
  Description?: string;
  Exchange?: string;
  Sector?: string;
  Industry?: string;
  MarketCapitalization?: string;
};

export type HistoricalPriceItem = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  percentChange: number | null;
};

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

// ─── Disk cache with timestamps (survives server restarts) ──────────────────
//
// Strategy: "live-first, cache-fallback"
//   1. If disk cache is fresh (< 24 h), use it directly (saves API calls).
//   2. If cache is stale or missing, try the live API.
//   3. If the API succeeds, update the cache with fresh data.
//   4. If the API fails (rate-limited / quota exhausted), fall back to whatever
//      is on disk — even if it's older than 24 h. Stale real data is always
//      better than showing N/A.
//
// The .cache/ folder is committed to the repo so the app works immediately
// on a fresh clone without needing any API calls.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_DIR = path.join(process.cwd(), ".cache");

type DiskCacheEntry<T> = {
  fetchedAt: number; // epoch ms – when this data was fetched from the API
  data: T;
};

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readDiskEntry<T>(key: string): DiskCacheEntry<T> | null {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    // Support old cache files that stored bare data (no wrapper)
    if (parsed && typeof parsed === "object" && "fetchedAt" in parsed && "data" in parsed) {
      return parsed as DiskCacheEntry<T>;
    }

    // Legacy format — wrap it with "now" so it's treated as stale and will
    // be refreshed on the next API call, but still usable as a fallback.
    return { fetchedAt: 0, data: parsed as T };
  } catch {
    return null;
  }
}

function writeDiskEntry<T>(key: string, data: T) {
  try {
    ensureCacheDir();
    const entry: DiskCacheEntry<T> = { fetchedAt: Date.now(), data };
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), "utf-8");
  } catch (err) {
    console.error("[Cache] Failed to write disk cache:", err);
  }
}

// ─── In-memory layer (avoids repeated disk reads within the same session) ───

type MemEntry<T> = { fetchedAt: number; data: T };
const memoryCache = new Map<string, MemEntry<unknown>>();

/** Check if a timestamp is from today (same calendar date). */
function isSameDay(epochMs: number): boolean {
  const cached = new Date(epochMs);
  const now = new Date();
  return (
    cached.getFullYear() === now.getFullYear() &&
    cached.getMonth() === now.getMonth() &&
    cached.getDate() === now.getDate()
  );
}

/** Returns cached data if it was fetched today. Otherwise returns null. */
function getFreshCache<T>(key: string): T | null {
  // 1. In-memory (fastest)
  const mem = memoryCache.get(key);
  if (mem && isSameDay(mem.fetchedAt)) {
    return mem.data as T;
  }

  // 2. Disk
  const disk = readDiskEntry<T>(key);
  if (disk && isSameDay(disk.fetchedAt)) {
    memoryCache.set(key, { fetchedAt: disk.fetchedAt, data: disk.data });
    return disk.data;
  }

  return null;
}

/** Returns any cached data regardless of age (fallback). */
function getStaleFallback<T>(key: string): T | null {
  // Check memory first
  const mem = memoryCache.get(key);
  if (mem) return mem.data as T;

  // Then disk
  const disk = readDiskEntry<T>(key);
  if (disk) {
    memoryCache.set(key, { fetchedAt: disk.fetchedAt, data: disk.data });
    return disk.data;
  }

  return null;
}

function setCache<T>(key: string, data: T) {
  memoryCache.set(key, { fetchedAt: Date.now(), data });
  writeDiskEntry(key, data);
}

/** Check whether both overview and daily caches are fresh for a symbol. */
export function hasFreshCache(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return getFreshCache(`overview_${s}`) !== null && getFreshCache(`daily_${s}`) !== null;
}

// ─── Formatting utilities ───────────────────────────────────────────────────

function safeString(value?: string): string {
  if (!value || value.trim() === "" || value.trim().toLowerCase() === "none") {
    return "N/A";
  }
  return value;
}

export function displayValue(value?: string | number | null): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string" && value.trim() === "") return "N/A";
  return String(value);
}

export function formatCurrency(value?: string | number | null): string {
  if (value === null || value === undefined || value === "N/A") return "N/A";

  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value?: string | number | null): string {
  if (value === null || value === undefined || value === "N/A") return "N/A";

  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "N/A";

  return new Intl.NumberFormat("en-US").format(num);
}

export function formatMarketCap(value?: string | number | null): string {
  if (value === null || value === undefined || value === "N/A") return "N/A";

  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "N/A";

  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)} trillion`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)} billion`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)} million`;
  return formatCurrency(num);
}

export function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

// ─── API fetch ──────────────────────────────────────────────────────────────

async function alphaFetch(params: Record<string, string>) {
  if (!API_KEY) {
    console.warn("[AlphaVantage] No API key set — skipping API call, using cache.");
    return null;
  }

  const url = new URL(BASE_URL);
  Object.entries({
    ...params,
    apikey: API_KEY,
  }).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString(), {
    method: "GET",
    // Next fetch cache hint. Helpful in production.
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed with status ${response.status}`);
  }

  const data = await response.json();

  // Rate-limit or quota messages — return null instead of throwing so
  // Next.js dev mode doesn't show an error overlay. The callers will
  // gracefully fall back to cached data.
  if (data?.Note || data?.Information) {
    console.warn("[AlphaVantage] API limit reached, falling back to cache.");
    return null;
  }

  if (data?.ErrorMessage) {
    throw new Error(data.ErrorMessage);
  }

  return data;
}

// ─── Data fetchers ──────────────────────────────────────────────────────────

export async function getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `overview_${upperSymbol}`;

  // 1. Return fresh cache immediately (saves an API call)
  const fresh = getFreshCache<CompanyOverview>(cacheKey);
  if (fresh !== null) return fresh;

  // 2. Cache is stale or missing — try the live API
  try {
    const data = await alphaFetch({
      function: "OVERVIEW",
      symbol: upperSymbol,
    });

    const hasUsefulData = data && Object.keys(data).length > 0 && data.Symbol;

    if (!hasUsefulData) {
      // API returned empty — fall back to stale cache if available
      return getStaleFallback<CompanyOverview>(cacheKey);
    }

    const overview: CompanyOverview = {
      Symbol: safeString(data.Symbol),
      AssetType: safeString(data.AssetType),
      Name: safeString(data.Name),
      Description: safeString(data.Description),
      Exchange: safeString(data.Exchange),
      Sector: safeString(data.Sector),
      Industry: safeString(data.Industry),
      MarketCapitalization: safeString(data.MarketCapitalization),
    };

    setCache(cacheKey, overview);
    return overview;
  } catch (error) {
    console.error(`[AlphaVantage] Overview error for ${upperSymbol}:`, error);

    // 3. API failed (likely rate-limited) — fall back to stale cache
    const fallback = getStaleFallback<CompanyOverview>(cacheKey);
    if (fallback) {
      console.log(`[Cache] Using cached overview for ${upperSymbol} (API unavailable)`);
    }
    return fallback;
  }
}

export async function getDailySeries(symbol: string): Promise<HistoricalPriceItem[]> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `daily_${upperSymbol}`;

  // 1. Return fresh cache immediately (saves an API call)
  const fresh = getFreshCache<HistoricalPriceItem[]>(cacheKey);
  if (fresh !== null) return fresh;

  // 2. Cache is stale or missing — try the live API
  try {
    const data = await alphaFetch({
      function: "TIME_SERIES_DAILY",
      symbol: upperSymbol,
      outputsize: "compact",
    });

    const series = data?.["Time Series (Daily)"];
    if (!series || typeof series !== "object") {
      // API returned empty — fall back to stale cache if available
      return getStaleFallback<HistoricalPriceItem[]>(cacheKey) ?? [];
    }

    const dates = Object.keys(series).sort((a, b) => b.localeCompare(a));

    const items: HistoricalPriceItem[] = dates.map((date, index) => {
      const day = series[date];
      const open = Number(day["1. open"]);
      const high = Number(day["2. high"]);
      const low = Number(day["3. low"]);
      const close = Number(day["4. close"]);
      const volume = Number(day["5. volume"]);

      const prevDate = dates[index + 1];
      const prevClose = prevDate ? Number(series[prevDate]["4. close"]) : null;

      const percentChange =
        prevClose && Number.isFinite(prevClose) && prevClose !== 0
          ? ((close - prevClose) / prevClose) * 100
          : null;

      return {
        date,
        open,
        high,
        low,
        close,
        volume,
        percentChange,
      };
    });

    setCache(cacheKey, items);
    return items;
  } catch (error) {
    console.error(`[AlphaVantage] Daily series error for ${upperSymbol}:`, error);

    // 3. API failed (likely rate-limited) — fall back to stale cache
    const fallback = getStaleFallback<HistoricalPriceItem[]>(cacheKey);
    if (fallback) {
      console.log(`[Cache] Using cached daily series for ${upperSymbol} (API unavailable)`);
      return fallback;
    }
    return [];
  }
}
