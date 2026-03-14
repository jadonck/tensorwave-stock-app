import Link from "next/link";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import StockLogo from "@/components/StockLogo";
import { STOCKS } from "@/lib/stocks";
import {
  displayValue,
  formatCurrency,
  formatMarketCap,
  formatNumber,
  formatPercent,
  getCompanyOverview,
  getDailySeries,
  hasFreshCache,
} from "@/lib/alphavantage";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function StockDetailsPage({ params }: PageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  // Find stock meta for the logo
  const stockMeta = STOCKS.find((s) => s.symbol === upperSymbol);

  if (!stockMeta) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0c0c0c] via-[#111118] to-[#0c0c0c] px-4 py-8 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">Stock Not Found</h1>
          <p className="text-slate-400 mb-6">
            <span className="font-semibold text-[#2e86de]">{upperSymbol}</span> is not in our tracked stocks.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#2e86de] hover:text-[#5aa3e8] transition-colors"
          >
            &larr; Back to all stocks
          </Link>
        </div>
      </main>
    );
  }

  const logoUrl = stockMeta.logo;

  // Check if we have fresh cache — if so, skip the long API delay
  const cached = hasFreshCache(upperSymbol);

  const overview = await getCompanyOverview(upperSymbol);

  // 2-second delay between live API calls to respect the 1 req/sec rate limit.
  // Only 500ms when serving from cache (small buffer for smooth loading UX).
  await sleep(cached ? 500 : 2000);

  const allDailySeries = await getDailySeries(upperSymbol);
  const dailySeries = allDailySeries.slice(0, 30);

  const companySymbol = overview?.Symbol ?? upperSymbol;
  const assetType = overview?.AssetType ?? "N/A";
  const name = overview?.Name ?? "N/A";
  const description = overview?.Description ?? "N/A";
  const exchange = overview?.Exchange ?? "N/A";
  const sector = overview?.Sector ?? "N/A";
  const industry = overview?.Industry ?? "N/A";
  const marketCap = overview?.MarketCapitalization ?? "N/A";

  // Derive latest trading date from the data for the "Data as of" label
  const latestDate = dailySeries.length > 0
    ? new Date(dailySeries[0].date + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0c0c0c] via-[#111118] to-[#0c0c0c] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#2e86de] hover:text-[#5aa3e8] transition-colors"
        >
          &larr; Back to all stocks
        </Link>

        {/* Header with logo */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-slate-500/30 shrink-0">
            <StockLogo
              src={logoUrl ?? ""}
              alt={`${displayValue(name)} logo`}
              symbol={upperSymbol}
              size={48}
            />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
                {displayValue(name)}
              </h1>
              <span className="rounded-full bg-[#2e86de] px-3 py-1 text-sm font-semibold text-white">
                {displayValue(companySymbol)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {displayValue(assetType)}
              {latestDate && (
                <span className="ml-3 text-slate-500">
                  · Data as of {latestDate}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Info grid + Chart */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            {/* Key facts */}
            <div className="grid gap-4 grid-cols-2">
              <InfoCard label="Exchange" value={displayValue(exchange)} />
              <InfoCard label="Sector" value={displayValue(sector)} />
              <InfoCard label="Industry" value={displayValue(industry)} />
              <InfoCard label="Market Cap" value={formatMarketCap(marketCap)} />
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-slate-600/40 bg-[#232336] p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-bold text-white">
                About
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                {displayValue(description)}
              </p>
            </div>
          </section>

          <section>
            <PriceHistoryChart data={dailySeries} />
          </section>
        </div>

        {/* Historical prices table */}
        <section className="mt-8 rounded-2xl border border-slate-600/40 bg-[#232336] p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-2xl font-bold text-white">
            Historical Prices{" "}
            <span className="text-lg font-medium text-slate-500">
              ({dailySeries.length} Trading Days)
            </span>
          </h2>

          {dailySeries.length === 0 ? (
            <p className="text-slate-500">
              Historical price data is unavailable right now.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-600/40 text-left">
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                      Date
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                      Close
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                      Volume
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                      % Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySeries.map((item) => {
                    const changeText = formatPercent(item.percentChange);
                    const isExactZero =
                      item.percentChange !== null && item.percentChange === 0;
                    const isPositive =
                      item.percentChange !== null && item.percentChange > 0;
                    const isNegative =
                      item.percentChange !== null && item.percentChange < 0;

                    return (
                      <tr
                        key={item.date}
                        className="border-b border-slate-700/40 transition-colors hover:bg-[#2a2a40]"
                      >
                        <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-300 sm:px-6">
                          {item.date}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-300 sm:px-6">
                          {formatCurrency(item.close)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-300 sm:px-6">
                          {formatNumber(item.volume)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3 text-sm font-semibold sm:px-6 ${
                            isExactZero
                              ? "text-white"
                              : isPositive
                              ? "text-emerald-400"
                              : isNegative
                              ? "text-red-400"
                              : "text-slate-500"
                          }`}
                        >
                          {changeText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-600/40 bg-[#232336] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-white truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
